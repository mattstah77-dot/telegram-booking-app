const { Telegraf } = require('telegraf');

// Import handlers
const startCommand = require('./commands/start');
const adminCommand = require('./commands/admin');
const callbackHandler = require('./handlers/callback');

let bot = null;

/**
 * Инициализация бота
 */
function initBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not set, bot disabled');
    return null;
  }

  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // Register commands
  bot.command('start', startCommand);
  bot.command('admin', adminCommand);

  // Register callback handler
  bot.on('callback_query', callbackHandler);

  // Error handling
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    if (ctx) {
      ctx.reply('Произошла ошибка. Попробуйте позже.').catch(() => {});
    }
  });

  return bot;
}

/**
 * Получить экземпляр бота
 */
function getBot() {
  return bot;
}

/**
 * Обработка webhook запроса
 */
async function handleWebhook(req, res) {
  if (!bot) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
}

/**
 * Установка webhook
 */
async function setWebhook(webhookUrl) {
  if (!bot) {
    console.log('Bot not initialized, skipping webhook setup');
    return false;
  }

  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log('Webhook set:', webhookUrl);
    return true;
  } catch (error) {
    console.error('Failed to set webhook:', error);
    return false;
  }
}

/**
 * Удаление webhook
 */
async function deleteWebhook() {
  if (!bot) return;

  try {
    await bot.telegram.deleteWebhook();
    console.log('Webhook deleted');
  } catch (error) {
    console.error('Failed to delete webhook:', error);
  }
}

module.exports = {
  initBot,
  getBot,
  handleWebhook,
  setWebhook,
  deleteWebhook
};
