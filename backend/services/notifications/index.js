/**
 * Notification Service
 * Отправка уведомлений через Telegram Bot API с retry механизмом
 */

const axios = require('axios');
const { format, parseISO } = require('date-fns');
const { ru } = require('date-fns/locale');

class NotificationService {
  constructor(prisma) {
    this.prisma = prisma;
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Отправить сообщение через Bot API с retry
   */
  async sendMessage(chatId, text, options = {}, retryCount = 0) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        ...options
      }, {
        timeout: 10000 // 10 seconds timeout
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.description || error.message;
      const errorCode = error.response?.status;
      
      // Log error
      console.error(`Telegram API error (attempt ${retryCount + 1}):`, {
        chatId,
        error: errorMessage,
        code: errorCode
      });
      
      // Retry on network errors or 5xx errors
      if (retryCount < this.maxRetries && (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        errorCode >= 500
      )) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.sendMessage(chatId, text, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Уведомление клиенту о подтверждении записи
   */
  async sendBookingConfirmation(booking) {
    if (!booking.telegramId) return null;
    
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    const message = `
✅ <b>Запись подтверждена!</b>

💇 <b>Услуга:</b> ${booking.serviceName || booking.service?.name}
📅 <b>Дата:</b> ${this.formatDate(booking.date)}
🕐 <b>Время:</b> ${booking.startTime} - ${booking.endTime}
💰 <b>Стоимость:</b> ${this.formatPrice(booking.price)}

📍 <b>Адрес:</b> ${business?.address || 'Не указан'}
📞 <b>Телефон:</b> ${business?.phone || 'Не указан'}

⚠️ Напоминание придёт за 24 часа и за 1 час до визита.
    `.trim();
    
    try {
      const result = await this.sendMessage(booking.telegramId, message);
      
      // Логировать уведомление
      await this.logNotification(booking.businessId, booking.id, 'booking_created', booking.telegramId, 'sent');
      
      return result;
    } catch (error) {
      await this.logNotification(booking.businessId, booking.id, 'booking_created', booking.telegramId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Уведомление администратору о новой записи
   */
  async sendAdminNotification(booking) {
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    if (!business?.adminTelegramId) return null;
    
    const statusEmoji = booking.status === 'confirmed' ? '✅' : '⏳';
    const statusText = booking.status === 'confirmed' ? 'Подтверждена' : 'Ожидает подтверждения';
    
    const message = `
🔔 <b>Новая запись!</b>

${statusEmoji} <b>Статус:</b> ${statusText}

👤 <b>Клиент:</b> ${booking.clientName}
📞 <b>Телефон:</b> ${booking.clientPhone}
${booking.telegramId ? `📱 <b>Telegram ID:</b> ${booking.telegramId}\n` : ''}

💇 <b>Услуга:</b> ${booking.serviceName || booking.service?.name}
📅 <b>Дата:</b> ${this.formatDate(booking.date)}
🕐 <b>Время:</b> ${booking.startTime} - ${booking.endTime}
💰 <b>К оплате:</b> ${this.formatPrice(booking.price)}
    `.trim();
    
    // Кнопки для управления записью
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_${booking.id}` },
          { text: '❌ Отменить', callback_data: `cancel_${booking.id}` }
        ],
        [
          { text: '📞 Позвонить', url: `tel:${booking.clientPhone}` }
        ]
      ]
    };
    
    try {
      const result = await this.sendMessage(business.adminTelegramId, message, {
        reply_markup: keyboard
      });
      
      await this.logNotification(booking.businessId, booking.id, 'admin_notification', business.adminTelegramId, 'sent');
      
      return result;
    } catch (error) {
      await this.logNotification(booking.businessId, booking.id, 'admin_notification', business.adminTelegramId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Напоминание за 24 часа
   */
  async sendReminder24h(booking) {
    if (!booking.telegramId) return null;
    
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    const message = `
⏰ <b>Напоминание о записи</b>

Через 24 часа у вас запись:

💇 <b>Услуга:</b> ${booking.serviceName || booking.service?.name}
📅 <b>Дата:</b> ${this.formatDate(booking.date)}
🕐 <b>Время:</b> ${booking.startTime}
📍 <b>Адрес:</b> ${business?.address || 'Не указан'}

Если вы не можете прийти, пожалуйста, отмените запись.
    `.trim();
    
    try {
      const result = await this.sendMessage(booking.telegramId, message);
      
      // Обновить флаг напоминания
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { reminder24hSent: true }
      });
      
      await this.logNotification(booking.businessId, booking.id, 'reminder_24h', booking.telegramId, 'sent');
      
      return result;
    } catch (error) {
      await this.logNotification(booking.businessId, booking.id, 'reminder_24h', booking.telegramId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Напоминание за 1 час
   */
  async sendReminder1h(booking) {
    if (!booking.telegramId) return null;
    
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    const message = `
⏰ <b>Запись через 1 час!</b>

💇 ${booking.serviceName || booking.service?.name}
🕐 ${booking.startTime}
📍 ${business?.address || 'Не указан'}

Мы вас ждём!
    `.trim();
    
    try {
      const result = await this.sendMessage(booking.telegramId, message);
      
      // Обновить флаг напоминания
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { reminder1hSent: true }
      });
      
      await this.logNotification(booking.businessId, booking.id, 'reminder_1h', booking.telegramId, 'sent');
      
      return result;
    } catch (error) {
      await this.logNotification(booking.businessId, booking.id, 'reminder_1h', booking.telegramId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Уведомление об отмене
   */
  async sendCancellationNotification(booking, reason = '') {
    const recipients = [];
    
    // Клиенту
    if (booking.telegramId) {
      const clientMessage = `
❌ <b>Запись отменена</b>

💇 ${booking.serviceName || booking.service?.name}
📅 ${this.formatDate(booking.date)}
🕐 ${booking.startTime}

${reason ? `Причина: ${reason}` : 'Запись отменена.'}
      `.trim();
      
      try {
        await this.sendMessage(booking.telegramId, clientMessage);
        recipients.push(booking.telegramId);
      } catch (error) {
        console.error('Failed to send cancellation to client:', error);
      }
    }
    
    // Администратору
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    if (business?.adminTelegramId) {
      const adminMessage = `
❌ <b>Запись отменена</b>

👤 ${booking.clientName}
📞 ${booking.clientPhone}

💇 ${booking.serviceName || booking.service?.name}
📅 ${this.formatDate(booking.date)}
🕐 ${booking.startTime}

${reason ? `Причина: ${reason}` : ''}
      `.trim();
      
      try {
        await this.sendMessage(business.adminTelegramId, adminMessage);
        recipients.push(business.adminTelegramId);
      } catch (error) {
        console.error('Failed to send cancellation to admin:', error);
      }
    }
    
    await this.logNotification(booking.businessId, booking.id, 'cancellation', recipients.join(','), 'sent');
  }

  /**
   * Уведомление о переносе записи
   */
  async sendRescheduleNotification(booking) {
    if (!booking.telegramId) return null;
    
    const business = await this.prisma.business.findUnique({
      where: { id: booking.businessId }
    });
    
    const message = `
🔄 <b>Запись перенесена</b>

💇 <b>Услуга:</b> ${booking.serviceName || booking.service?.name}

📅 <b>Новая дата:</b> ${this.formatDate(booking.date)}
🕐 <b>Новое время:</b> ${booking.startTime}

📍 <b>Адрес:</b> ${business?.address || 'Не указан'}
    `.trim();
    
    try {
      const result = await this.sendMessage(booking.telegramId, message);
      
      await this.logNotification(booking.businessId, booking.id, 'reschedule', booking.telegramId, 'sent');
      
      return result;
    } catch (error) {
      await this.logNotification(booking.businessId, booking.id, 'reschedule', booking.telegramId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Логирование уведомления
   */
  async logNotification(businessId, bookingId, type, telegramId, status, error = null) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          businessId,
          bookingId,
          type,
          telegramId,
          status,
          error
        }
      });
    } catch (err) {
      console.error('Failed to log notification:', err);
    }
  }

  /**
   * Форматирование даты
   */
  formatDate(date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'd MMMM, EEEE', { locale: ru });
  }

  /**
   * Форматирование цены
   */
  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100); // Предполагаем, что цена в копейках
  }
}

module.exports = NotificationService;
