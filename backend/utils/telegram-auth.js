/**
 * Telegram WebApp Data Validation
 * Валидация данных от Telegram Mini App
 */

const crypto = require('crypto');

/**
 * Валидация подписи Telegram WebApp
 */
function validateTelegramWebAppData(initData, botToken) {
  try {
    // Парсинг данных
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    // Создание строки для хеширования
    const dataCheckString = Array.from(params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');
    
    // Вычисление секретного ключа
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Вычисление хеша
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Сравнение хешей
    if (computedHash !== hash) {
      console.error('Hash mismatch:', { computed: computedHash, provided: hash });
      return null;
    }
    
    // Парсинг данных пользователя
    const userJson = params.get('user');
    if (!userJson) {
      return null;
    }
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

/**
 * Извлечение данных пользователя из initData
 */
function parseUserData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    
    if (!userJson) {
      return null;
    }
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

module.exports = {
  validateTelegramWebAppData,
  parseUserData
};
