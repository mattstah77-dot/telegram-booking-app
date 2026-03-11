# Admin Configuration System

## 📋 Описание системы

Система конфигурации позволяет владельцу бизнеса настроить приложение под свои нужды без программирования.

### Ключевые особенности

1. **Admin Panel внутри Mini App** — удобный доступ из Telegram
2. **Авторизация через Telegram** — безопасная аутентификация
3. **JWT токены** — сессии на 7 дней
4. **Полное управление** — услуги, расписание, записи

---

## 🎯 Возможности администратора

### Настройки бизнеса
- Название бизнеса
- Адрес
- Контактный телефон
- Часовой пояс
- Описание
- Настройки бронирования (буфер, горизонт, отмена)

### График работы
- Время работы на каждый день недели
- Выходные дни
- Праздничные дни
- Перерывы (обед)

### Управление услугами
- Добавление услуг
- Редактирование услуг
- Удаление услуг
- Порядок отображения
- Активация/деактивация

### Управление записями
- Просмотр всех записей
- Подтверждение записей
- Отмена записей
- Перенос записей
- Изменение статуса

---

## 🗄️ Модели данных

См. `database_schema.md` для полной схемы БД.

### Основные таблицы:
- `Business` — информация о бизнесе
- `Service` — услуги
- `Schedule` — расписание по дням недели
- `Break` — перерывы
- `Exception` — исключения (праздники)
- `Booking` — записи
- `AdminSession` — сессии администратора

### Service

```typescript
interface Service {
  id: string;
  businessId: string;
  
  // Основная информация
  name: string;                    // "Мужская стрижка"
  description: string;             // "Классическая стрижка с мытьём головы"
  
  // Параметры
  price: number;                   // 500
  duration: number;                // 30 (минут)
  
  // Статус
  isActive: boolean;               // true
  
  // Порядок отображения
  order: number;                   // 1
  
  // Категория (опционально)
  category?: string;               // "Стрижки"
  
  // Изображение (опционально)
  imageUrl?: string;
  
  // Метаданные
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎨 Интерфейсы администрирования

### Admin Panel в Mini App

```
/admin
├── /auth            → Авторизация через Telegram
├── /dashboard       → Статистика и обзор
├── /services        → Управление услугами
│   ├── Список услуг
│   ├── Добавить услугу
│   ├── Редактировать услугу
│   └── Удалить услугу
├── /schedule        → График работы
│   ├── Рабочие часы
│   ├── Перерывы
│   └── Исключения (праздники)
├── /bookings        → Управление записями
│   ├── Все записи
│   ├── Подтвердить/Отменить
│   └── Перенести запись
└── /settings        → Настройки бизнеса
    ├── Профиль
    ├── Контакты
    └── Параметры бронирования
```

---

## 💻 Реализация

### API Endpoints

```javascript
// Авторизация
POST /api/admin/auth
Body: { initData: string }
Response: { token: string, user: object }

// Dashboard
GET /api/admin/dashboard
Headers: Authorization: Bearer <token>
Response: {
  todayBookings: number,
  weekBookings: number,
  monthBookings: number,
  pendingBookings: number,
  totalRevenue: number
}

// Записи
GET /api/admin/bookings?dateFrom&dateTo&status
POST /api/bookings/:id/cancel
POST /api/bookings/:id/reschedule
PUT /api/bookings/:id/status

// Услуги
GET /api/services
POST /api/services
PUT /api/services/:id
DELETE /api/services/:id

// Расписание
GET /api/business/schedule
PUT /api/business/schedule/:weekday
GET /api/business/exceptions
POST /api/business/exceptions
DELETE /api/business/exceptions/:id
```

---

## 🤖 Telegram Bot Admin Interface

### Команды бота

```javascript
const { Telegraf, Markup } = require('telegraf');

class AdminBot {
  constructor(bot, adminService) {
    this.bot = bot;
    this.admin = adminService;
    this.setupHandlers();
  }

  setupHandlers() {
    // Команда /admin
    this.bot.command('admin', this.handleAdminCommand.bind(this));

    // Callback queries
    this.bot.action('admin_profile', this.handleProfile.bind(this));
    this.bot.action('admin_services', this.handleServices.bind(this));
    this.bot.action('admin_schedule', this.handleSchedule.bind(this));
    this.bot.action('admin_bookings', this.handleBookings.bind(this));
    this.bot.action(/service_edit_(.+)/, this.handleServiceEdit.bind(this));
    // ... другие обработчики
  }

  async handleAdminCommand(ctx) {
    const isAdmin = await this.checkAdmin(ctx.from.id);
    if (!isAdmin) {
      return ctx.reply('У вас нет доступа к админ-панели');
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Профиль бизнеса', 'admin_profile')],
      [Markup.button.callback('💇 Услуги', 'admin_services')],
      [Markup.button.callback('📅 График работы', 'admin_schedule')],
      [Markup.button.callback('📊 Сегодняшние записи', 'admin_bookings')],
      [Markup.button.callback('⚙️ Настройки', 'admin_settings')]
    ]);

    await ctx.reply('🎛️ Админ-панель', keyboard);
  }

  async handleProfile(ctx) {
    const config = await this.admin.getBusinessConfig();

    const text = `
📋 <b>Профиль бизнеса</b>

🏪 Название: ${config.name}
📍 Адрес: ${config.address || 'Не указан'}
📞 Телефон: ${config.phone || 'Не указан'}
🌍 Часовой пояс: ${config.timezone}
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✏️ Редактировать', 'profile_edit')],
      [Markup.button.callback('← Назад', 'admin_back')]
    ]);

    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
  }

  async handleServices(ctx) {
    const services = await this.admin.getServices();

    let text = '💇 <b>Услуги</b>\n\n';

    if (services.length === 0) {
      text += 'Услуги не добавлены';
    } else {
      services.forEach((service, index) => {
        const status = service.isActive ? '✅' : '❌';
        text += `${index + 1}. ${status} ${service.name} — ${service.price}₽ (${service.duration} мин)\n`;
      });
    }

    const buttons = [
      [Markup.button.callback('➕ Добавить услугу', 'service_add')],
      [Markup.button.callback('← Назад', 'admin_back')]
    ];

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });
  }

  async handleSchedule(ctx) {
    const config = await this.admin.getBusinessConfig();
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    let text = '📅 <b>График работы</b>\n\n';

    for (let i = 1; i <= 7; i++) {
      const dayIndex = i === 7 ? 0 : i; // Понедельник = 1, ..., Воскресенье = 0
      const schedule = config.workingHours[dayIndex];
      const status = schedule.isWorking ? '✅' : '❌';
      const hours = schedule.isWorking 
        ? `${schedule.start} - ${schedule.end}`
        : 'Выходной';

      text += `${status} ${days[dayIndex]}: ${hours}\n`;
    }

    const buttons = [
      [Markup.button.callback('✏️ Изменить график', 'schedule_edit')],
      [Markup.button.callback('🎄 Праздничные дни', 'holidays')],
      [Markup.button.callback('← Назад', 'admin_back')]
    ];

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });
  }
}

module.exports = AdminBot;
```

---

## 🌐 Mini App Admin Panel

### Страницы админ-панели

```jsx
// miniapp/src/pages/admin/Dashboard.jsx
function AdminDashboard() {
  const { data: stats } = useAdminStats();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Панель управления</h1>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <div className="text-sm text-gray-500">Сегодня записей</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.weekBookings}</div>
          <div className="text-sm text-gray-500">За неделю</div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="space-y-3">
        <Link to="/admin/services" className="block">
          <div className="bg-white rounded-xl p-4 border flex justify-between items-center">
            <span>💇 Услуги</span>
            <span>→</span>
          </div>
        </Link>

        <Link to="/admin/schedule" className="block">
          <div className="bg-white rounded-xl p-4 border flex justify-between items-center">
            <span>📅 График работы</span>
            <span>→</span>
          </div>
        </Link>

        <Link to="/admin/bookings" className="block">
          <div className="bg-white rounded-xl p-4 border flex justify-between items-center">
            <span>📋 Записи</span>
            <span>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

### Управление услугами

```jsx
// miniapp/src/pages/admin/Services.jsx
function AdminServices() {
  const { data: services, isLoading } = useServices();
  const [editingService, setEditingService] = useState(null);

  if (isLoading) return <Loading />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Услуги</h1>
        <button 
          onClick={() => setEditingService({})}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          + Добавить
        </button>
      </div>

      <div className="space-y-3">
        {services.map(service => (
          <ServiceItem 
            key={service.id}
            service={service}
            onEdit={() => setEditingService(service)}
          />
        ))}
      </div>

      {/* Модальное окно редактирования */}
      {editingService && (
        <ServiceEditModal 
          service={editingService}
          onClose={() => setEditingService(null)}
        />
      )}
    </div>
  );
}

function ServiceItem({ service, onEdit }) {
  return (
    <div className="bg-white rounded-xl p-4 border">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{service.name}</div>
          <div className="text-sm text-gray-500">
            {service.duration} мин • {service.price} ₽
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onEdit}
            className="text-blue-500"
          >
            ✏️
          </button>
          <button className="text-red-500">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 Авторизация

### Проверка прав администратора

```javascript
async function checkAdmin(telegramId) {
  const config = await getBusinessConfig();
  return config.adminTelegramId === telegramId.toString();
}

// Middleware для бота
function adminOnly(ctx, next) {
  const isAdmin = checkAdmin(ctx.from.id);
  
  if (!isAdmin) {
    return ctx.reply('⛔ У вас нет доступа к этой команде');
  }
  
  return next();
}

// Middleware для API
function adminAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  
  try {
    const user = validateTelegramWebApp(initData);
    const isAdmin = checkAdmin(user.id);
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

---

## 📝 Первый запуск (Onboarding)

### Wizard для начальной настройки

```jsx
function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({});

  const steps = [
    { title: 'Название бизнеса', component: BusinessNameStep },
    { title: 'Адрес и контакты', component: ContactsStep },
    { title: 'График работы', component: ScheduleStep },
    { title: 'Добавьте услуги', component: ServicesStep },
    { title: 'Готово!', component: CompleteStep }
  ];

  const CurrentStep = steps[step - 1].component;

  return (
    <div className="p-4">
      {/* Прогресс */}
      <div className="flex justify-between mb-6">
        {steps.map((s, i) => (
          <div 
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
              ${i + 1 <= step ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Текущий шаг */}
      <h2 className="text-lg font-bold mb-4">{steps[step - 1].title}</h2>
      <CurrentStep 
        config={config}
        onChange={setConfig}
        onNext={() => setStep(step + 1)}
        onBack={() => setStep(step - 1)}
      />
    </div>
  );
}
```

---

## 📊 Экспорт данных

### Экспорт записей

```javascript
async function exportBookings(startDate, endDate, format = 'csv') {
  const bookings = await adminService.getBookingsRange(startDate, endDate);

  if (format === 'csv') {
    const csv = [
      'ID,Дата,Время,Клиент,Телефон,Услуга,Цена,Статус',
      ...bookings.map(b => 
        `${b.id},${b.date},${b.time},${b.customerName},${b.customerPhone},${b.serviceName},${b.servicePrice},${b.status}`
      )
    ].join('\n');

    return csv;
  }

  if (format === 'json') {
    return JSON.stringify(bookings, null, 2);
  }
}
```

---

## 📝 Примечания для AI агента

1. **Проверять права** администратора на каждом запросе
2. **Валидировать все данные** перед сохранением
3. **Предотвращать удаление** услуг с активными записями
4. **Предоставлять откат** для критических изменений
5. **Логировать все действия** администратора
6. **Использовать транзакции** для множественных изменений
