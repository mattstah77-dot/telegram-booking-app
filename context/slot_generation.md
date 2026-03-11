# Slot Generation Algorithm

## 📋 Описание алгоритма

Алгоритм генерирует доступные временные слоты на основе:
- Графика работы бизнеса
- Длительности выбранной услуги
- Буфера между записями
- Существующих записей
- Выходных и праздничных дней
- Перерывов (обед и т.д.)

### Ключевые особенности

1. **Кэширование слотов** — предварительная генерация на 14 дней
2. **TTL кэша** — 24 часа
3. **Инвалидация** — при создании/отмене записи
4. **Защита от double booking** — через транзакции БД

---

## 🔄 Общий алгоритм

```
┌─────────────────────────────────────────────────────────┐
│                   ВХОДНЫЕ ДАННЫЕ                         │
│  - businessId                                            │
│  - date                                                  │
│  - serviceId                                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                ШАГ 1: Проверка кэша                      │
│  SELECT FROM slot_cache WHERE ...                        │
│  - Если есть и не истёк TTL → вернуть из кэша           │
│  - Иначе → генерировать                                 │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  ШАГ 2: Проверка дня                     │
│  - Получить schedule для weekday                        │
│  - Проверить exceptions (holiday/closed)                │
│  - Если выходной → []                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ШАГ 3: Получение данных                     │
│  - service.durationMinutes                              │
│  - service.bufferMinutes или business.bufferMinutes     │
│  - schedule.startTime, endTime                          │
│  - breaks[] (перерывы)                                  │
│  - bookings[] (существующие записи)                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               ШАГ 4: Генерация слотов                    │
│  step = duration + buffer                               │
│  for time from start to end-step:                       │
│    slots.push({ time, endTime, available: true })       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ШАГ 5: Фильтрация слотов                    │
│  1. Фильтр по перерывам (breaks)                        │
│  2. Фильтр по существующим записям (bookings)           │
│  3. Фильтр прошедшего времени (если сегодня)            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               ШАГ 6: Сохранение в кэш                    │
│  INSERT INTO slot_cache (...)                           │
│  SET expiresAt = now + TTL                              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  РЕЗУЛЬТАТ                               │
│  [{ time, endTime, durationMinutes, available }]        │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 Математическая модель

### Основные параметры

```
W_start = время начала работы (например, 09:00)
W_end   = время окончания работы (например, 18:00)
D       = длительность услуги (минуты)
B       = буфер между записями (минуты)
S       = шаг слота = D + B
```

### Расчёт количества слотов

```
Рабочее время = W_end - W_start (в минутах)
Количество слотов = floor(Рабочее время / S)
```

### Пример

```
W_start = 09:00 = 540 минут
W_end   = 18:00 = 1080 минут
D       = 30 минут
B       = 10 минут

Рабочее время = 1080 - 540 = 540 минут
S = 30 + 10 = 40 минут
Количество слотов = floor(540 / 40) = 13 слотов

Слоты: 09:00, 09:40, 10:20, 11:00, 11:40, 12:20, 
       13:00, 13:40, 14:20, 15:00, 15:40, 16:20, 17:00
```

---

## 💻 Реализация

### Класс SlotGenerator

```javascript
class SlotGenerator {
  constructor(config) {
    this.workingHours = config.workingHours;
    this.bufferTime = config.bufferTime || 10;
    this.holidays = config.holidays || [];
    this.breaks = config.breaks || [];
  }

  /**
   * Генерация слотов на определённую дату
   */
  generateSlots(date, serviceDuration) {
    // 1. Проверка на выходной/праздник
    if (this.isDayOff(date)) {
      return [];
    }

    // 2. Получить рабочие часы на этот день
    const workHours = this.getWorkHours(date);
    if (!workHours || !workHours.isWorking) {
      return [];
    }

    // 3. Сгенерировать все возможные слоты
    const allSlots = this.generateAllSlots(workHours, serviceDuration);

    // 4. Получить существующие записи
    const bookings = await this.getBookingsForDate(date);

    // 5. Отфильтровать доступные слоты
    const availableSlots = this.filterAvailableSlots(allSlots, bookings, serviceDuration);

    // 6. Учесть перерывы
    const finalSlots = this.filterBreaks(availableSlots);

    // 7. Удалить прошедшие слоты (если сегодня)
    const currentTimeSlots = this.filterPastSlots(finalSlots, date);

    return currentTimeSlots;
  }

  /**
   * Проверка на выходной или праздник
   */
  isDayOff(date) {
    const d = new Date(date);
    
    // Проверка на праздничный день
    const dateStr = this.formatDate(date);
    if (this.holidays.includes(dateStr)) {
      return true;
    }

    return false;
  }

  /**
   * Получить рабочие часы для дня недели
   */
  getWorkHours(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = воскресенье, 6 = суббота
    
    return this.workingHours[dayOfWeek];
  }

  /**
   * Генерация всех возможных слотов
   */
  generateAllSlots(workHours, serviceDuration) {
    const slots = [];
    const step = serviceDuration + this.bufferTime;
    
    const startMinutes = this.timeToMinutes(workHours.start);
    const endMinutes = this.timeToMinutes(workHours.end);
    
    // Максимальное время начала слота
    // (чтобы услуга успела закончиться до закрытия)
    const latestStart = endMinutes - serviceDuration;

    let currentMinutes = startMinutes;
    
    while (currentMinutes <= latestStart) {
      slots.push({
        time: this.minutesToTime(currentMinutes),
        endTime: this.minutesToTime(currentMinutes + serviceDuration),
        available: true
      });
      
      currentMinutes += step;
    }

    return slots;
  }

  /**
   * Фильтрация занятых слотов
   */
  filterAvailableSlots(slots, bookings, serviceDuration) {
    return slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.time);
      const slotEnd = slotStart + serviceDuration;

      // Проверить пересечение с каждой записью
      const hasConflict = bookings.some(booking => {
        const bookingStart = this.timeToMinutes(booking.time);
        const bookingEnd = bookingStart + booking.duration;

        // Пересечение?
        return this.hasOverlap(slotStart, slotEnd, bookingStart, bookingEnd);
      });

      return {
        ...slot,
        available: !hasConflict
      };
    });
  }

  /**
   * Проверка пересечения интервалов
   */
  hasOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Фильтрация по перерывам
   */
  filterBreaks(slots) {
    return slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.time);
      
      // Проверить, попадает ли слот на перерыв
      const isInBreak = this.breaks.some(breakTime => {
        const breakStart = this.timeToMinutes(breakTime.start);
        const breakEnd = this.timeToMinutes(breakTime.end);
        
        return slotStart >= breakStart && slotStart < breakEnd;
      });

      return {
        ...slot,
        available: slot.available && !isInBreak
      };
    });
  }

  /**
   * Удаление прошедших слотов
   */
  filterPastSlots(slots, date) {
    const now = new Date();
    const targetDate = new Date(date);
    
    // Если дата не сегодня — все слоты доступны
    if (targetDate.toDateString() !== now.toDateString()) {
      return slots;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.map(slot => {
      const slotMinutes = this.timeToMinutes(slot.time);
      
      // Добавить буфер (минимум 30 минут до записи)
      const minBookingTime = currentMinutes + 30;

      return {
        ...slot,
        available: slot.available && slotMinutes > minBookingTime
      };
    });
  }

  /**
   * Получить записи на дату
   */
  async getBookingsForDate(date) {
    // Реализация зависит от БД
    // Пример для Firestore:
    const snapshot = await db.collection('bookings')
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    return snapshot.docs.map(doc => ({
      time: doc.data().time,
      duration: doc.data().duration
    }));
  }

  /**
   * Вспомогательные функции
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}

module.exports = SlotGenerator;
```

---

## 🎯 Оптимизации

### 1. Кэширование слотов

```javascript
class CachedSlotGenerator extends SlotGenerator {
  constructor(config) {
    super(config);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  async generateSlots(date, serviceDuration) {
    const cacheKey = `${date}-${serviceDuration}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.slots;
    }

    const slots = await super.generateSlots(date, serviceDuration);
    
    this.cache.set(cacheKey, {
      slots,
      timestamp: Date.now()
    });

    return slots;
  }

  invalidateCache(date) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(date)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 2. Предварительная генерация

```javascript
// Генерация слотов на неделю вперёд при старте
async function preGenerateSlots() {
  const today = new Date();
  const config = await getBusinessConfig();
  const services = await getServices();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    for (const service of services) {
      await generateAndCacheSlots(date, service.id);
    }
  }
}
```

---

## 📊 Примеры использования

### Пример 1: Стандартный барбершоп

```javascript
const barberConfig = {
  workingHours: {
    0: { isWorking: false },                    // Воскресенье - выходной
    1: { start: '10:00', end: '20:00', isWorking: true },
    2: { start: '10:00', end: '20:00', isWorking: true },
    3: { start: '10:00', end: '20:00', isWorking: true },
    4: { start: '10:00', end: '20:00', isWorking: true },
    5: { start: '10:00', end: '20:00', isWorking: true },
    6: { start: '10:00', end: '18:00', isWorking: true }  // Суббота - сокращённый день
  },
  bufferTime: 10, // 10 минут между записями
  breaks: [
    { start: '14:00', end: '14:30' } // Обед
  ],
  holidays: ['2025-01-01', '2025-01-02', '2025-01-07']
};

const generator = new SlotGenerator(barberConfig);

// Генерация слотов на 15 января 2025 для стрижки (30 минут)
const slots = await generator.generateSlots('2025-01-15', 30);

console.log(slots);
// [
//   { time: '10:00', endTime: '10:30', available: true },
//   { time: '10:40', endTime: '11:10', available: true },
//   ...
// ]
```

### Пример 2: Салон красоты с разной длительностью

```javascript
// Услуга: Маникюр (60 минут)
const manicureSlots = await generator.generateSlots('2025-01-15', 60);

// Услуга: Стрижка (30 минут)
const haircutSlots = await generator.generateSlots('2025-01-15', 30);

// Разные слоты для разных услуг!
```

### Пример 3: Автомойка с несколькими боксами

```javascript
class MultiBoxSlotGenerator extends SlotGenerator {
  constructor(config) {
    super(config);
    this.boxCount = config.boxCount || 1;
  }

  async generateSlots(date, serviceDuration) {
    const baseSlots = await super.generateSlots(date, serviceDuration);
    
    // Для каждого слота показывать количество свободных мест
    const bookings = await this.getBookingsForDate(date);
    
    return baseSlots.map(slot => {
      const concurrentBookings = bookings.filter(b => 
        b.time === slot.time
      ).length;
      
      const remainingSlots = this.boxCount - concurrentBookings;
      
      return {
        ...slot,
        remainingSlots,
        available: remainingSlots > 0
      };
    });
  }
}

const carWashConfig = {
  // ...
  boxCount: 3 // 3 бокса для мойки
};
```

---

## ⚠️ Краевые случаи

### 1. Последний слот дня

```javascript
// Проблема: слот 17:30 для услуги 30 мин при закрытии в 18:00
// Решение: проверка latestStart

generateAllSlots(workHours, serviceDuration) {
  // ...
  const latestStart = endMinutes - serviceDuration;
  // Если закрытие в 18:00 (1080 мин) и услуга 30 мин
  // latestStart = 1080 - 30 = 1050 (17:30)
  // Слот 17:30 — последний возможный
}
```

### 2. Перерыв в середине дня

```javascript
// Обед с 14:00 до 14:30
// Слот 13:40 (услуга 30 мин) заканчивается в 14:10 — пересекает обед

filterBreaks(slots) {
  return slots.map(slot => {
    // Проверять не только начало слота, но и конец
    const slotEnd = this.timeToMinutes(slot.endTime);
    
    const overlapsBreak = this.breaks.some(breakTime => {
      const breakStart = this.timeToMinutes(breakTime.start);
      const breakEnd = this.timeToMinutes(breakTime.end);
      
      // Слот пересекает перерыв?
      return this.hasOverlap(
        this.timeToMinutes(slot.time),
        slotEnd,
        breakStart,
        breakEnd
      );
    });

    return {
      ...slot,
      available: slot.available && !overlapsBreak
    };
  });
}
```

### 3. Сегодня после рабочего времени

```javascript
filterPastSlots(slots, date) {
  const now = new Date();
  const targetDate = new Date(date);
  
  // Если сегодня и уже после закрытия
  if (targetDate.toDateString() === now.toDateString()) {
    const workHours = this.getWorkHours(date);
    const endMinutes = this.timeToMinutes(workHours.end);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    if (currentMinutes >= endMinutes) {
      return []; // Все слоты недоступны
    }
  }
  
  // ... остальная логика
}
```

---

## 📈 Производительность

### Сложность алгоритма

```
O(n + m + b)

где:
n = количество базовых слотов (обычно 10-30)
m = количество существующих записей на день
b = количество перерывов (обычно 1-2)

Для типичного дня:
- 20 базовых слотов
- 10 существующих записей
- 1 перерыв
= 31 операция
```

### Оптимизации

1. **Кэширование**
```sql
-- Предварительная генерация на 14 дней
INSERT INTO slot_cache (business_id, date, time, ...)
SELECT ... FROM generate_series(...);
```

2. **Индексы**
```sql
CREATE INDEX idx_slot_cache_lookup ON slot_cache(business_id, date, duration_minutes);
CREATE INDEX idx_slot_cache_expires ON slot_cache(business_id, expires_at);
```

3. **TTL**
```javascript
// Автоматическая очистка истёкшего кэша
DELETE FROM slot_cache WHERE expires_at < NOW();
```

4. **Инвалидация при изменениях**
```javascript
// При создании/отмене записи
await slotEngine.invalidateCache(businessId, date);
```

---

## 📝 Примечания для AI агента

1. **Всегда учитывай буфер** между записями
2. **Проверяй пересечения** корректно
3. **Учитывай перерывы** в середине дня
4. **Фильтруй прошедшие слоты** для сегодняшнего дня
5. **Кэшируй результаты** на 5 минут
6. **Инвалидируй кэш** при создании/отмене записи
