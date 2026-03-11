# Telegram Integration

## 📋 Описание интеграции

Документ описывает интеграцию с Telegram через:
- Bot API (Telegraf)
- Mini App SDK
- WebApp Data Validation

### Ключевые компоненты

1. **Telegram Bot** — команды и callback queries
2. **Mini App** — React SPA с Telegram SDK
3. **Notification Service** — отправка уведомлений
4. **Auth** — валидация WebApp данных

---

## 🤖 Telegram Bot

### Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Укажите имя бота (например: "Барбершоп Бородач")
4. Укажите username бота (например: `barbershop_borodach_bot`)
5. Сохраните полученный токен

### Настройка Mini App

```bash
# В BotFather:
/mybots → Выберите бота → Bot Settings → Menu Button
→ Configure → Send Web App URL
```

---

## 📦 Структура бота

```
bot/
├── index.js                 # Точка входа
├── config.js                # Конфигурация
├── commands/
│   ├── start.js             # Команда /start
│   └── admin.js             # Команда /admin
├── handlers/
│   ├── callback.js          # Обработка callback queries
│   ├── message.js           # Обработка сообщений
│   └── booking.js           # Обработка записей
├── middleware/
│   ├── auth.js              # Авторизация
│   ├── logger.js            # Логирование
│   └── errorHandler.js      # Обработка ошибок
└── utils/
    ├── keyboard.js          # Генерация клавиатур
    ├── messages.js          # Шаблоны сообщений
    └── webapp.js            # Web App утилиты
```

---

## 💻 Реализация бота

### Основной файл (index.js)

```javascript
const { Telegraf } = require('telegraf');
const { config } = require('./config');

// Импорт обработчиков
const startCommand = require('./commands/start');
const adminCommand = require('./commands/admin');
const callbackHandler = require('./handlers/callback');
const messageHandler = require('./handlers/message');

// Middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Инициализация бота
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Подключение middleware
bot.use(logger);
bot.use(errorHandler);

// Регистрация команд
bot.command('start', startCommand);
bot.command('admin', adminCommand);

// Регистрация обработчиков
bot.on('callback_query', callbackHandler);
bot.on('message', messageHandler);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Произошла ошибка. Попробуйте позже.');
});

// Запуск бота
bot.launch()
  .then(() => console.log('Bot started'))
  .catch(err => console.error('Failed to start bot:', err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
```

### Команда /start

```javascript
const { Markup } = require('telegraf');
const { getBusinessConfig } = require('../../backend/services/businessService');

async function startCommand(ctx) {
  const userId = ctx.from.id;
  const config = await getBusinessConfig();

  // Приветственное сообщение
  const welcomeText = `
👋 Добро пожаловать в <b>${config.name}</b>!

📍 Адрес: ${config.address}
📞 Телефон: ${config.phone}

Нажмите кнопку ниже, чтобы записаться на услугу.
  `.trim();

  // Клавиатура с кнопкой Mini App
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.webApp(
        '📅 Записаться',
        `${process.env.WEBAPP_URL}?startapp=${userId}`
      )
    ],
    [
      Markup.button.callback('📍 Как нас найти', 'location'),
      Markup.button.callback('📞 Позвонить', 'call')
    ]
  ]);

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    ...keyboard
  });
}

module.exports = startCommand;
```

### Обработка callback queries

```javascript
async function callbackHandler(ctx) {
  const data = ctx.callbackQuery.data;

  try {
    // Роутинг по типу callback
    if (data.startsWith('confirm_')) {
      await handleConfirmBooking(ctx, data.replace('confirm_', ''));
    } 
    else if (data.startsWith('cancel_')) {
      await handleCancelBooking(ctx, data.replace('cancel_', ''));
    }
    else if (data === 'location') {
      await handleLocation(ctx);
    }
    else if (data === 'call') {
      await handleCall(ctx);
    }
    else if (data.startsWith('admin_')) {
      await handleAdminAction(ctx, data);
    }
    else {
      await ctx.answerCbQuery('Неизвестное действие');
    }
  } catch (error) {
    console.error('Callback error:', error);
    await ctx.answerCbQuery('Произошла ошибка');
  }
}

async function handleConfirmBooking(ctx, bookingId) {
  const adminService = require('../../backend/services/adminService');
  
  await adminService.confirmBooking(bookingId);
  
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[
      { text: '✅ Подтверждено', callback_data: 'noop' }
    ]]
  });
  
  await ctx.answerCbQuery('Запись подтверждена');
}

async function handleCancelBooking(ctx, bookingId) {
  const adminService = require('../../backend/services/adminService');
  
  await adminService.cancelBooking(bookingId);
  
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[
      { text: '❌ Отменено', callback_data: 'noop' }
    ]]
  });
  
  await ctx.answerCbQuery('Запись отменена');
}

module.exports = callbackHandler;
```

---

## 📱 Mini App SDK

### Инициализация

```javascript
// miniapp/src/utils/telegram.js
import WebApp from '@twa-dev/sdk';

export const tg = WebApp;

export function initTelegram() {
  // Инициализация
  tg.expand();
  
  // Настройка темы
  document.documentElement.style.setProperty(
    '--tg-theme-bg-color',
    tg.themeParams.bg_color || '#ffffff'
  );
  
  // Данные пользователя
  const user = tg.initDataUnsafe?.user;
  
  return {
    user,
    platform: tg.platform,
    version: tg.version
  };
}

export function closeApp() {
  tg.close();
}

export function showPopup(title, message) {
  tg.showPopup({
    title,
    message,
    buttons: [{ type: 'ok' }]
  });
}

export function hapticFeedback(type = 'impact') {
  switch (type) {
    case 'impact':
      tg.HapticFeedback.impactOccurred('medium');
      break;
    case 'notification':
      tg.HapticFeedback.notificationOccurred('success');
      break;
    case 'selection':
      tg.HapticFeedback.selectionChanged();
      break;
  }
}
```

### Хук useTelegram

```javascript
// miniapp/src/hooks/useTelegram.js
import { useState, useEffect } from 'react';
import { tg, initTelegram, closeApp, showPopup, hapticFeedback } from '../utils/telegram';

export function useTelegram() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initData = initTelegram();
    setUser(initData.user);
    setIsReady(true);

    // Обработка изменения темы
    tg.onEvent('themeChanged', () => {
      // Обновить CSS переменные
      document.documentElement.style.setProperty(
        '--tg-theme-bg-color',
        tg.themeParams.bg_color
      );
    });

    return () => {
      tg.offEvent('themeChanged', () => {});
    };
  }, []);

  const sendData = (data) => {
    tg.sendData(JSON.stringify(data));
  };

  const openLink = (url) => {
    tg.openLink(url);
  };

  const openTelegramLink = (url) => {
    tg.openTelegramLink(url);
  };

  return {
    user,
    isReady,
    closeApp,
    showPopup,
    hapticFeedback,
    sendData,
    openLink,
    openTelegramLink,
    themeParams: tg.themeParams,
    platform: tg.platform
  };
}
```

---

## 🔐 Валидация данных

### Проверка подписи Telegram

```javascript
// backend/utils/telegramAuth.js
const crypto = require('crypto');

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
    return computedHash === hash;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

function parseTelegramUserData(initData) {
  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  
  if (!userJson) {
    return null;
  }

  return JSON.parse(userJson);
}

module.exports = {
  validateTelegramWebAppData,
  parseTelegramUserData
};
```

### Middleware для API

```javascript
// backend/middleware/telegramAuth.js
const { validateTelegramWebAppData, parseTelegramUserData } = require('../utils/telegramAuth');

function telegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];

  if (!initData) {
    return res.status(401).json({ error: 'Missing init data' });
  }

  const isValid = validateTelegramWebAppData(
    initData,
    process.env.TELEGRAM_BOT_TOKEN
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid init data' });
  }

  const user = parseTelegramUserData(initData);
  req.user = user;
  next();
}

module.exports = telegramAuth;
```

---

## 📤 Отправка сообщений

### Сервис уведомлений

```javascript
// backend/services/notificationService.js
const { Telegraf } = require('telegraf');

class NotificationService {
  constructor(botToken) {
    this.bot = new Telegraf(botToken);
  }

  /**
   * Отправить уведомление о новой записи клиенту
   */
  async sendBookingConfirmation(telegramId, booking) {
    const message = `
✅ <b>Запись подтверждена!</b>

💇 <b>Услуга:</b> ${booking.serviceName}
📅 <b>Дата:</b> ${formatDate(booking.date)}
🕐 <b>Время:</b> ${booking.time}
💰 <b>Стоимость:</b> ${booking.servicePrice} ₽

📍 <b>Адрес:</b> ${booking.businessAddress}

⚠️ Напоминание придёт за 1 час до визита.
    `.trim();

    await this.bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'HTML'
    });
  }

  /**
   * Отправить уведомление администратору
   */
  async sendAdminNotification(adminId, booking) {
    const message = `
🔔 <b>Новая запись!</b>

👤 <b>Клиент:</b> ${booking.customerName}
📞 <b>Телефон:</b> ${booking.customerPhone}

💇 <b>Услуга:</b> ${booking.serviceName}
📅 <b>Дата:</b> ${formatDate(booking.date)}
🕐 <b>Время:</b> ${booking.time}
💰 <b>К оплате:</b> ${booking.servicePrice} ₽
    `.trim();

    await this.bot.telegram.sendMessage(adminId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `confirm_${booking.id}` },
            { text: '❌ Отменить', callback_data: `cancel_${booking.id}` }
          ]
        ]
      }
    });
  }

  /**
   * Отправить напоминание
   */
  async sendReminder(telegramId, booking) {
    const message = `
⏰ <b>Напоминание о записи</b>

Через 1 час у вас запись в ${booking.businessName}:

💇 ${booking.serviceName}
🕐 ${booking.time}
📍 ${booking.businessAddress}
    `.trim();

    await this.bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'HTML'
    });
  }

  /**
   * Отправить уведомление об отмене
   */
  async sendCancellationNotification(telegramId, booking, reason = '') {
    const message = `
❌ <b>Запись отменена</b>

💇 ${booking.serviceName}
📅 ${formatDate(booking.date)}
🕐 ${booking.time}

${reason ? `Причина: ${reason}` : ''}
    `.trim();

    await this.bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'HTML'
    });
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('ru-RU', options);
}

module.exports = NotificationService;
```

---

## ⏰ Scheduled Jobs

### Напоминания о записях

```javascript
// backend/jobs/reminderJob.js
const { db } = require('../config/firebase');
const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService(process.env.TELEGRAM_BOT_TOKEN);

/**
 * Запуск каждый час
 */
async function sendReminders() {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  // Найти записи через 1 час
  const bookings = await db.collection('bookings')
    .where('date', '==', formatDate(now))
    .where('time', '>=', formatTime(now))
    .where('time', '<=', formatTime(inOneHour))
    .where('status', '==', 'confirmed')
    .where('reminderSent', '==', false)
    .get();

  for (const doc of bookings) {
    const booking = doc.data();

    // Отправить напоминание
    if (booking.telegramId) {
      await notificationService.sendReminder(booking.telegramId, booking);
    }

    // Пометить как отправленное
    await doc.ref.update({ reminderSent: true });
  }
}

// Запуск через Firebase Functions
exports.scheduledReminder = functions.pubsub
  .schedule('0 * * * *') // Каждый час
  .timeZone('Europe/Moscow')
  .onRun(sendReminders);
```

---

## 🔗 Webhook

### Настройка webhook

```javascript
// backend/webhook.js
const { config } = require('./config');

async function setWebhook(botToken, webhookUrl) {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    })
  });

  const data = await response.json();
  console.log('Webhook set:', data);
}

// Firebase Function для webhook
exports.webhook = functions.https.onRequest(async (req, res) => {
  const bot = require('../bot');
  
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});
```

---

## 📊 Аналитика

### Отслеживание событий

```javascript
// miniapp/src/utils/analytics.js
import { tg } from './telegram';

export function trackEvent(eventName, params = {}) {
  // Отправка в аналитику (например, Google Analytics)
  if (window.gtag) {
    window.gtag('event', eventName, {
      user_id: tg.initDataUnsafe?.user?.id,
      platform: tg.platform,
      ...params
    });
  }

  // Логирование в консоль для разработки
  console.log('Event:', eventName, params);
}

// События для отслеживания
export const Events = {
  APP_OPENED: 'app_opened',
  SERVICE_SELECTED: 'service_selected',
  DATE_SELECTED: 'date_selected',
  TIME_SELECTED: 'time_selected',
  BOOKING_CREATED: 'booking_created',
  BOOKING_CANCELLED: 'booking_cancelled',
  ERROR_OCCURRED: 'error_occurred'
};
```

---

## 🔧 Отладка

### Тестирование в Telegram

```javascript
// Проверка окружения
if (process.env.NODE_ENV === 'development') {
  // Локальный запуск без Telegram
  window.Telegram = {
    WebApp: {
      initData: '',
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser'
        }
      },
      platform: 'tdesktop',
      version: '6.0',
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff'
      },
      expand: () => {},
      close: () => {},
      sendDeta: () => {},
      showPopup: () => {},
      HapticFeedback: {
        impactOccurred: () => {},
        notificationOccurred: () => {},
        selectionChanged: () => {}
      }
    }
  };
}
```

---

## 📝 Примечания для AI агента

1. **Всегда валидируй** initData от Telegram
2. **Используй haptic feedback** для лучшего UX
3. **Обрабатывай ошибки** gracefully
4. **Логируй все события** для отладки
5. **Проверяй platform** для адаптации UI
6. **Используй themeParams** для цветов
7. **Не храни** токен бота на клиенте
