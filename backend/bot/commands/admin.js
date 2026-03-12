const { Markup } = require('telegraf');

/**
 * Команда /admin
 * Открывает Admin Panel через WebApp
 */
async function adminCommand(ctx) {
  const userId = ctx.from.id;
  const adminId = process.env.ADMIN_TELEGRAM_ID;

  // Проверка прав
  if (userId.toString() !== adminId) {
    return ctx.reply('⛔ У вас нет доступа к этой команде');
  }

  // Используем BACKEND_URL для WebApp (чтобы работал SPA fallback)
  const webAppUrl = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/admin`
    : process.env.TELEGRAM_WEBAPP_URL 
      ? `${process.env.TELEGRAM_WEBAPP_URL}/admin`
      : 'https://booking-app-backend-jeme.onrender.com/admin';

  const text = `
🎛️ <b>Админ-панель</b>

Откройте панель управления для управления:
• Услугами и ценами
• Записями клиентов
• Расписанием работы
• Статистикой
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('⚙️ Открыть админ панель', webAppUrl)],
  ]);

  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...keyboard,
  });
}

module.exports = adminCommand;
