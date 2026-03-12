const jwt = require('jsonwebtoken');
const { validateTelegramWebAppData } = require('../../utils/telegram-auth');

/**
 * Middleware для проверки JWT токена администратора
 */
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверяем что это админ
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware для проверки Telegram WebApp данных
 */
function requireTelegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData) {
    // Разрешаем запросы без Telegram данных (для тестирования)
    req.telegramUser = null;
    return next();
  }
  
  const telegramUser = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);
  
  if (!telegramUser) {
    return res.status(401).json({ error: 'Invalid Telegram data' });
  }
  
  req.telegramUser = telegramUser;
  next();
}

/**
 * Опциональная авторизация - не блокирует запрос
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;
    } catch (error) {
      // Token invalid, but continue
    }
  }
  
  next();
}

module.exports = {
  requireAdminAuth,
  requireTelegramAuth,
  optionalAuth
};
