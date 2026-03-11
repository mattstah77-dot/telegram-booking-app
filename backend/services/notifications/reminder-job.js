/**
 * Reminder Job
 * Scheduled job for sending reminders
 */

const { addHours, startOfHour, endOfHour } = require('date-fns');

class ReminderJob {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Run reminder job (called every hour)
   */
  async run() {
    console.log('Running reminder job...');
    
    await Promise.all([
      this.send24hReminders(),
      this.send1hReminders()
    ]);
  }

  /**
   * Send 24-hour reminders
   */
  async send24hReminders() {
    const now = new Date();
    const in24h = addHours(now, 24);
    
    // Найти записи через 24 часа, которым ещё не отправлено напоминание
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminder24hSent: false,
        date: {
          gte: startOfHour(in24h),
          lt: endOfHour(in24h)
        }
      }
    });
    
    console.log(`Found ${bookings.length} bookings for 24h reminder`);
    
    const NotificationService = require('../notifications');
    const notificationService = new NotificationService(this.prisma);
    
    for (const booking of bookings) {
      try {
        await notificationService.sendReminder24h(booking);
        console.log(`24h reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`Failed to send 24h reminder for booking ${booking.id}:`, error);
      }
    }
  }

  /**
   * Send 1-hour reminders
   */
  async send1hReminders() {
    const now = new Date();
    const in1h = addHours(now, 1);
    
    // Найти записи через 1 час, которым ещё не отправлено напоминание
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminder1hSent: false,
        date: {
          gte: startOfHour(in1h),
          lt: endOfHour(in1h)
        }
      }
    });
    
    console.log(`Found ${bookings.length} bookings for 1h reminder`);
    
    const NotificationService = require('../notifications');
    const notificationService = new NotificationService(this.prisma);
    
    for (const booking of bookings) {
      try {
        await notificationService.sendReminder1h(booking);
        console.log(`1h reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`Failed to send 1h reminder for booking ${booking.id}:`, error);
      }
    }
  }
}

module.exports = ReminderJob;
