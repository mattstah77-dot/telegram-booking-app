const express = require('express');
const router = express.Router();

/**
 * GET /api/slots/:date
 * Получить доступные слоты на дату
 * Query params: serviceId
 */
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { serviceId } = req.query;
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    
    if (!serviceId) {
      return res.status(400).json({
        error: 'serviceId is required'
      });
    }
    
    // Get slot engine from request
    const slotEngine = req.slotEngine;
    
    // Get available slots
    const slots = await slotEngine.getAvailableSlots(businessId, date, serviceId);
    
    res.json(slots);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/slots/generate
 * Предварительная генерация слотов на период
 * Admin only
 */
router.post('/generate', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const { days = 14 } = req.body;
    
    const slotEngine = req.slotEngine;
    const result = await slotEngine.generateSlotsCache(businessId, days);
    
    res.json({
      success: true,
      generated: result.generated,
      days: result.days
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/slots/cache
 * Очистить кэш слотов
 * Admin only
 */
router.delete('/cache', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const prisma = req.prisma;
    
    const result = await prisma.slotCache.deleteMany({
      where: { businessId }
    });
    
    res.json({
      success: true,
      deleted: result.count
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
