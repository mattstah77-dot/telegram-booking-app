const { z } = require('zod');

/**
 * Валидация schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Валидируем body, query, params
      const dataToValidate = {
        ...(req.body && Object.keys(req.body).length > 0 && { body: req.body }),
        ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
        ...(req.params && Object.keys(req.params).length > 0 && { params: req.params })
      };
      
      if (Object.keys(dataToValidate).length === 0) {
        return next();
      }
      
      const validated = schema.parse(dataToValidate);
      
      // Заменяем валидированными данными
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Schema для создания записи
 */
const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
    clientName: z.string().min(2, 'Name must be at least 2 characters').max(50),
    clientPhone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
    telegramId: z.string().optional(),
    notes: z.string().max(500).optional()
  })
});

/**
 * Schema для создания услуги
 */
const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    price: z.number().int().min(0, 'Price must be non-negative'),
    durationMinutes: z.number().int().min(5).max(480, 'Duration must be between 5 and 480 minutes'),
    bufferMinutes: z.number().int().min(0).optional(),
    order: z.number().int().optional()
  })
});

/**
 * Schema для обновления услуги
 */
const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().int().min(0).optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    bufferMinutes: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional()
  })
});

module.exports = {
  validate,
  createBookingSchema,
  createServiceSchema,
  updateServiceSchema
};
