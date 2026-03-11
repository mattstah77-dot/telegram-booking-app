const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/services
 * Получить список активных услуг
 */
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    
    const services = await prisma.service.findMany({
      where: {
        businessId,
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    res.json(services);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/services/:id
 * Получить услугу по ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/services (Admin only)
 * Создать новую услугу
 */
router.post('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.BUSINESS_ID;
    const { name, description, price, durationMinutes, bufferMinutes, order } = req.body;
    
    // Validation
    if (!name || price === undefined || !durationMinutes) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'price', 'durationMinutes']
      });
    }
    
    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description: description || '',
        price,
        durationMinutes,
        bufferMinutes: bufferMinutes || null,
        order: order || 0,
        isActive: true
      }
    });
    
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/services/:id (Admin only)
 * Обновить услугу
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationMinutes, bufferMinutes, isActive, order } = req.body;
    
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        price,
        durationMinutes,
        bufferMinutes,
        isActive,
        order
      }
    });
    
    res.json(service);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Service not found' });
    }
    next(error);
  }
});

/**
 * DELETE /api/services/:id (Admin only)
 * Удалить услугу
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: ['pending', 'confirmed'] }
      }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete service with active bookings',
        activeBookings
      });
    }
    
    await prisma.service.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Service not found' });
    }
    next(error);
  }
});

module.exports = router;
