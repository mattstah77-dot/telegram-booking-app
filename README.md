# Telegram Mini App Booking System

Система бронирования услуг малого бизнеса на базе Telegram Mini App с PostgreSQL.

## 🎯 О проекте

Это **НЕ SaaS**. Каждая копия приложения = отдельный бизнес с:
- Отдельным деплоем
- Отдельной базой данных PostgreSQL
- Отдельным Telegram ботом
- Индивидуальной конфигурацией

### Целевые бизнесы
- Барбершопы
- Салоны красоты
- Массажные салоны
- Автомойки
- Студии маникюра
- Косметологические кабинеты

## 📦 Структура проекта

```
booking-app/
├── bot/                     # Telegram Bot (Node.js + Telegraf)
│   ├── commands/            # Команды бота
│   ├── handlers/            # Обработчики
│   └── middleware/          # Промежуточное ПО
│
├── miniapp/                 # Telegram Mini App (React SPA)
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы
│   │   ├── hooks/           # Кастомные хуки
│   │   ├── utils/           # Утилиты
│   │   └── context/         # Zustand store
│   └── public/              # Статические файлы
│
├── backend/                 # Backend API (Express + PostgreSQL)
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   └── middleware/      # Middleware
│   ├── services/
│   │   ├── booking-engine/  # Движок бронирования
│   │   ├── slot-engine/     # Генерация слотов
│   │   └── notifications/   # Уведомления
│   ├── prisma/
│   │   ├── schema.prisma    # Схема БД
│   │   └── seed.js          # Начальные данные
│   └── utils/               # Утилиты
│
├── config/                  # Конфигурация бизнеса
├── docs/                    # Документация
└── context/                 # Контекст для AI агента
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Установка зависимостей для всех пакетов
npm run setup
```

### 2. Настройка окружения

```bash
# Скопировать пример конфигурации
cp .env.example .env

# Заполнить переменные окружения
nano .env
```

### 3. Настройка базы данных

```bash
# Создать базу данных PostgreSQL
createdb booking_db

# Применить миграции
cd backend
npx prisma migrate dev

# Заполнить начальными данными
npx prisma db seed
```

### 4. Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Сохраните токен в `.env`

### 5. Запуск в разработке

```bash
# Запуск Mini App
npm run dev:miniapp

# Запуск backend API
npm run dev:backend

# Запуск бота
npm run dev:bot
```

### 6. Деплой

```bash
# Сборка
npm run build

# Деплой через Docker
docker-compose up -d
```

## 📱 Основной сценарий использования

```
1. Пользователь открывает Telegram бота
   ↓
2. Бот отправляет кнопку "Записаться"
   ↓
3. Открывается Mini App
   ↓
4. Пользователь выбирает услугу
   ↓
5. Выбирает дату и время
   ↓
6. Вводит имя и телефон
   ↓
7. Подтверждает запись
   ↓
8. Получает уведомление
```

## 🛠️ Технологии

### Frontend (Mini App)
- React 18
- TailwindCSS
- Vite
- Telegram Mini App SDK
- Zustand

### Backend API
- Node.js 18+
- Express
- PostgreSQL
- Prisma ORM
- node-cron

### Bot
- Node.js
- Telegraf

### Database
- PostgreSQL 16
- Prisma ORM

### Deployment
- Mini App: Vercel / Cloudflare Pages
- Backend: VPS / Docker / Railway / Render
- Database: Supabase / Railway / Neon

## 📋 Команды

| Команда | Описание |
|---------|----------|
| `npm run setup` | Установка всех зависимостей |
| `npm run dev:miniapp` | Запуск Mini App в режиме разработки |
| `npm run dev:backend` | Запуск backend API в режиме разработки |
| `npm run dev:bot` | Запуск бота в режиме разработки |
| `npm run build` | Сборка всех пакетов |
| `npm run test` | Запуск тестов |
| `npm run lint` | Проверка линтером |
| `npm run db:migrate` | Применить миграции БД |
| `npm run db:seed` | Заполнить БД начальными данными |
| `npm run db:studio` | Открыть Prisma Studio |

## 🔧 Конфигурация

### Переменные окружения

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/booking_db"

# Server
PORT=3001
NODE_ENV=development

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBAPP_URL=http://localhost:3000

# Business
BUSINESS_ID=your_business_id
ADMIN_TELEGRAM_ID=your_telegram_id

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Slot Engine
SLOT_CACHE_DAYS=14
SLOT_CACHE_TTL_HOURS=24
```

### Настройка бизнеса

Отредактируйте файлы в папке `config/`:
- `business.json` — Название, адрес, контакты
- `services.json` — Список услуг
- `schedule.json` — График работы

## 📚 Документация

- [Обзор проекта](./context/project_overview.md)
- [Архитектура](./context/architecture.md)
- [Схема БД](./context/database_schema.md)
- [UI Guidelines](./context/ui_guidelines.md)
- [Логика бронирования](./context/booking_logic.md)
- [Генерация слотов](./context/slot_generation.md)
- [Админ-система](./context/admin_system.md)
- [Интеграция с Telegram](./context/telegram_integration.md)
- [Стандарты кода](./context/coding_standards.md)

## 🤖 Работа с AI агентом

Этот проект оптимизирован для разработки с AI агентом (Claude, ChatGPT, etc).

### Контекстные файлы

Все файлы в папке `context/` содержат необходимую информацию для AI:
- Архитектура системы
- UI требования
- Бизнес-логика
- Стандарты кода

### Рекомендации

1. Перед началом работы прочитайте `context/project_overview.md`
2. Следуйте стандартам из `context/coding_standards.md`
3. Используйте UI принципы из `context/ui_guidelines.md`
4. Проверяйте логику через соответствующие файлы

## 📄 Лицензия

MIT

## 👥 Авторы

NLP-Core-Team
