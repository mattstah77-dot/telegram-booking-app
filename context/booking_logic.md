# Booking Logic

## 📋 Общая логика бронирования

### Основной флоу

```
┌─────────────┐
│ Выбор услуги│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ Проверка    │────▶│ Услуга       │
│ доступности │     │ активна?     │
└──────┬──────┘     └──────────────┘
       │                    │
       │ Yes                │ No → Ошибка
       ▼                    ▼
┌─────────────┐
│ Выбор даты  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│ Генерация слотов│────▶│ Есть рабочие │
│ (из кэша)       │     │ часы?        │
└──────┬──────────┘     └──────────────┘
       │                        │
       │ Yes                    │ No → Выбрать другую дату
       ▼                        ▼
┌─────────────┐
│ Выбор слота │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│ Проверка слота  │────▶│ Слот свободен│
│ (transaction)   │     │              │
└──────┬──────────┘     └──────────────┘
       │                        │
       │ Yes                    │ No → Ошибка
       ▼                        ▼
┌─────────────┐
│ Ввод данных │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│ Валидация       │────▶│ Данные       │
│                 │     │ корректны?   │
└──────┬──────────┘     └──────────────┘
       │                        │
       │ Yes                    │ No → Показать ошибки
       ▼                        ▼
┌─────────────────┐
│ Создание записи │
│ (transaction)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Инвалидация     │
│ кэша слотов     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Уведомления     │
│ (клиент + админ)│
└─────────────────┘
```

### Защита от Double Booking

```javascript
// Использование транзакции PostgreSQL
await prisma.$transaction(async (tx) => {
  // 1. Проверить доступность слота с блокировкой
  const existingBooking = await tx.booking.findFirst({
    where: {
      businessId,
      date: dateObj,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        // Проверка пересечений интервалов
        { startTime: { lte: time }, endTime: { gt: time } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } }
      ]
    }
  });
  
  if (existingBooking) {
    throw new Error('Slot already booked');
  }
  
  // 2. Создать запись
  const booking = await tx.booking.create({
    data: { ... }
  });
  
  return booking;
});
```

---

## 🔄 Состояния записи

```typescript
type BookingStatus = 
  | 'pending'    // Ожидает подтверждения
  | 'confirmed'  // Подтверждена
  | 'completed'  // Завершена
  | 'cancelled'  // Отменена
  | 'no_show';   // Клиент не пришёл
```

### Диаграмма состояний

```
         ┌──────────┐
         │ pending  │
         └────┬─────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│confirmed │ │cancelled │ │ no_show  │
└────┬─────┘ └──────────┘ └──────────┘
     │
     ▼
┌──────────┐
│completed │
└──────────┘
```

---

## ✅ Валидация

### Валидация услуги

```javascript
function validateService(service) {
  // Проверка существования
  if (!service) {
    return { valid: false, error: 'Услуга не найдена' };
  }

  // Проверка активности
  if (!service.isActive) {
    return { valid: false, error: 'Услуга недоступна' };
  }

  // Проверка длительности
  if (!service.duration || service.duration < 5) {
    return { valid: false, error: 'Некорректная длительность' };
  }

  return { valid: true };
}
```

### Валидация даты

```javascript
function validateDate(date, businessConfig) {
  const selectedDate = new Date(date);
  const today = new Date();
  
  // Проверка на прошлое
  if (selectedDate < today.setHours(0, 0, 0, 0)) {
    return { valid: false, error: 'Нельзя выбрать прошедшую дату' };
  }

  // Проверка на выходной
  const dayOfWeek = selectedDate.getDay();
  if (!businessConfig.workingHours[dayOfWeek].isWorking) {
    return { valid: false, error: 'Выбранный день — выходной' };
  }

  // Проверка на праздничный день
  if (isHoliday(selectedDate, businessConfig.holidays)) {
    return { valid: false, error: 'Выбранный день — праздничный' };
  }

  // Проверка максимальной даты (например, +30 дней)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  if (selectedDate > maxDate) {
    return { valid: false, error: 'Запись доступна только на 30 дней вперёд' };
  }

  return { valid: true };
}
```

### Валидация временного слота

```javascript
async function validateTimeSlot(date, time, serviceId, duration) {
  // Проверка формата времени
  if (!isValidTimeFormat(time)) {
    return { valid: false, error: 'Некорректный формат времени' };
  }

  // Проверка доступности слота
  const isAvailable = await checkSlotAvailability(date, time, duration);
  if (!isAvailable) {
    return { valid: false, error: 'Выбранное время уже занято' };
  }

  // Проверка на прошлое время
  const slotDateTime = new Date(`${date}T${time}`);
  if (slotDateTime < new Date()) {
    return { valid: false, error: 'Выбранное время уже прошло' };
  }

  return { valid: true };
}
```

### Валидация данных клиента

```javascript
function validateCustomerData(data) {
  const errors = {};

  // Имя
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Имя должно содержать минимум 2 символа';
  }
  if (data.name.length > 50) {
    errors.name = 'Имя слишком длинное';
  }

  // Телефон
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    errors.phone = 'Некорректный номер телефона';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## 🔒 Блокировка слота

### Временная блокировка при выборе

```javascript
class SlotLockManager {
  constructor() {
    this.locks = new Map(); // slotId -> { expires, userId }
    this.LOCK_DURATION = 5 * 60 * 1000; // 5 минут
  }

  // Заблокировать слот
  lock(slotId, userId) {
    const existing = this.locks.get(slotId);
    
    // Если слот уже заблокирован другим пользователем
    if (existing && existing.userId !== userId && existing.expires > Date.now()) {
      return { success: false, reason: 'already_locked' };
    }

    this.locks.set(slotId, {
      userId,
      expires: Date.now() + this.LOCK_DURATION
    });

    return { success: true };
  }

  // Разблокировать слот
  unlock(slotId, userId) {
    const lock = this.locks.get(slotId);
    if (lock && lock.userId === userId) {
      this.locks.delete(slotId);
    }
  }

  // Проверить блокировку
  isLocked(slotId, userId) {
    const lock = this.locks.get(slotId);
    if (!lock) return false;
    if (lock.expires < Date.now()) {
      this.locks.delete(slotId);
      return false;
    }
    return lock.userId !== userId;
  }

  // Очистка истёкших блокировок
  cleanup() {
    const now = Date.now();
    for (const [slotId, lock] of this.locks.entries()) {
      if (lock.expires < now) {
        this.locks.delete(slotId);
      }
    }
  }
}
```

---

## 📝 Создание записи

### Основная функция

```javascript
async function createBooking(bookingData) {
  const { serviceId, date, time, customerName, customerPhone, telegramId } = bookingData;

  // 1. Начать транзакцию
  const transaction = await db.beginTransaction();

  try {
    // 2. Получить услугу
    const service = await getService(serviceId);
    const serviceValidation = validateService(service);
    if (!serviceValidation.valid) {
      throw new Error(serviceValidation.error);
    }

    // 3. Проверить дату
    const businessConfig = await getBusinessConfig();
    const dateValidation = validateDate(date, businessConfig);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }

    // 4. Проверить слот
    const slotValidation = await validateTimeSlot(date, time, serviceId, service.duration);
    if (!slotValidation.valid) {
      throw new Error(slotValidation.error);
    }

    // 5. Создать запись
    const booking = {
      id: generateId(),
      serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      date,
      time,
      duration: service.duration,
      customerName,
      customerPhone,
      status: 'pending',
      telegramId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 6. Сохранить в базу
    await db.collection('bookings').add(booking);

    // 7. Зафиксировать транзакцию
    await transaction.commit();

    // 8. Отправить уведомления
    await sendNotifications(booking);

    return { success: true, booking };

  } catch (error) {
    await transaction.rollback();
    return { success: false, error: error.message };
  }
}
```

---

## 🔔 Уведомления

### Типы уведомлений

```typescript
type NotificationType = 
  | 'booking_created'      // Новая запись
  | 'booking_confirmed'    // Запись подтверждена
  | 'booking_cancelled'    // Запись отменена
  | 'booking_reminder'     // Напоминание за 1 час
  | 'booking_completed';   // Запись завершена
```

### Отправка уведомлений

```javascript
async function sendNotifications(booking) {
  // Уведомление клиенту
  if (booking.telegramId) {
    await sendTelegramMessage(booking.telegramId, {
      text: formatClientNotification(booking),
      parse_mode: 'HTML'
    });
  }

  // Уведомление администратору
  const adminId = await getAdminTelegramId();
  await sendTelegramMessage(adminId, {
    text: formatAdminNotification(booking),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_${booking.id}` },
          { text: '❌ Отменить', callback_data: `cancel_${booking.id}` }
        ]
      ]
    }
  });
}
```

### Шаблоны сообщений

```javascript
function formatClientNotification(booking) {
  return `
📅 <b>Ваша запись подтверждена!</b>

💇 Услуга: ${booking.serviceName}
📅 Дата: ${formatDate(booking.date)}
🕐 Время: ${booking.time}
💰 Стоимость: ${booking.servicePrice} ₽

📍 Адрес: ул. Ленина, 15
📞 Телефон: +7 (999) 123-45-67

⚠️ За 1 час придёт напоминание
  `.trim();
}

function formatAdminNotification(booking) {
  return `
🔔 <b>Новая запись!</b>

👤 Клиент: ${booking.customerName}
📞 Телефон: ${booking.customerPhone}

💇 Услуга: ${booking.serviceName}
📅 Дата: ${formatDate(booking.date)}
🕐 Время: ${booking.time}
💰 К оплате: ${booking.servicePrice} ₽
  `.trim();
}
```

---

## ❌ Отмена записи

### Логика отмены

```javascript
async function cancelBooking(bookingId, reason, cancelledBy) {
  const booking = await getBooking(bookingId);
  
  if (!booking) {
    return { success: false, error: 'Запись не найдена' };
  }

  // Проверка времени (нельзя отменить за< 2 часа)
  const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
  const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking < 2) {
    return { 
      success: false, 
      error: 'Нельзя отменить запись менее чем за 2 часа' 
    };
  }

  // Обновить статус
  await updateBooking(bookingId, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy,
    cancelReason: reason
  });

  // Уведомить клиента
  if (booking.telegramId) {
    await sendCancellationNotification(booking, reason);
  }

  return { success: true };
}
```

---

## 📊 Расчёт стоимости

### Базовая логика

```javascript
function calculatePrice(service, options = {}) {
  let price = service.price;

  // Дополнительные услуги
  if (options.extras) {
    for (const extra of options.extras) {
      price += extra.price;
    }
  }

  // Скидки
  if (options.discount) {
    price = price * (1 - options.discount / 100);
  }

  // Округление
  return Math.round(price);
}
```

---

## 🔄 Перенос записи

```javascript
async function rescheduleBooking(bookingId, newDate, newTime) {
  // 1. Получить текущую запись
  const booking = await getBooking(bookingId);
  
  // 2. Проверить новый слот
  const slotValidation = await validateTimeSlot(
    newDate, 
    newTime, 
    booking.serviceId, 
    booking.duration
  );
  
  if (!slotValidation.valid) {
    return { success: false, error: slotValidation.error };
  }

  // 3. Обновить запись
  const updated = await updateBooking(bookingId, {
    date: newDate,
    time: newTime,
    rescheduledAt: new Date().toISOString(),
    status: 'confirmed'
  });

  // 4. Уведомить
  await sendRescheduleNotification(updated);

  return { success: true, booking: updated };
}
```

---

## 📝 История записей

```javascript
async function getBookingHistory(telegramId, limit = 10) {
  const bookings = await db.collection('bookings')
    .where('telegramId', '==', telegramId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return bookings.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

## ⚠️ Обработка ошибок

### Коды ошибок

```javascript
const BookingErrors = {
  SERVICE_NOT_FOUND: 'Услуга не найдена',
  SERVICE_INACTIVE: 'Услуга недоступна',
  INVALID_DATE: 'Некорректная дата',
  DAY_OFF: 'Выбранный день — выходной',
  HOLIDAY: 'Выбранный день — праздничный',
  SLOT_TAKEN: 'Выбранное время уже занято',
  SLOT_PAST: 'Выбранное время уже прошло',
  INVALID_NAME: 'Некорректное имя',
  INVALID_PHONE: 'Некорректный номер телефона',
  BOOKING_LIMIT_EXCEEDED: 'Превышен лимит записей',
  CANCELLATION_TOO_LATE: 'Слишком поздно для отмены',
  UNKNOWN_ERROR: 'Произошла ошибка'
};
```

### Обработчик ошибок

```javascript
function handleBookingError(error) {
  console.error('Booking error:', error);

  // Определить тип ошибки
  const errorMap = {
    'service_not_found': BookingErrors.SERVICE_NOT_FOUND,
    'slot_taken': BookingErrors.SLOT_TAKEN,
    'invalid_phone': BookingErrors.INVALID_PHONE,
    // ...
  };

  const userMessage = errorMap[error.code] || BookingErrors.UNKNOWN_ERROR;

  return {
    success: false,
    error: userMessage,
    code: error.code
  };
}
```

---

## 📝 Чек-лист перед созданием записи

```javascript
async function preBookingCheck(bookingData) {
  const checks = [
    { name: 'service_exists', check: () => checkServiceExists(bookingData.serviceId) },
    { name: 'service_active', check: () => checkServiceActive(bookingData.serviceId) },
    { name: 'date_valid', check: () => checkDateValid(bookingData.date) },
    { name: 'slot_available', check: () => checkSlotAvailable(bookingData.date, bookingData.time) },
    { name: 'name_valid', check: () => checkNameValid(bookingData.customerName) },
    { name: 'phone_valid', check: () => checkPhoneValid(bookingData.customerPhone) }
  ];

  const results = [];
  
  for (const { name, check } of checks) {
    const result = await check();
    results.push({ name, ...result });
  }

  const allPassed = results.every(r => r.passed);

  return {
    canProceed: allPassed,
    checks: results,
    failedChecks: results.filter(r => !r.passed)
  };
}
```

---

## 📝 Примечания для AI агента

1. **Всегда валидируй** все входные данные
2. **Используй транзакции** для операций с БД
3. **Обрабатывай ошибки** gracefully
4. **Логируй все операции** для отладки
5. **Отправляй уведомления** после успешного создания
6. **Проверяй доступность** слота перед созданием записи
