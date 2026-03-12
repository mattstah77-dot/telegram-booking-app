const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateTelegramWebAppData } = require('../../utils/telegram-auth');
const { requireAdminAuth } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');

/**
 * POST /api/admin/auth
 * Авторизация администратора через Telegram
 */
router.post('/auth', adminLimiter, async (req, res, next) => {
  try {
    const { initData } = req.body;
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const prisma = req.prisma;
    
    // Validate Telegram data
    const telegramUser = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    
    // Get business
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Check if user is admin
    if (business.adminTelegramId !== telegramUser.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        businessId,
        telegramId: telegramUser.id,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Create session
    await prisma.adminSession.create({
      data: {
        businessId,
        telegramId: telegramUser.id.toString(),
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
    
    res.json({
      token,
      user: {
        id: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/logout
 * Выход из админ-панели
 */
router.post('/logout', requireAdminAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const prisma = req.prisma;
    
    if (token) {
      await prisma.adminSession.deleteMany({
        where: { token }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/dashboard
 * Статистика для дашборда
 */
router.get('/dashboard', requireAdminAuth, adminLimiter, async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const prisma = req.prisma;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const monthStart = new Date(today);
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    // Get stats
    const [
      todayBookings,
      weekBookings,
      monthBookings,
      pendingBookings,
      totalRevenue
    ] = await Promise.all([
      // Today's bookings
      prisma.booking.count({
        where: {
          businessId,
          date: today,
          status: { in: ['pending', 'confirmed', 'completed'] }
        }
      }),
      
      // This week bookings
      prisma.booking.count({
        where: {
          businessId,
          date: { gte: weekStart, lt: weekEnd },
          status: { in: ['pending', 'confirmed', 'completed'] }
        }
      }),
      
      // This month bookings
      prisma.booking.count({
        where: {
          businessId,
          date: { gte: monthStart, lt: monthEnd },
          status: { in: ['pending', 'confirmed', 'completed'] }
        }
      }),
      
      // Pending bookings
      prisma.booking.count({
        where: {
          businessId,
          status: 'pending'
        }
      }),
      
      // Total revenue this month
      prisma.booking.aggregate({
        where: {
          businessId,
          date: { gte: monthStart, lt: monthEnd },
          status: { in: ['confirmed', 'completed'] }
        },
        _sum: {
          price: true
        }
      })
    ]);
    
    res.json({
      todayBookings,
      weekBookings,
      monthBookings,
      pendingBookings,
      totalRevenue: totalRevenue._sum.price || 0
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/bookings
 * Получить все записи с пагинацией
 */
router.get('/bookings', requireAdminAuth, adminLimiter, async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const { dateFrom, dateTo, status, limit = 50, offset = 0 } = req.query;
    const prisma = req.prisma;
    
    const where = { businessId };
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    
    if (status) {
      where.status = status;
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true },
        orderBy: [
          { date: 'desc' },
          { startTime: 'desc' }
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

module.exports = router;
