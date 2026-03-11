/**
 * Slot Generation Engine
 * Динамическая генерация и кэширование временных слотов
 */

const { addDays, format, parseISO, startOfDay, endOfDay, isBefore, isAfter, addHours } = require('date-fns');

class SlotEngine {
  constructor(prisma) {
    this.prisma = prisma;
    this.cacheDays = parseInt(process.env.SLOT_CACHE_DAYS) || 14;
    this.cacheTTLHours = parseInt(process.env.SLOT_CACHE_TTL_HOURS) || 24;
  }

  /**
   * Получить доступные слоты на дату
   */
  async getAvailableSlots(businessId, date, serviceId) {
    // 1. Попробовать получить из кэша
    const cachedSlots = await this.getCachedSlots(businessId, date, serviceId);
    
    if (cachedSlots && cachedSlots.length > 0) {
      return this.filterAvailableSlots(cachedSlots);
    }
    
    // 2. Если нет в кэше - сгенерировать
    const slots = await this.generateSlotsForDate(businessId, date, serviceId);
    
    // 3. Сохранить в кэш
    await this.saveSlotsToCache(businessId, date, serviceId, slots);
    
    return this.filterAvailableSlots(slots);
  }

  /**
   * Генерация слотов на конкретную дату
   */
  async generateSlotsForDate(businessId, date, serviceId) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    
    // Получить услугу
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service || !service.isActive) {
      return [];
    }
    
    // Получить бизнес-конфигурацию
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        schedule: true,
        breaks: true
      }
    });
    
    if (!business) {
      return [];
    }
    
    // Проверить день недели
    const weekday = dateObj.getDay();
    const daySchedule = business.schedule.find(s => s.weekday === weekday);
    
    if (!daySchedule || !daySchedule.isWorking) {
      return [];
    }
    
    // Проверить исключения (праздники)
    const exception = await this.prisma.exception.findFirst({
      where: {
        businessId,
        date: dateObj
      }
    });
    
    if (exception) {
      if (exception.type === 'holiday' || exception.type === 'closed') {
        return [];
      }
      // special_hours - использовать особое время
      if (exception.type === 'special_hours') {
        // Переопределить расписание
        daySchedule.startTime = exception.openTime;
        daySchedule.endTime = exception.closeTime;
      }
    }
    
    // Получить существующие записи
    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: dateObj,
        status: { in: ['pending', 'confirmed'] }
      }
    });
    
    // Параметры генерации
    const duration = service.durationMinutes;
    const buffer = service.bufferMinutes ?? business.bufferMinutes;
    const step = duration + buffer;
    
    // Генерация базовых слотов
    const slots = this.generateBaseSlots(
      daySchedule.startTime,
      daySchedule.endTime,
      duration,
      step
    );
    
    // Фильтрация по перерывам
    const filteredByBreaks = this.filterByBreaks(slots, business.breaks, duration);
    
    // Фильтрация по существующим записям
    const filteredByBookings = this.filterByBookings(filteredByBreaks, bookings, duration);
    
    // Фильтрация прошедшего времени
    const finalSlots = this.filterPastSlots(filteredByBookings, dateObj);
    
    return finalSlots;
  }

  /**
   * Генерация базовых слотов
   */
  generateBaseSlots(startTime, endTime, duration, step) {
    const slots = [];
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Максимальное время начала слота (чтобы услуга успела закончиться)
    const latestStart = endMinutes - duration;
    
    let currentMinutes = startMinutes;
    
    while (currentMinutes <= latestStart) {
      const time = this.minutesToTime(currentMinutes);
      const endMinutesSlot = currentMinutes + duration;
      
      slots.push({
        time,
        endTime: this.minutesToTime(endMinutesSlot),
        durationMinutes: duration,
        available: true
      });
      
      currentMinutes += step;
    }
    
    return slots;
  }

  /**
   * Фильтрация по перерывам
   */
  filterByBreaks(slots, breaks, duration) {
    return slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.time);
      const slotEnd = slotStart + duration;
      
      const overlapsBreak = breaks.some(brk => {
        const breakStart = this.timeToMinutes(brk.startTime);
        const breakEnd = this.timeToMinutes(brk.endTime);
        
        // Пересечение?
        return slotStart < breakEnd && slotEnd > breakStart;
      });
      
      return {
        ...slot,
        available: slot.available && !overlapsBreak
      };
    });
  }

  /**
   * Фильтрация по существующим записям
   */
  filterByBookings(slots, bookings, duration) {
    return slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.time);
      const slotEnd = slotStart + duration;
      
      const hasConflict = bookings.some(booking => {
        const bookingStart = this.timeToMinutes(booking.startTime);
        const bookingEnd = this.timeToMinutes(booking.endTime);
        
        // Пересечение?
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
      
      return {
        ...slot,
        available: slot.available && !hasConflict
      };
    });
  }

  /**
   * Фильтрация прошедшего времени
   */
  filterPastSlots(slots, date) {
    const now = new Date();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Если дата не сегодня - все слоты доступны
    if (format(now, 'yyyy-MM-dd') !== format(dateObj, 'yyyy-MM-dd')) {
      return slots;
    }
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const minBookingTime = currentMinutes + 30; // Минимум 30 минут до записи
    
    return slots.map(slot => {
      const slotMinutes = this.timeToMinutes(slot.time);
      
      return {
        ...slot,
        available: slot.available && slotMinutes > minBookingTime
      };
    });
  }

  /**
   * Получить слоты из кэша
   */
  async getCachedSlots(businessId, date, serviceId) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    const cachedSlots = await this.prisma.slotCache.findMany({
      where: {
        businessId,
        date: dateObj,
        durationMinutes: (await this.prisma.service.findUnique({
          where: { id: serviceId },
          select: { durationMinutes: true }
        }))?.durationMinutes,
        expiresAt: { gte: new Date() }
      },
      orderBy: { time: 'asc' }
    });
    
    if (cachedSlots.length === 0) {
      return null;
    }
    
    return cachedSlots.map(slot => ({
      time: slot.time,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      available: slot.isAvailable
    }));
  }

  /**
   * Сохранить слоты в кэш
   */
  async saveSlotsToCache(businessId, date, serviceId, slots) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const expiresAt = addHours(new Date(), this.cacheTTLHours);
    
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) return;
    
    // Удалить старый кэш для этой даты и услуги
    await this.prisma.slotCache.deleteMany({
      where: {
        businessId,
        date: dateObj,
        durationMinutes: service.durationMinutes
      }
    });
    
    // Сохранить новые слоты
    const slotsData = slots.map(slot => ({
      businessId,
      date: dateObj,
      time: slot.time,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      isAvailable: slot.available,
      expiresAt
    }));
    
    if (slotsData.length > 0) {
      await this.prisma.slotCache.createMany({
        data: slotsData,
        skipDuplicates: true
      });
    }
  }

  /**
   * Предварительная генерация слотов на N дней
   */
  async generateSlotsCache(businessId, days = 14) {
    const services = await this.prisma.service.findMany({
      where: {
        businessId,
        isActive: true
      }
    });
    
    let generated = 0;
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      
      for (const service of services) {
        const slots = await this.generateSlotsForDate(businessId, date, service.id);
        await this.saveSlotsToCache(businessId, date, service.id, slots);
        generated += slots.length;
      }
    }
    
    return {
      generated,
      days,
      servicesCount: services.length
    };
  }

  /**
   * Инвалидация кэша при создании/отмене записи
   */
  async invalidateCache(businessId, date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    await this.prisma.slotCache.deleteMany({
      where: {
        businessId,
        date: dateObj
      }
    });
  }

  /**
   * Фильтрация доступных слотов
   */
  filterAvailableSlots(slots) {
    return slots.filter(slot => slot.available);
  }

  /**
   * Утилиты конвертации времени
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

module.exports = SlotEngine;
