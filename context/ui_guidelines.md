# UI Guidelines

## 🎨 Дизайн-система

### Основные принципы

1. **Mobile-First** — дизайн для мобильных устройств
2. **Native Feel** — нативный для Telegram вид
3. **Minimalism** — минимум элементов, максимум ясности
4. **Speed** — быстрые взаимодействия
5. **Accessibility** — понятность для всех

---

## 📐 Сетка и отступы

### Базовая единица
```
Базовая единица: 4px
```

### Отступы
```css
spacing-xs:   4px   /* 1 unit */
spacing-sm:   8px   /* 2 units */
spacing-md:   16px  /* 4 units */
spacing-lg:   24px  /* 6 units */
spacing-xl:   32px  /* 8 units */
spacing-2xl:  48px  /* 12 units */
```

### Контейнеры
```css
/* Основной контейнер */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Карточки */
.card {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
}

/* Кнопки */
.button {
  padding: 14px 24px;
  min-height: 48px;
}
```

---

## 🎨 Цветовая палитра

### Основные цвета (Telegram Theme)

```css
/* Primary — основной акцент */
--tg-theme-button-color: #2481cc;
--tg-theme-button-text-color: #ffffff;
--tg-theme-link-color: #2481cc;

/* Background */
--tg-theme-bg-color: #ffffff;
--tg-theme-secondary-bg-color: #f0f0f0;

/* Text */
--tg-theme-text-color: #000000;
--tg-theme-hint-color: #999999;
--tg-theme-subtitle-text-color: #7d7d7d;

/* Status */
--color-success: #34c759;
--color-warning: #ff9500;
--color-error: #ff3b30;

/* UI */
--color-border: #e5e5e5;
--color-divider: #f0f0f0;
```

### Использование цветов

| Элемент | Цвет |
|---------|------|
| Основная кнопка | `--tg-theme-button-color` |
| Текст кнопки | `--tg-theme-button-text-color` |
| Фон страницы | `--tg-theme-bg-color` |
| Фон карточки | `--tg-theme-bg-color` |
| Текст заголовка | `--tg-theme-text-color` |
| Текст описания | `--tg-theme-subtitle-text-color` |
| Подсказки | `--tg-theme-hint-color` |

---

## 📝 Типографика

### Шрифты
```css
/* Использовать системные шрифты */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             Oxygen, Ubuntu, sans-serif;
```

### Размеры
```css
text-xs:   12px    /* Мелкие подписи */
text-sm:   14px    /* Основной текст */
text-base: 16px    /* Заголовки карточек */
text-lg:   18px    /* Заголовки экранов */
text-xl:   24px    /* Крупные заголовки */
```

### Веса
```css
font-normal:   400    /* Основной текст */
font-medium:   500    /* Подзаголовки */
font-semibold: 600    /* Заголовки */
font-bold:     700    /* Акценты */
```

### Стили заголовков
```css
/* Заголовок экрана */
.screen-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

/* Заголовок карточки */
.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

/* Описание */
.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--tg-theme-subtitle-text-color);
}
```

---

## 🔘 Компоненты

### Кнопки

#### Primary Button
```jsx
<button className="
  w-full
  py-3.5
  px-6
  bg-[var(--tg-theme-button-color)]
  text-[var(--tg-theme-button-text-color)]
  rounded-xl
  font-medium
  text-base
  transition-transform
  active:scale-[0.98]
">
  Записаться
</button>
```

#### Secondary Button
```jsx
<button className="
  w-full
  py-3.5
  px-6
  bg-[var(--tg-theme-secondary-bg-color)]
  text-[var(--tg-theme-text-color)]
  rounded-xl
  font-medium
  text-base
">
  Отмена
</button>
```

#### Button States
```css
/* Default */
background: var(--tg-theme-button-color);
opacity: 1;

/* Hover/Active */
transform: scale(0.98);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

---

### Карточки

#### Service Card
```jsx
<div className="
  bg-[var(--tg-theme-bg-color)]
  rounded-xl
  p-4
  border
  border-[var(--color-border)]
  active:bg-[var(--tg-theme-secondary-bg-color)]
  transition-colors
">
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h3 className="font-semibold text-base text-[var(--tg-theme-text-color)]">
        Мужская стрижка
      </h3>
      <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
        30 минут
      </p>
    </div>
    <div className="text-right">
      <span className="font-bold text-lg">
        500 ₽
      </span>
    </div>
  </div>
  <button className="w-full mt-3 py-2.5 bg-[var(--tg-theme-button-color)] text-white rounded-lg">
    Выбрать
  </button>
</div>
```

---

### Календарь

```jsx
<div className="calendar">
  {/* Header с месяцем */}
  <div className="flex justify-between items-center mb-4">
    <button>←</button>
    <span className="font-semibold">Январь 2025</span>
    <button>→</button>
  </div>

  {/* Дни недели */}
  <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--tg-theme-hint-color)] mb-2">
    <span>Вс</span>
    <span>Пн</span>
    <span>Вт</span>
    <span>Ср</span>
    <span>Чт</span>
    <span>Пт</span>
    <span>Сб</span>
  </div>

  {/* Даты */}
  <div className="grid grid-cols-7 gap-1">
    {days.map(day => (
      <button className={`
        aspect-square
        rounded-lg
        flex
        items-center
        justify-center
        text-sm
        ${day.isAvailable
          ? 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]'
          : 'text-[var(--tg-theme-hint-color)] opacity-50'
        }
        ${day.isSelected
          ? 'bg-[var(--tg-theme-button-color)] text-white'
          : ''
        }
      `}>
        {day.date}
      </button>
    ))}
  </div>
</div>
```

---

### Time Slots

```jsx
<div className="grid grid-cols-3 gap-2">
  {slots.map(slot => (
    <button className={`
      py-3
      rounded-lg
      text-center
      font-medium
      ${slot.available
        ? 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]'
        : 'bg-gray-100 text-gray-400 line-through'
      }
      ${slot.selected
        ? 'bg-[var(--tg-theme-button-color)] text-white'
        : ''
      }
    `}>
      {slot.time}
    </button>
  ))}
</div>
```

---

### Форма

```jsx
<form className="space-y-4">
  {/* Input */}
  <div>
    <label className="block text-sm font-medium mb-1.5 text-[var(--tg-theme-text-color)]">
      Ваше имя
    </label>
    <input
      type="text"
      className="
        w-full
        px-4
        py-3
        rounded-xl
        border
        border-[var(--color-border)]
        text-base
        focus:border-[var(--tg-theme-button-color)]
        focus:outline-none
      "
      placeholder="Иван"
    />
  </div>

  {/* Phone Input */}
  <div>
    <label className="block text-sm font-medium mb-1.5">
      Телефон
    </label>
    <input
      type="tel"
      className="..."
      placeholder="+7 (999) 123-45-67"
    />
  </div>
</form>
```

---

## 📱 Экраны

### Экран услуг

```
┌────────────────────────────┐
│  ← Выберите услугу         │
├────────────────────────────┤
│  ┌──────────────────────┐  │
│  │ Мужская стрижка  500₽│  │
│  │ 30 мин               │  │
│  │ [Выбрать]            │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ Стрижка бороды   300ₓ│  │
│  │ 20 мин               │  │
│  │ [Выбрать]            │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ Комплекс        700ₓ │  │
│  │ 50 мин               │  │
│  │ [Выбрать]            │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Экран календаря

```
┌────────────────────────────┐
│  ← Выберите дату           │
├────────────────────────────┤
│      ←  Январь 2025  →     │
│                            │
│  Вс Пн Вт Ср Чт Пт Сб      │
│                            │
│          1   2   3   4     │
│   5   6   7   8   9  10    │
│  11  12  13  14  15  16    │
│  17  18  19  20  21  22    │
│  23  24 [25] 26  27  28    │
│  29  30  31                │
│                            │
│  ● 25 января — 5 слотов    │
└────────────────────────────┘
```

### Экран времени

```
┌────────────────────────────┐
│  ← Выберите время          │
├────────────────────────────┤
│  25 января, суббота        │
│                            │
│  [09:00] [09:30] [10:00]   │
│  [10:30] [11:00] ------    │
│  [12:00] [12:30] [13:00]   │
│  [13:30] [14:00] [14:30]   │
│  ------ [16:00] [16:30]    │
│  [17:00] [17:30]           │
│                            │
│  Услуга: Мужская стрижка   │
│  Длительность: 30 мин      │
└────────────────────────────┘
```

### Экран формы

```
┌────────────────────────────┐
│  ← Ваши данные             │
├────────────────────────────┤
│                            │
│  Имя *                     │
│  ┌──────────────────────┐  │
│  │ Иван                 │  │
│  └──────────────────────┘  │
│                            │
│  Телефон *                 │
│  ┌──────────────────────┐  │
│  │ +7 (999) 123-45-67   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │    Подтвердить →     │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Экран подтверждения

```
┌────────────────────────────┐
│         ✓ Успешно!         │
│                            │
│     Ваша запись оформлена  │
│                            │
├────────────────────────────┤
│  Услуга:                   │
│  Мужская стрижка           │
│                            │
│  Дата:                     │
│  25 января, суббота        │
│                            │
│  Время:                    │
│  14:30                     │
│                            │
│  Адрес:                    │
│  ул. Ленина, 15            │
│                            │
│  ┌──────────────────────┐  │
│  │    Готово ✓          │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## ⚡ Анимации

### Переходы
```css
/* Стандартный переход */
transition: all 0.2s ease;

/* Быстрый отклик */
transition: transform 0.1s ease;

/* Плавное появление */
transition: opacity 0.3s ease;
```

### Микро-взаимодействия
```css
/* Нажатие кнопки */
.button:active {
  transform: scale(0.98);
}

/* Появление карточки */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: fadeIn 0.3s ease;
}
```

---

## 📱 Адаптивность

### Брейкпоинты
```css
/* Mobile (default): 0-374px */
/* Standard: 375px+ */
/* Large: 414px+ */
/* Tablet: 768px+ (редко используется) */
```

### Правила
- Всегда 100% ширина на мобильных
- Фиксированные отступы по краям (16px)
- Карточки занимают всю ширину
- Кнопки на всю ширину

---

## 🔔 Обратная связь

### Loading States
```jsx
{isLoading && (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[var(--tg-theme-button-color)]" />
  </div>
)}
```

### Error States
```jsx
{error && (
  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
    {error}
  </div>
)}
```

### Empty States
```jsx
{services.length === 0 && (
  <div className="text-center py-12 text-[var(--tg-theme-hint-color)]">
    Услуги не найдены
  </div>
)}
```

---

## 🎯 UX-паттерны

### Прогресс
- Показывать текущий шаг
- Давать понять, что дальше
- Минимизировать шаги

### Отмена
- Кнопка "Назад" всегда доступна
- Сохранять состояние при возврате
- Подтверждение отмены записи

### Успех
- Чёткое подтверждение успеха
- Итоговая информация
- Возможность вернуться на главную

---

## 📝 Чек-лист UI

### Перед релизом проверить:
- [ ] Все кнопки кликабельны
- [ ] Размеры touch-зон ≥ 44px
- [ ] Контраст текста ≥ 4.5:1
- [ ] Нет горизонтального скролла
- [ ] Все состояния отработаны
- [ ] Loading на всех запросах
- [ ] Обработка ошибок
- [ ] Пустые состояния
- [ ] Анимации не тормозят
- [ ] Работает на разных экранах

---

## 🚫 Анти-паттерны

### НЕ делать:
- ❌ Мелкие кнопки (< 44px)
- ❌ Длинные формы
- ❌ Скрытые действия
- ❌ Неочевидная навигация
- ❌ Перегруженные экраны
- ❌ Много текста
- ❌ Сложные меню
- ❌ Регистрация/авторизация
- ❌ Модальные окна поверх модальных
- ❌ Автозакрытие без сохранения
