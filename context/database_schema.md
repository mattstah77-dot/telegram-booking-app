# Database Schema

## 📊 Общая схема

```
┌─────────────┐       ┌─────────────┐
│  Business   │───────│   Services  │
│             │       │             │
│ id          │       │ id          │
│ name        │       │ name        │
│ address     │       │ price       │
│ phone       │       │ duration    │
│ timezone    │       │ isActive    │
└─────────────┘       └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  Schedule   │       │  Bookings   │
│             │       │             │
│ weekday     │       │ serviceId   │
│ startTime   │       │ date        │
│ endTime     │       │ startTime   │
│ isWorking   │       │ endTime     │
└─────────────┘       │ clientName  │
       │              │ clientPhone │
       │              │ status      │
       ▼              └─────────────┘
┌─────────────┐
│   Breaks    │       ┌─────────────┐
│             │       │ Exceptions  │
│ name        │       │             │
│ startTime   │       │ date        │
│ endTime     │       │ type        │
└─────────────┘       │ reason      │
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│ SlotCache   │       │  NotifLog   │
│             │       │             │
│ date        │       │ type        │
│ time        │       │ status      │
│ isAvailable │       │ sentAt      │
└─────────────┘       └─────────────┘
```

---

## 📋 Таблицы

### Business (Бизнес)

```prisma
model Business {
  id                String   @id @default(cuid())
  name              String
  description       String?
  address           String?
  phone             String?
  timezone          String   @default("Europe/Moscow")
  
  // Telegram
  botToken          String?  @map("bot_token")
  adminTelegramId   String?  @map("admin_telegram_id")
  
  // Settings
  bufferMinutes      Int      @default(10)
  maxDaysAhead       Int      @default(30)
  minBookingMinutes  Int      @default(30)
  cancellationHours  Int      @default(2)
  autoConfirm        Boolean  @default(true)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Поля:**
- `id` — уникальный идентификатор (CUID)
- `name` — название бизнеса
- `description` — описание (опционально)
- `address` — адрес
- `phone` — контактный телефон
- `timezone` — часовой пояс (по умолчанию Europe/Moscow)
- `botToken` — токен Telegram бота
- `adminTelegramId` — Telegram ID администратора
- `bufferMinutes` — буфер между записями (минуты)
- `maxDaysAhead` — максимальный горизонт записи (дни)
- `minBookingMinutes` — минимальное время до записи (минуты)
- `cancellationHours` — часы до отмены записи
- `autoConfirm` — автоподтверждение записей

---

### Service (Услуга)

```prisma
model Service {
  id                String  @id @default(cuid())
  businessId        String
  
  name              String
  description       String?
  
  price             Int     @default(0)  // в копейках
  durationMinutes   Int
  bufferMinutes     Int?
  
  isActive          Boolean @default(true)
  order             Int     @default(0)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Поля:**
- `id` — уникальный идентификатор
- `businessId` — ссылка на бизнес
- `name` — название услуги
- `description` — описание (опционально)
- `price` — цена в копейках (для точности)
- `durationMinutes` — длительность в минутах
- `bufferMinutes` — индивидуальный буфер (опционально)
- `isActive` — активна ли услуга
- `order` — порядок отображения

---

### Schedule (Расписание)

```prisma
model Schedule {
  id          String @id @default(cuid())
  businessId  String
  
  weekday     Int    // 0-6 (0 = воскресенье)
  
  isWorking   Boolean @default(true)
  startTime   String  // HH:mm
  endTime     String  // HH:mm
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([businessId, weekday])
}
```

**Поля:**
- `weekday` — день недели (0 = воскресенье, 6 = суббота)
- `isWorking` — рабочий ли день
- `startTime` — время начала работы (HH:mm)
- `endTime` — время окончания работы (HH:mm)

**Пример:**
```
weekday: 1, isWorking: true, startTime: "09:00", endTime: "18:00"  // Понедельник
weekday: 0, isWorking: false, startTime: "00:00", endTime: "00:00" // Воскресенье
```

---

### Break (Перерыв)

```prisma
model Break {
  id          String @id @default(cuid())
  businessId  String
  
  name        String?
  
  startTime   String  // HH:mm
  endTime     String  // HH:mm
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Поля:**
- `name` — название перерыва (например, "Обед")
- `startTime` — время начала
- `endTime` — время окончания

---

### Exception (Исключение)

```prisma
model Exception {
  id          String @id @default(cuid())
  businessId  String
  
  date        DateTime @db.Date
  
  type        String  // 'holiday' | 'closed' | 'special_hours'
  
  openTime    String?
  closeTime   String?
  reason      String?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([businessId, date])
}
```

**Типы исключений:**
- `holiday` — праздничный день (не работаем)
- `closed` — день закрыт (ремонт и т.д.)
- `special_hours` — особые часы работы

**Пример:**
```json
{
  "date": "2025-01-01",
  "type": "holiday",
  "reason": "Новый год"
}
```

---

### Booking (Запись)

```prisma
model Booking {
  id          String @id @default(cuid())
  businessId  String
  serviceId   String
  
  date        DateTime @db.Date
  startTime   String   // HH:mm
  endTime     String   // HH:mm
  
  clientName   String
  clientPhone  String
  telegramId   String?
  
  status       String @default("pending")
  
  // Snapshot данных услуги
  serviceName  String
  price        Int
  duration     Int
  
  // Отмена
  cancelledAt   DateTime?
  cancelledBy   String?
  cancelReason  String?
  
  // Напоминания
  reminder24hSent  Boolean @default(false)
  reminder1hSent   Boolean @default(false)
  
  notes String?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Статусы:**
- `pending` — ожидает подтверждения
- `confirmed` — подтверждена
- `completed` — завершена
- `cancelled` — отменена
- `no_show` — клиент не пришёл

---

### SlotCache (Кэш слотов)

```prisma
model SlotCache {
  id          String @id @default(cuid())
  businessId  String
  
  date        DateTime @db.Date
  time        String   // HH:mm
  
  durationMinutes  Int
  endTime          String
  
  isAvailable  Boolean @default(true)
  bookingId    String?
  
  generatedAt  DateTime @default(now())
  expiresAt    DateTime
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([businessId, date, time])
}
```

**Назначение:**
- Предварительно сгенерированные слоты на 14 дней вперёд
- Ускоряет загрузку Mini App
- TTL = 24 часа

---

### NotificationLog (Лог уведомлений)

```prisma
model NotificationLog {
  id          String @id @default(cuid())
  businessId  String
  bookingId   String?
  
  type        String  // тип уведомления
  telegramId  String
  status      String  // 'sent' | 'failed'
  error       String?
  
  sentAt DateTime @default(now())
}
```

**Типы уведомлений:**
- `booking_created` — запись создана
- `reminder_24h` — напоминание за 24 часа
- `reminder_1h` — напоминание за 1 час
- `cancellation` — отмена записи
- `reschedule` — перенос записи

---

### AdminSession (Сессия админа)

```prisma
model AdminSession {
  id          String @id @default(cuid())
  businessId  String
  
  telegramId  String
  token       String  @unique
  expiresAt   DateTime
  
  createdAt DateTime @default(now())
}
```

**Назначение:**
- Авторизация в админ-панели Mini App
- JWT токены
- Срок жизни = 7 дней

---

## 🔍 Индексы

### Основные индексы

```sql
-- Services
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_active ON services(business_id, is_active);

-- Bookings
CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_date ON bookings(business_id, date);
CREATE INDEX idx_bookings_status ON bookings(business_id, date, status);
CREATE INDEX idx_bookings_telegram ON bookings(telegram_id);

-- SlotCache
CREATE INDEX idx_slots_business_date ON slot_cache(business_id, date);
CREATE INDEX idx_slots_expires ON slot_cache(business_id, expires_at);

-- Exceptions
CREATE INDEX idx_exceptions_date ON exceptions(business_id, date);
```

---

## 🔄 Миграции

### Создание миграции

```bash
npx prisma migrate dev --name init
```

### Применение миграций

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

---

## 🌱 Seed Data

```bash
npx prisma db seed
```

**Создаёт:**
- Демо-бизнес
- 4 услуги (стрижка, борода, комплекс, детская)
- Расписание на неделю
- Обеденный перерыв

---

## 📝 Примеры запросов

### Получить доступные слоты

```typescript
const slots = await prisma.slotCache.findMany({
  where: {
    businessId: 'business-id',
    date: new Date('2025-01-15'),
    isAvailable: true,
    expiresAt: { gte: new Date() }
  },
  orderBy: { time: 'asc' }
});
```

### Создать запись

```typescript
const booking = await prisma.booking.create({
  data: {
    businessId: 'business-id',
    serviceId: 'service-id',
    date: new Date('2025-01-15'),
    startTime: '14:00',
    endTime: '14:30',
    clientName: 'Иван',
    clientPhone: '+79991234567',
    telegramId: '123456789',
    serviceName: 'Мужская стрижка',
    price: 50000,
    duration: 30,
    status: 'confirmed'
  }
});
```

### Получить записи на сегодня

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const bookings = await prisma.booking.findMany({
  where: {
    businessId: 'business-id',
    date: today,
    status: { in: ['pending', 'confirmed'] }
  },
  include: { service: true },
  orderBy: { startTime: 'asc' }
});
```

---

## 🔒 Безопасность

### Изоляция данных

Каждый бизнес работает только со своими данными:

```typescript
// Middleware для проверки businessId
const checkBusinessAccess = (req, res, next) => {
  const businessId = req.headers['x-business-id'];
  
  // Все запросы фильтруются по businessId
  req.businessId = businessId;
  next();
};
```

### Удаление каскадом

```prisma
model Business {
  services   Service[]  // onDelete: Cascade
  bookings   Booking[]  // onDelete: Cascade
  schedule   Schedule[] // onDelete: Cascade
  // ...
}
```

При удалении бизнеса удаляются все связанные данные.

---

## 📝 Примечания для AI агента

1. **Использовать транзакции** для операций с несколькими таблицами
2. **Валидировать businessId** на каждом запросе
3. **Использовать индексы** для частых запросов
4. **Хранить цену в копейках** для точности
5. **Snapshot данных услуги** в записи (на случай изменения услуги)
