/**
 * Обработчик callback queries
 */
async function callbackHandler(ctx) {
  const data = ctx.callbackQuery.data;

  try {
    // Роутинг
    if (data === 'location') {
      await handleLocation(ctx);
    } else if (data === 'call') {
      await handleCall(ctx);
    } else if (data.startsWith('confirm_')) {
      await handleConfirmBooking(ctx, data.replace('confirm_', ''));
    } else if (data.startsWith('cancel_')) {
      await handleCancelBooking(ctx, data.replace('cancel_', ''));
    } else if (data.startsWith('admin_')) {
      await handleAdminAction(ctx, data);
    } else {
      await ctx.answerCbQuery('Неизвестное действие');
    }
  } catch (error) {
    console.error('Callback error:', error);
    await ctx.answerCbQuery('Произошла ошибка');
  }
}

/**
 * Обработка "Как нас найти"
 */
async function handleLocation(ctx) {
  const address = 'ул. Примерная, д.1';
  const text = `📍 Наш адрес: ${address}`;

  await ctx.answerCbQuery();
  await ctx.reply(text);
}

/**
 * Обработка "Позвонить"
 */
async function handleCall(ctx) {
  const phone = '+79991234567';
  const text = `📞 Наш телефон: ${phone}`;

  await ctx.answerCbQuery();
  await ctx.reply(text);
}

/**
 * Подтверждение записи (admin)
 */
async function handleConfirmBooking(ctx, bookingId) {
  console.log('Confirm booking:', bookingId);

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[{ text: '✅ Подтверждено', callback_data: 'noop' }]],
  });

  await ctx.answerCbQuery('Запись подтверждена');
}

/**
 * Отмена записи (admin)
 */
async function handleCancelBooking(ctx, bookingId) {
  console.log('Cancel booking:', bookingId);

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [[{ text: '❌ Отменено', callback_data: 'noop' }]],
  });

  await ctx.answerCbQuery('Запись отменено');
}

/**
 * Админ-действия
 */
async function handleAdminAction(ctx, data) {
  const action = data.replace('admin_', '');

  switch (action) {
    case 'profile':
      await ctx.editMessageText('📋 Профиль бизнеса (в разработке)');
      break;
    case 'services':
      await ctx.editMessageText('💇 Управление услугами (в разработке)');
      break;
    case 'schedule':
      await ctx.editMessageText('📅 График работы (в разработке)');
      break;
    case 'bookings':
      await ctx.editMessageText('📊 Записи (в разработке)');
      break;
    case 'settings':
      await ctx.editMessageText('⚙️ Настройки (в разработке)');
      break;
    default:
      await ctx.answerCbQuery('Неизвестное действие');
  }
}

module.exports = callbackHandler;
