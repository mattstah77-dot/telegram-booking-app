require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Import handlers
const startCommand = require('./commands/start');
const adminCommand = require('./commands/admin');
const callbackHandler = require('./handlers/callback');

// Register commands
bot.command('start', startCommand);
bot.command('admin', adminCommand);

// Register callback handler
bot.on('callback_query', callbackHandler);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Произошла ошибка. Попробуйте позже.');
});

// Start bot
bot.launch()
  .then(() => console.log('Bot started'))
  .catch((err) => console.error('Failed to start bot:', err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
