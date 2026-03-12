const express = require('express');
const router = express.Router();
const { requireTelegramAuth, requireAdminAuth } = require('../middleware/auth');
const { bookingLimiter, basicLimiter } = require('../middleware/rateLimit');
const { validate, createBookingSchema } = require('../middleware/validate');

/**
 * GET /api/bookings
 * Получить список записей (Public с ограничениями)
 */
router.get('/', basicLimiter, async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const { date, status, limit = 50, offset = 0 } = req.query;
    
    const prisma = req.prisma;
    
    const where = { businessId };
    
    if (date) {
      where.date = new Date(date);
    }
    
    if (status) {
      where.status = status;
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              name: true,
              price: true,
              durationMinutes: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.booking.count({ where })
    ]);
    
    res.json({
      bookings,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/:id
 * Получить запись по ID
 */
router.get('/:id', basicLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = req.prisma;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings
 * Создать новую запись (Public)
 */
router.post('/', bookingLimiter, requireTelegramAuth, validate(createBookingSchema), async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const { serviceId, date, time, clientName, clientPhone, telegramId, notes } = req.body;
    
    const bookingEngine = req.bookingEngine;
    
    const result = await bookingEngine.createBooking({
      businessId,
      serviceId,
      date,
      time,
      clientName,
      clientPhone,
      telegramId: telegramId || req.telegramUser?.id?.toString(),
      notes
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: result.code
      });
    }
    
    // Send notifications
    const notificationService = req.notificationService;
    
    // Notify client
    if (result.booking.telegramId) {
      await notificationService.sendBookingConfirmation(result.booking);
    }
    
    // Notify admin
    await notificationService.sendAdminNotification(result.booking);
    
    res.status(201).json(result.booking);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Отменить запись
 */
router.post('/:id/cancel', bookingLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;
    
    const bookingEngine = req.bookingEngine;
    
    const result = await bookingEngine.cancelBooking(id, reason, cancelledBy);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: result.code
      });
    }
    
    // Send notification
    const notificationService = req.notificationService;
    await notificationService.sendCancellationNotification(result.booking, reason);
    
    res.json(result.booking);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/:id/reschedule
 * Перенести запись
 */
router.post('/:id/reschedule', bookingLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime } = req.body;
    
    if (!newDate || !newTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['newDate', 'newTime']
      });
    }
    
    const bookingEngine = req.bookingEngine;
    
    const result = await bookingEngine.rescheduleBooking(id, newDate, newTime);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: result.code
      });
    }
    
    // Send notification
    const notificationService = req.notificationService;
    await notificationService.sendRescheduleNotification(result.booking);
    
    res.json(result.booking);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bookings/:id/status
 * Изменить статус записи (Admin only)
 */
router.put('/:id/status', requireAdminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: allowedStatuses
      });
    }
    
    const prisma = req.prisma;
    
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { service: true }
    });
    
    res.json(booking);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    next(error);
  }
});

module.exports = router;
