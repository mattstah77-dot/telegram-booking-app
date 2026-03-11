const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Создать бизнес
  const business = await prisma.business.upsert({
    where: { id: 'demo-business' },
    update: {},
    create: {
      id: 'demo-business',
      name: 'Барбершоп "Бородач"',
      description: 'Мужские стрижки и бритьё',
      address: 'ул. Ленина, 15',
      phone: '+7 (999) 123-45-67',
      timezone: 'Europe/Moscow',
      adminTelegramId: '123456789', // Заменить на реальный ID
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
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        businessId: business.id,
        name: 'Мужская стрижка',
        description: 'Классическая мужская стрижка с мытьём головы',
        price: 50000, // 500 рублей (в копейках)
        durationMinutes: 30,
        order: 1,
        isActive: true
      }
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        businessId: business.id,
        name: 'Стрижка бороды',
        description: 'Моделирование и стрижка бороды',
        price: 30000, // 300 рублей
        durationMinutes: 20,
        order: 2,
        isActive: true
      }
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        businessId: business.id,
        name: 'Комплекс',
        description: 'Стрижка + борода + мытьё головы',
        price: 70000, // 700 рублей
        durationMinutes: 50,
        order: 3,
        isActive: true
      }
    }),
    prisma.service.upsert({
      where: { id: 'service-4' },
      update: {},
      create: {
        id: 'service-4',
        businessId: business.id,
        name: 'Детская стрижка',
        description: 'Стрижка для детей до 12 лет',
        price: 40000, // 400 рублей
        durationMinutes: 25,
        order: 4,
        isActive: true
      }
    })
  ]);

  console.log('Created services:', services.length);

  // Создать расписание
  const schedule = await Promise.all([
    // Понедельник - Пятница
    ...[1, 2, 3, 4, 5].map(weekday =>
      prisma.schedule.upsert({
        where: {
          businessId_weekday: {
            businessId: business.id,
            weekday
          }
        },
        update: {},
        create: {
          businessId: business.id,
          weekday,
          isWorking: true,
          startTime: '09:00',
          endTime: '20:00'
        }
      })
    ),
    // Суббота
    prisma.schedule.upsert({
      where: {
        businessId_weekday: {
          businessId: business.id,
          weekday: 6
        }
      },
      update: {},
      create: {
        businessId: business.id,
        weekday: 6,
        isWorking: true,
        startTime: '10:00',
        endTime: '18:00'
      }
    }),
    // Воскресенье
    prisma.schedule.upsert({
      where: {
        businessId_weekday: {
          businessId: business.id,
          weekday: 0
        }
      },
      update: {},
      create: {
        businessId: business.id,
        weekday: 0,
        isWorking: false,
        startTime: '00:00',
        endTime: '00:00'
      }
    })
  ]);

  console.log('Created schedule:', schedule.length);

  // Создать перерывы
  const breaks = await Promise.all([
    prisma.break.upsert({
      where: { id: 'break-1' },
      update: {},
      create: {
        id: 'break-1',
        businessId: business.id,
        name: 'Обед',
        startTime: '13:00',
        endTime: '14:00'
      }
    })
  ]);

  console.log('Created breaks:', breaks.length);

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
