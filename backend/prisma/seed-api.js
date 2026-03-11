const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Инициализация базы данных начальными данными
 */
async function seedDatabase() {
  console.log('Seeding database...');

  // Проверка - есть ли уже бизнес
  const existingBusiness = await prisma.business.findFirst();
  if (existingBusiness) {
    console.log('Database already seeded, skipping...');
    return { seeded: false, business: existingBusiness };
  }

  // Создать бизнес
  const business = await prisma.business.create({
    data: {
      id: 'demo-business',
      name: 'Барбершоп "Бородач"',
      description: 'Мужские стрижки и бритьё',
      address: 'ул. Ленина, 15',
      phone: '+7 (999) 123-45-67',
      timezone: 'Europe/Moscow',
      adminTelegramId: process.env.ADMIN_TELEGRAM_ID || '123456789',
      bufferMinutes: 10,
      maxDaysAhead: 30,
      minBookingMinutes: 30,
      cancellationHours: 2,
      autoConfirm: true
    }
  });

  console.log('Created business:', business.name);

  // Создать услуги
  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: 'service-1',
        businessId: business.id,
        name: 'Мужская стрижка',
        description: 'Классическая мужская стрижка с мытьём головы',
        price: 50000,
        durationMinutes: 30,
        order: 1,
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        id: 'service-2',
        businessId: business.id,
        name: 'Стрижка бороды',
        description: 'Моделирование и стрижка бороды',
        price: 30000,
        durationMinutes: 20,
        order: 2,
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        id: 'service-3',
        businessId: business.id,
        name: 'Комплекс',
        description: 'Стрижка + борода + мытьё головы',
        price: 70000,
        durationMinutes: 50,
        order: 3,
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        id: 'service-4',
        businessId: business.id,
        name: 'Детская стрижка',
        description: 'Стрижка для детей до 12 лет',
        price: 40000,
        durationMinutes: 25,
        order: 4,
        isActive: true
      }
    })
  ]);

  console.log('Created services:', services.length);

  // Создать расписание (1-5 пн-пт, 6 сб, 0 вс)
  const schedule = await Promise.all([
    ...[1, 2, 3, 4, 5].map(weekday =>
      prisma.schedule.create({
        data: {
          businessId: business.id,
          weekday,
          isWorking: true,
          startTime: '09:00',
          endTime: '20:00'
        }
      })
    ),
    prisma.schedule.create({
      data: {
        businessId: business.id,
        weekday: 6,
        isWorking: true,
        startTime: '10:00',
        endTime: '18:00'
      }
    }),
    prisma.schedule.create({
      data: {
        businessId: business.id,
        weekday: 0,
        isWorking: false,
        startTime: '00:00',
        endTime: '00:00'
      }
    })
  ]);

  console.log('Created schedule:', schedule.length);

  // Создать перерыв
  await prisma.break.create({
    data: {
      id: 'break-1',
      businessId: business.id,
      name: 'Обед',
      startTime: '13:00',
      endTime: '14:00'
    }
  });

  console.log('Seeding completed!');

  return { seeded: true, business, services };
}

module.exports = { seedDatabase };
