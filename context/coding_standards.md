# Coding Standards

## 📋 Общие принципы

### 1. Чистый код
- Понятные имена переменных и функций
- Одна функция — одна ответственность
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)

### 2. Типизация
- Использовать TypeScript или JSDoc
- Все публичные функции должны иметь типы
- Избегать `any` где возможно

### 3. Документация
- Комментарии для сложной логики
- JSDoc для публичных API
- README для каждого модуля

---

## 📁 Структура файлов

### Именование файлов

```
Компоненты React:     PascalCase    → ServiceCard.jsx
Хуки:                 camelCase     → useTelegram.js
Утилиты:              camelCase     → formatDate.js
Сервисы:              camelCase     → bookingService.js
Константы:            UPPER_SNAKE   → API_ENDPOINTS.js
Типы:                 PascalCase    → Booking.types.ts
```

### Структура компонента

```jsx
/**
 * ServiceCard — карточка услуги
 * 
 * @component
 * @param {Object} props
 * @param {Service} props.service - Данные услуги
 * @param {Function} props.onSelect - Callback при выборе
 */
function ServiceCard({ service, onSelect }) {
  // 1. Хуки
  const [isSelected, setIsSelected] = useState(false);
  
  // 2. Вычисляемые значения
  const formattedPrice = formatPrice(service.price);
  
  // 3. Обработчики
  const handleClick = () => {
    setIsSelected(true);
    onSelect(service);
  };
  
  // 4. Рендер
  return (
    <div className="service-card" onClick={handleClick}>
      {/* ... */}
    </div>
  );
}

export default ServiceCard;
```

---

## 🎨 JavaScript/TypeScript

### Переменные

```javascript
// ❌ Плохо
const x = 30;
const data = getData();
let temp = '';

// ✅ Хорошо
const BOOKING_DURATION_MINUTES = 30;
const bookingData = await fetchBookingData();
let validationMessage = '';
```

### Функции

```javascript
// ❌ Плохо
function process(d) {
  // много кода
}

// ✅ Хорошо
/**
 * Обрабатывает бронирование и отправляет уведомления
 * 
 * @param {BookingData} bookingData - Данные бронирования
 * @returns {Promise<BookingResult>}
 */
async function processBooking(bookingData) {
  const validatedData = validateBookingData(bookingData);
  const booking = await createBooking(validatedData);
  await sendNotifications(booking);
  
  return { success: true, booking };
}
```

### Асинхронность

```javascript
// ❌ Плохо
const data = getData()
  .then(d => {
    return processData(d)
      .then(r => {
        return saveData(r);
      });
  });

// ✅ Хорошо
const data = await getData();
const processed = await processData(data);
const result = await saveData(processed);

// Параллельные запросы
const [services, config] = await Promise.all([
  fetchServices(),
  fetchConfig()
]);
```

### Обработка ошибок

```javascript
// ❌ Плохо
async function getData() {
  const response = await fetch(url);
  return response.json();
}

// ✅ Хорошо
async function getData() {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError('Failed to fetch data', { cause: error });
  }
}

// Использование
try {
  const data = await getData();
} catch (error) {
  if (error instanceof ApiError) {
    showError(`Ошибка сервера: ${error.message}`);
  } else if (error instanceof NetworkError) {
    showError('Проблема с соединением');
  }
}
```

---

## ⚛️ React

### Компоненты

```jsx
// ❌ Плохо — классовый компонент
class ServiceList extends React.Component {
  render() {
    return <div>...</div>;
  }
}

// ✅ Хорошо — функциональный компонент
function ServiceList({ services, onSelect }) {
  return (
    <div className="service-list">
      {services.map(service => (
        <ServiceCard 
          key={service.id}
          service={service}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
```

### Хуки

```jsx
// ❌ Плохо — хук в условии
function Component({ isLoading }) {
  if (isLoading) {
    const [data, setData] = useState(null); // Ошибка!
  }
}

// ✅ Хорошо — хуки на верхнем уровне
function Component({ isLoading }) {
  const [data, setData] = useState(null);
  
  if (isLoading) {
    return <Loading />;
  }
  
  return <DataView data={data} />;
}
```

### Кастомные хуки

```jsx
// ✅ Хорошо — кастомный хук
function useServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        const data = await api.getServices();
        if (isMounted) {
          setServices(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, []);

  return { services, isLoading, error };
}

// Использование
function ServicesPage() {
  const { services, isLoading, error } = useServices();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return <ServiceList services={services} />;
}
```

### Пропсы

```jsx
// ❌ Плохо — много пропсов
function BookingCard({ 
  id, name, phone, date, time, service, price, status, 
  onConfirm, onCancel, onEdit, onDelete 
}) {
  // ...
}

// ✅ Хорошо — группировка пропсов
function BookingCard({ 
  booking, 
  onConfirm, 
  onCancel 
}) {
  const { id, customer, service, schedule, status } = booking;
  // ...
}
```

---

## 🎨 CSS/Tailwind

### Tailwind классы

```jsx
// ❌ Плохо — неструктурированные классы
<div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-98">

// ✅ Хорошо — логическая группировка
<div className="
  p-4 
  bg-white 
  rounded-xl 
  border border-gray-200 
  shadow-sm 
  hover:shadow-md 
  transition-shadow 
  cursor-pointer 
  active:scale-98
">

// ✅ Ещё лучше — использование @apply в CSS
.card {
  @apply p-4 bg-white rounded-xl border border-gray-200 shadow-sm;
}
```

### Условные классы

```jsx
// ❌ Плохо
<div className={`slot ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}>

// ✅ Хорошо — использование clsx или classnames
import clsx from 'clsx';

<div className={clsx(
  'slot',
  isAvailable ? 'available' : 'unavailable',
  isSelected && 'selected'
)}>
```

---

## 🗄️ База данных

### Запросы

```javascript
// ❌ Плохо — N+1 запросов
const bookings = await db.collection('bookings').get();
for (const booking of bookings.docs) {
  const service = await db.collection('services').doc(booking.serviceId).get();
  // ...
}

// ✅ Хорошо — один запрос с join или batch
const bookings = await db.collection('bookings').get();
const serviceIds = [...new Set(bookings.docs.map(b => b.data().serviceId))];
const services = await Promise.all(
  serviceIds.map(id => db.collection('services').doc(id).get())
);
const servicesMap = new Map(services.map(s => [s.id, s.data()]));
```

### Транзакции

```javascript
// ✅ Использование транзакций для атомарных операций
async function createBooking(bookingData) {
  const ref = db.collection('bookings').doc();
  
  await db.runTransaction(async (transaction) => {
    // Проверить доступность слота
    const slotDoc = await transaction.get(
      db.collection('slots').doc(`${bookingData.date}_${bookingData.time}`)
    );
    
    if (!slotDoc.exists || !slotDoc.data().available) {
      throw new Error('Слот недоступен');
    }
    
    // Создать запись
    transaction.set(ref, bookingData);
    
    // Занять слот
    transaction.update(
      db.collection('slots').doc(`${bookingData.date}_${bookingData.time}`),
      { available: false }
    );
  });
  
  return ref.id;
}
```

---

## 🧪 Тестирование

### Структура теста

```javascript
describe('BookingService', () => {
  describe('createBooking', () => {
    it('should create booking with valid data', async () => {
      // Arrange
      const bookingData = { /* ... */ };
      
      // Act
      const result = await createBooking(bookingData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.booking.id).toBeDefined();
    });

    it('should reject booking with invalid phone', async () => {
      const bookingData = { phone: 'invalid' };
      
      await expect(createBooking(bookingData))
        .rejects
        .toThrow('Invalid phone number');
    });
  });
});
```

---

## 📝 Комментарии

### Когда писать комментарии

```javascript
// ❌ Плохо — комментарий объясняет что делает код
// Увеличиваем счётчик на 1
counter++;

// ✅ Хорошо — комментарий объясняет почему
// Увеличиваем счётчик на 1, так как API возвращает индекс с 0
counter++;

// ✅ Хорошо — комментарий для сложной логики
// Формула расчёта доступных слотов:
// available = total_slots - booked_slots - buffer_slots
// где buffer_slots = ceil(buffer_time / service_duration)
const availableSlots = calculateAvailableSlots(config);
```

### JSDoc

```javascript
/**
 * Генерирует доступные временные слоты на указанную дату
 * 
 * @param {Date} date - Дата для генерации слотов
 * @param {number} serviceDuration - Длительность услуги в минутах
 * @param {SlotConfig} config - Конфигурация генерации
 * @returns {Promise<Slot[]>} Массив доступных слотов
 * @throws {InvalidDateError} Если дата в прошлом
 * @throws {ServiceNotFoundError} Если услуга не найдена
 * 
 * @example
 * const slots = await generateSlots(new Date('2025-01-15'), 30, config);
 * // [{ time: '09:00', available: true }, ...]
 */
async function generateSlots(date, serviceDuration, config) {
  // ...
}
```

---

## 🔒 Безопасность

### Валидация данных

```javascript
// ❌ Плохо — доверие пользовательским данным
const { name, phone } = req.body;
await createBooking({ name, phone });

// ✅ Хорошо — валидация
const { name, phone } = req.body;

if (!isValidName(name)) {
  throw new ValidationError('Invalid name');
}

if (!isValidPhone(phone)) {
  throw new ValidationError('Invalid phone');
}

await createBooking({ name: sanitize(name), phone: normalizePhone(phone) });
```

### Секреты

```javascript
// ❌ Плохо — хардкод секретов
const API_KEY = 'sk-1234567890abcdef';

// ✅ Хорошо — переменные окружения
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY is not defined');
}
```

---

## 📦 Импорты/Экспорты

### Порядок импортов

```javascript
// 1. Встроенные модули
import { useState, useEffect } from 'react';

// 2. Внешние библиотеки
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

// 3. Внутренние модули
import { Button } from '@/components/Button';
import { formatDate } from '@/utils/format';
import { useBooking } from '@/hooks/useBooking';

// 4. Типы
import type { Booking } from '@/types/booking';
```

### Экспорты

```javascript
// ✅ Именованные экспорты
export function formatDate(date) { /* ... */ }
export function formatPrice(price) { /* ... */ }

// ✅ Default export для компонентов
export default function ServiceCard() { /* ... */ }

// ✅ Re-export
export { ServiceCard } from './ServiceCard';
export { TimeSlot } from './TimeSlot';
```

---

## 🚫 Анти-паттерны

### Избегать

```javascript
// ❌ Мутация пропсов
function Component({ items }) {
  items.push(newItem); // Плохо!
}

// ❌ Состояние в цикле
for (let i = 0; i < 10; i++) {
  const [value, setValue] = useState(i); // Ошибка!
}

// ❌ Отсутствие ключей
items.map(item => <Item item={item} />); // Плохо!

// ❌ Использование индекса как ключа
items.map((item, index) => <Item key={index} item={item} />); // Плохо!

// ❌ Прямое изменение состояния
state.items.push(item); // Плохо!
setState({ items: [...state.items, item] }); // Хорошо
```

---

## 📝 Чек-лист перед PR

- [ ] Код компилируется без ошибок
- [ ] Нет console.log в продакшен коде
- [ ] Нет неиспользуемых импортов
- [ ] Нет хардкоженных секретов
- [ ] Добавлены типы/JSDoc
- [ ] Добавлены комментарии для сложной логики
- [ ] Обработаны все ошибки
- [ ] Нет SQL injection / XSS уязвимостей
- [ ] Тесты проходят
- [ ] Линтер не выдаёт ошибок

---

## 📚 Ресурсы

- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
