const { Markup } = require('telegraf');

/**
 * Команда /start
 */
async function startCommand(ctx) {
  const userId = ctx.from.id;
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

  // Приветственное сообщение
  const welcomeText = `
👋 Добро пожаловать!

Нажмите кнопку ниже, чтобы записаться на услугу.
  `.trim();

  // Клавиатура с кнопкой Mini App
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.webApp(
        '📅 Записаться',
        `${webAppUrl}?startapp=${userId}`
      ),
    ],
    [
      Markup.button.callback('📍 Как нас найти', 'location'),
      Markup.button.callback('📞 Позвонить', 'call'),
    ],
  ]);

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    ...keyboard,
  });
}

module.exports = startCommand;
