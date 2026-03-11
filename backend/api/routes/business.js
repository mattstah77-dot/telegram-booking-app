const express = require('express');
const router = express.Router();

/**
 * GET /api/business
 * Получить информацию о бизнесе
 */
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const prisma = req.prisma;
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        schedule: {
          orderBy: { weekday: 'asc' }
        },
        breaks: true
      }
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Remove sensitive data
    const { botToken, ...publicData } = business;
    
    res.json(publicData);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/business (Admin only)
 * Обновить информацию о бизнесе
 */
router.put('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const prisma = req.prisma;
    
    const { name, description, address, phone, timezone, bufferMinutes, maxDaysAhead, minBookingMinutes, cancellationHours, autoConfirm } = req.body;
    
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        description,
        address,
        phone,
        timezone,
        bufferMinutes,
        maxDaysAhead,
        minBookingMinutes,
        cancellationHours,
        autoConfirm
      }
    });
    
    res.json(business);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Business not found' });
    }
    next(error);
  }
});

/**
 * GET /api/business/schedule
 * Получить расписание работы
 */
router.get('/schedule', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const prisma = req.prisma;
    
    const schedule = await prisma.schedule.findMany({
      where: { businessId },
      orderBy: { weekday: 'asc' }
    });
    
    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/business/schedule/:weekday (Admin only)
 * Обновить расписание на день недели
 */
router.put('/schedule/:weekday', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const { weekday } = req.params;
    const { isWorking, startTime, endTime } = req.body;
    const prisma = req.prisma;
    
    const schedule = await prisma.schedule.upsert({
      where: {
        businessId_weekday: {
          businessId,
          weekday: parseInt(weekday)
        }
      },
      update: {
        isWorking,
        startTime,
        endTime
      },
      create: {
        businessId,
        weekday: parseInt(weekday),
        isWorking,
        startTime,
        endTime
      }
    });
    
    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/business/exceptions
 * Получить исключения (праздники, выходные)
 */
router.get('/exceptions', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const prisma = req.prisma;
    
    const exceptions = await prisma.exception.findMany({
      where: { businessId },
      orderBy: { date: 'asc' }
    });
    
    res.json(exceptions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/business/exceptions (Admin only)
 * Добавить исключение
 */
router.post('/exceptions', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID || 'demo-business';
    const { date, type, openTime, closeTime, reason } = req.body;
    const prisma = req.prisma;
    
    const exception = await prisma.exception.create({
      data: {
        businessId,
        date: new Date(date),
        type,
        openTime,
        closeTime,
        reason
      }
    });
    
    res.status(201).json(exception);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Exception for this date already exists' });
    }
    next(error);
  }
});

/**
 * DELETE /api/business/exceptions/:id (Admin only)
 * Удалить исключение
 */
router.delete('/exceptions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = req.prisma;
    
    await prisma.exception.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Exception not found' });
    }
    next(error);
  }
});

module.exports = router;
