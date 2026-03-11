/**
 * Booking Engine
 * Бизнес-логика бронирования с защитой от double booking
 */

const { format, parseISO, addMinutes } = require('date-fns');

class BookingEngine {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Создание записи с защитой от double booking
   */
  async createBooking({ businessId, serviceId, date, time, clientName, clientPhone, telegramId, notes }) {
    const prisma = this.prisma;
    
    // Начать транзакцию
    return await prisma.$transaction(async (tx) => {
      // 1. Получить услугу
      const service = await tx.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        return { success: false, error: 'Service not found', code: 'SERVICE_NOT_FOUND' };
      }
      
      if (!service.isActive) {
        return { success: false, error: 'Service is not active', code: 'SERVICE_INACTIVE' };
      }
      
      // 2. Получить бизнес
      const business = await tx.business.findUnique({
        where: { id: businessId }
      });
      
      if (!business) {
        return { success: false, error: 'Business not found', code: 'BUSINESS_NOT_FOUND' };
      }
      
      // 3. Проверить дату
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateObj < today) {
        return { success: false, error: 'Cannot book in the past', code: 'PAST_DATE' };
      }
      
      const maxDate = addMinutes(today, business.maxDaysAhead * 24 * 60);
      if (dateObj > maxDate) {
        return { success: false, error: 'Date too far in the future', code: 'DATE_TOO_FAR' };
      }
      
      // 4. Рассчитать время окончания
      const [hours, minutes] = time.split(':').map(Number);
      const startTimeMinutes = hours * 60 + minutes;
      const endTimeMinutes = startTimeMinutes + service.durationMinutes;
      const endTime = this.minutesToTime(endTimeMinutes);
      
      // 5. Проверить доступность слота (с блокировкой)
      const existingBooking = await tx.booking.findFirst({
        where: {
          businessId,
          date: dateObj,
          status: { in: ['pending', 'confirmed'] },
          OR: [
            {
              // Начало нового слота внутри существующего
              startTime: { lte: time },
              endTime: { gt: time }
            },
            {
              // Конец нового слота внутри существующего
              startTime: { lt: endTime },
              endTime: { gte: endTime }
            },
            {
              // Новый слот полностью перекрывает существующий
              startTime: { gte: time },
              endTime: { lte: endTime }
            }
          ]
        }
      });
      
      if (existingBooking) {
        return { success: false, error: 'Slot already booked', code: 'SLOT_TAKEN' };
      }
      
      // 6. Проверить минимальное время до записи
      const now = new Date();
      const bookingDateTime = new Date(dateObj);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      const minBookingMs = business.minBookingMinutes * 60 * 1000;
      if (bookingDateTime.getTime() - now.getTime() < minBookingMs) {
        return { success: false, error: 'Too short notice', code: 'TOO_SHORT_NOTICE' };
      }
      
      // 7. Создать запись
      const booking = await tx.booking.create({
        data: {
          businessId,
          serviceId,
          date: dateObj,
          startTime: time,
          endTime,
          clientName,
          clientPhone,
          telegramId,
          status: business.autoConfirm ? 'confirmed' : 'pending',
          serviceName: service.name,
          price: service.price,
          duration: service.durationMinutes,
          notes
        },
        include: {
          service: true
        }
      });
      
      // 8. Инвалидировать кэш слотов
      const SlotEngine = require('../slot-engine');
      const slotEngine = new SlotEngine(prisma);
      await slotEngine.invalidateCache(businessId, dateObj);
      
      return { success: true, booking };
    });
  }

  /**
   * Отмена записи
   */
  async cancelBooking(bookingId, reason, cancelledBy) {
    const prisma = this.prisma;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Получить запись
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { business: true }
      });
      
      if (!booking) {
        return { success: false, error: 'Booking not found', code: 'BOOKING_NOT_FOUND' };
      }
      
      if (booking.status === 'cancelled') {
        return { success: false, error: 'Booking already cancelled', code: 'ALREADY_CANCELLED' };
      }
      
      // 2. Проверить время до записи
      const now = new Date();
      const bookingDateTime = new Date(booking.date);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilBooking < booking.business.cancellationHours) {
        return { 
          success: false, 
          error: `Cannot cancel less than ${booking.business.cancellationHours} hours before`, 
          code: 'TOO_LATE_TO_CANCEL' 
        };
      }
      
      // 3. Отменить запись
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy,
          cancelReason: reason
        },
        include: { service: true }
      });
      
      // 4. Инвалидировать кэш
      const SlotEngine = require('../slot-engine');
      const slotEngine = new SlotEngine(prisma);
      await slotEngine.invalidateCache(booking.businessId, booking.date);
      
      return { success: true, booking: updatedBooking };
    });
  }

  /**
   * Перенос записи
   */
  async rescheduleBooking(bookingId, newDate, newTime) {
    const prisma = this.prisma;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Получить запись
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });
      
      if (!booking) {
        return { success: false, error: 'Booking not found', code: 'BOOKING_NOT_FOUND' };
      }
      
      if (booking.status === 'cancelled') {
        return { success: false, error: 'Cannot reschedule cancelled booking', code: 'BOOKING_CANCELLED' };
      }
      
      // 2. Рассчитать новое время окончания
      const [hours, minutes] = newTime.split(':').map(Number);
      const startTimeMinutes = hours * 60 + minutes;
      const endTimeMinutes = startTimeMinutes + booking.duration;
      const endTime = this.minutesToTime(endTimeMinutes);
      
      const newDateObj = typeof newDate === 'string' ? parseISO(newDate) : newDate;
      
      // 3. Проверить доступность нового слота
      const existingBooking = await tx.booking.findFirst({
        where: {
          businessId: booking.businessId,
          date: newDateObj,
          status: { in: ['pending', 'confirmed'] },
          id: { not: bookingId }, // Исключить текущую запись
          OR: [
            {
              startTime: { lte: newTime },
              endTime: { gt: newTime }
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime }
            }
          ]
        }
      });
      
      if (existingBooking) {
        return { success: false, error: 'New slot already booked', code: 'SLOT_TAKEN' };
      }
      
      // 4. Обновить запись
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          date: newDateObj,
          startTime: newTime,
          endTime
        },
        include: { service: true }
      });
      
      // 5. Инвалидировать кэш для обеих дат
      const SlotEngine = require('../slot-engine');
      const slotEngine = new SlotEngine(prisma);
      await slotEngine.invalidateCache(booking.businessId, booking.date);
      await slotEngine.invalidateCache(booking.businessId, newDateObj);
      
      return { success: true, booking: updatedBooking };
    });
  }

  /**
   * Получить записи на дату
   */
  async getBookingsByDate(businessId, date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    return await this.prisma.booking.findMany({
      where: {
        businessId,
        date: dateObj,
        status: { in: ['pending', 'confirmed'] }
      },
      include: {
        service: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Утилита конвертации минут в время
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

module.exports = BookingEngine;
