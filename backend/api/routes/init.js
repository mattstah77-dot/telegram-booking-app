const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

/**
 * POST /api/init
 * Инициализация базы данных: создание таблиц + заполнение данными
 */
router.post('/', async (req, res, next) => {
  try {
    // Сначала применяем миграции (создаём таблицы)
    console.log('Pushing database schema...');
    
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('Database schema pushed successfully');
    } catch (pushError) {
      console.error('Push error:', pushError.message);
      // Продолжаем даже если ошибка - возможно таблицы уже есть
    }

    // Проверка - есть ли уже бизнес
    const existingBusiness = await prisma.business.findFirst().catch(() => null);
    
    if (existingBusiness) {
      return res.status(200).json({
        success: true,
        message: 'Database already initialized',
        business: existingBusiness
      });
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

    // Создать расписание
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

    res.status(201).json({
      success: true,
      message: 'Database initialized successfully',
      business,
      servicesCount: services.length
    });
  } catch (error) {
    console.error('Init error:', error);
    next(error);
  }
});

module.exports = router;
