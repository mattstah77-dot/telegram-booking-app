const { Markup } = require('telegraf');

/**
 * Команда /admin
 * Админ-панель (только для администратора)
 */
async function adminCommand(ctx) {
  const userId = ctx.from.id;
  const adminId = process.env.ADMIN_TELEGRAM_ID;

  // Проверка прав
  if (userId.toString() !== adminId) {
    return ctx.reply('⛔ У вас нет доступа к этой команде');
  }

  const text = `
🎛️ <b>Админ-панель</b>

Выберите действие:
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📋 Профиль бизнеса', 'admin_profile')],
    [Markup.button.callback('💇 Услуги', 'admin_services')],
    [Markup.button.callback('📅 График работы', 'admin_schedule')],
    [Markup.button.callback('📊 Сегодняшние записи', 'admin_bookings')],
    [Markup.button.callback('⚙️ Настройки', 'admin_settings')],
  ]);

  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...keyboard,
  });
}

module.exports = adminCommand;
