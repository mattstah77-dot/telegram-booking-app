const rateLimit = require('express-rate-limit');

/**
 * Базовый rate limiter
 * 100 запросов за 15 минут
 */
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Строгий rate limiter для создания записей
 * 10 запросов за 15 минут
 */
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many booking attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter для админ endpoints
 * 200 запросов за 15 минут
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'Too many requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  basicLimiter,
  bookingLimiter,
  adminLimiter
};
