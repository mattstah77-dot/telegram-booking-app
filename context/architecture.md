# System Architecture

## 🏗️ Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      TELEGRAM CLIENT                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Bot Chat   │  │  Mini App    │  │  Notifications   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     BOT LAYER (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Commands   │  │   Handlers   │  │    Middleware    │  │
│  │  /start      │  │  Callbacks   │  │  Auth, Logging   │  │
│  │  /admin      │  │  Messages    │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MINI APP FRONTEND (React)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    React SPA                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │   Pages    │  │ Components │  │     Hooks      │  │  │
│  │  │  Services  │  │  ServiceCard│  │  useBooking    │  │  │
│  │  │  Calendar  │  │  Calendar  │  │  useSlots      │  │  │
│  │  │  Booking   │  │  TimePicker│  │  useTelegram   │  │  │
│  │  └────────────┘  └────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   REST API                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │  /services │  │   /slots   │  │   /bookings    │  │  │
│  │  │  /business │  │   /admin   │  │                │  │  │
│  │  └────────────┘  └────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVICES LAYER                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │  Booking   │  │   Slot     │  │  Notification  │  │  │
│  │  │  Engine    │  │  Engine    │  │  Service       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Prisma ORM                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │  Business  │  │  Services  │  │   Bookings     │  │  │
│  │  │  Schedule  │  │  Breaks    │  │   SlotCache    │  │  │
│  │  └────────────┘  └────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Слои системы

### 1. Bot Layer

**Ответственность:** Обработка команд и взаимодействие с Telegram Bot API.

```
bot/
├── index.js              # Точка входа
├── commands/
│   ├── start.js          # Команда /start
│   └── admin.js          # Команда /admin
├── handlers/
│   ├── callback.js       # Обработка callback queries
│   └── message.js        # Обработка сообщений
└── middleware/
    ├── auth.js           # Проверка прав
    └── logger.js         # Логирование
```

**Ключевые функции:**
- Отправка кнопки открытия Mini App
- Обработка callback от Mini App
- Отправка уведомлений
- Админ-команды

---

### 2. Mini App Frontend

**Ответственность:** Пользовательский интерфейс для бронирования.

```
miniapp/
├── src/
│   ├── main.jsx              # Точка входа
│   ├── App.jsx               # Корневой компонент
│   ├── pages/
│   │   ├── Services.jsx      # Список услуг
│   │   ├── Calendar.jsx      # Выбор даты
│   │   ├── TimeSlots.jsx     # Выбор времени
│   │   ├── Booking.jsx       # Форма записи
│   │   └── Confirmation.jsx  # Подтверждение
│   ├── components/
│   │   ├── ServiceCard.jsx   # Карточка услуги
│   │   ├── Calendar.jsx      # Календарь
│   │   ├── TimeSlot.jsx      # Слот времени
│   │   ├── BookingForm.jsx   # Форма записи
│   │   └── Header.jsx        # Шапка
│   ├── hooks/
│   │   ├── useTelegram.js    # Интеграция с TG
│   │   ├── useServices.js    # Загрузка услуг
│   │   ├── useSlots.js       # Загрузка слотов
│   │   └── useBooking.js     # Создание записи
│   ├── context/
│   │   └── BookingContext.jsx
│   └── utils/
│       ├── api.js            # API клиент
│       └── formatting.js     # Форматирование
└── public/
    └── index.html
```

**Ключевые принципы:**
- SPA с React Router
- State management через Zustand/Context
- Интеграция с Telegram WebApp SDK
- Оптимистичные обновления UI

---

### 3. Backend Layer

**Ответственность:** Бизнес-логика и API.

```
backend/
├── api/
│   ├── routes/
│   │   ├── services.js        # API услуг
│   │   ├── slots.js           # API слотов
│   │   ├── bookings.js        # API записей
│   │   ├── business.js        # API бизнеса
│   │   └── admin.js           # API админ-панели
│   ├── middleware/
│   │   ├── auth.js            # Авторизация
│   │   └── errorHandler.js    # Обработка ошибок
│   └── controllers/
│       └── ...
├── services/
│   ├── booking-engine/        # Движок бронирования
│   │   └── index.js
│   ├── slot-engine/           # Генерация слотов
│   │   └── index.js
│   ├── notifications/         # Уведомления
│   │   ├── index.js
│   │   └── reminder-job.js
│   └── admin/                 # Админ-функции
│       └── ...
├── prisma/
│   ├── schema.prisma          # Схема БД
│   ├── migrations/            # Миграции
│   └── seed.js                # Начальные данные
├── utils/
│   ├── telegram-auth.js       # Валидация Telegram
│   └── validation.js          # Валидация данных
├── config/
│   └── index.js               # Конфигурация
└── index.js                   # Точка входа
```

**API Endpoints:**
```
# Services
GET    /api/services           # Получить услуги
GET    /api/services/:id       # Получить услугу
POST   /api/services           # Создать услугу (admin)
PUT    /api/services/:id       # Обновить услугу (admin)
DELETE /api/services/:id       # Удалить услугу (admin)

# Slots
GET    /api/slots/:date        # Получить слоты на дату
POST   /api/slots/generate     # Сгенерировать кэш (admin)
DELETE /api/slots/cache        # Очистить кэш (admin)

# Bookings
GET    /api/bookings           # Получить записи
GET    /api/bookings/:id       # Получить запись
POST   /api/bookings           # Создать запись
POST   /api/bookings/:id/cancel    # Отменить запись
POST   /api/bookings/:id/reschedule # Перенести запись
PUT    /api/bookings/:id/status    # Изменить статус (admin)

# Business
GET    /api/business           # Получить информацию
PUT    /api/business           # Обновить (admin)
GET    /api/business/schedule  # Получить расписание
PUT    /api/business/schedule/:weekday # Обновить день
GET    /api/business/exceptions # Получить исключения
POST   /api/business/exceptions # Добавить исключение (admin)
DELETE /api/business/exceptions/:id # Удалить исключение (admin)

# Admin
POST   /api/admin/auth         # Авторизация
POST   /api/admin/logout       # Выход
GET    /api/admin/dashboard    # Статистика
GET    /api/admin/bookings     # Все записи
```

---

### 4. Slot Generation Engine

**Ответственность:** Динамическая генерация и кэширование временных слотов.

```javascript
class SlotEngine {
  constructor(prisma) {
    this.prisma = prisma;
    this.cacheDays = 14;
    this.cacheTTLHours = 24;
  }

  // Получить слоты (из кэша или сгенерировать)
  async getAvailableSlots(businessId, date, serviceId) {
    // 1. Попробовать кэш
    const cached = await this.getCachedSlots(businessId, date, serviceId);
    if (cached) return cached;
    
    // 2. Сгенерировать
    const slots = await this.generateSlotsForDate(businessId, date, serviceId);
    
    // 3. Сохранить в кэш
    await this.saveSlotsToCache(businessId, date, serviceId, slots);
    
    return slots;
  }

  // Предварительная генерация на N дней
  async generateSlotsCache(businessId, days = 14) {
    for (let i = 0; i < days; i++) {
      const date = addDays(new Date(), i);
      for (const service of services) {
        const slots = await this.generateSlotsForDate(businessId, date, service.id);
        await this.saveSlotsToCache(businessId, date, service.id, slots);
      }
    }
  }

  // Инвалидация кэша при записи/отмене
  async invalidateCache(businessId, date) {
    await this.prisma.slotCache.deleteMany({
      where: { businessId, date }
    });
  }
}
```

---

### 5. Admin Configuration

**Ответственность:** Управление настройками бизнеса.

```
config/
├── business.json      # Название, адрес, контакты
├── services.json      # Список услуг
├── schedule.json      # График работы
└── holidays.json      # Выходные дни
```

**Админ-функции:**
- Настройка профиля бизнеса
- Управление услугами (CRUD)
- Настройка графика работы
- Управление выходными
- Просмотр записей

---

## 🔄 Потоки данных

### Поток бронирования

```
User Action → Mini App → API → Booking Service
                                      ↓
                              Validation
                                      ↓
                              Slot Check
                                      ↓
                              Save to DB
                                      ↓
                              Notification
                                      ↓
                            Response to User
```

### Поток генерации слотов

```
Request → API → Slot Generator
                   ↓
            Load Config (schedule, services)
                   ↓
            Load Bookings
                   ↓
            Calculate Slots
                   ↓
            Return Available Slots
```

---

## 🗄️ Модели данных

### Booking
```typescript
interface Booking {
  id: string;
  serviceId: string;
  date: string;           // ISO date
  time: string;           // HH:mm
  duration: number;       // minutes
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: timestamp;
  telegramId?: string;
}
```

### Service
```typescript
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;       // minutes
  isActive: boolean;
  order: number;
}
```

### Business
```typescript
interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: {
    [day: number]: {      // 0-6 (воскресенье-суббота)
      start: string;      // HH:mm
      end: string;        // HH:mm
      isWorking: boolean;
    }
  };
  bufferTime: number;     // minutes between bookings
  timezone: string;
}
```

### Slot
```typescript
interface Slot {
  time: string;           // HH:mm
  available: boolean;
  remainingSlots?: number;
}
```

---

## 🔐 Безопасность

### Telegram WebApp Validation
```javascript
// Проверка подписи Telegram
const validateTelegramWebApp = (initData) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // ... validation logic
};
```

### API Protection
- Rate limiting
- Input validation
- Telegram signature verification
- Admin authentication

---

## 📊 Масштабирование

### Горизонтальное масштабирование
- Stateless Firebase Functions
- Firestore auto-scaling
- CDN для Mini App

### Кэширование
- Кэш услуг на клиенте
- Кэш слотов на 5 минут
- Кэш бизнес-информации

---

## 🌍 Deployment

### Структура деплоя (1 бизнес = 1 деплой)

```
Business Instance:
├── Mini App (Vercel/Cloudflare Pages)
│   └── https://business-name.pages.dev
│
├── Backend API (VPS/Railway/Render)
│   └── https://api.business-name.com
│
├── Database (Supabase/Railway/Neon)
│   └── PostgreSQL instance
│
└── Bot (VPS/Railway)
    └── Telegram Bot
```

### Переменные окружения
```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=3001
NODE_ENV=production

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=

# Business
BUSINESS_ID=
ADMIN_TELEGRAM_ID=

# Security
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Slot Engine
SLOT_CACHE_DAYS=14
SLOT_CACHE_TTL_HOURS=24
```

---

## 📝 Примечания для AI агента

1. **Всегда используй TypeScript** для типизации
2. **Разделяй логику** по слоям (не смешивай)
3. **Валидируй данные** на всех уровнях
4. **Используй async/await** везде
5. **Обрабатывай ошибки** gracefully
