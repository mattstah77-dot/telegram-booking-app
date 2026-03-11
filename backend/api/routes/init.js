const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../../prisma/seed-api');

/**
 * POST /api/init
 * Инициализация базы данных начальными данными
 */
router.post('/', async (req, res, next) => {
  try {
    const result = await seedDatabase();
    
    if (result.seeded) {
      res.status(201).json({
        success: true,
        message: 'Database initialized successfully',
        business: result.business,
        servicesCount: result.services.length
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Database already initialized',
        business: result.business
      });
    }
  } catch (error) {
    console.error('Init error:', error);
    next(error);
  }
});

module.exports = router;
