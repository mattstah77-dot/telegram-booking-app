const API_BASE = import.meta.env.VITE_API_URL || 'https://booking-app-backend-jeme.onrender.com';
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'demo-business';

/**
 * API клиент для взаимодействия с backend
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * GET запрос
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST запрос
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT запрос
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE запрос
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Базовый запрос
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Business-Id': BUSINESS_ID,
      ...options.headers,
    };

    // Добавляем Telegram init data для авторизации
    if (window.Telegram?.WebApp?.initData) {
      headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    }

    // Добавляем JWT токен если есть
    const token = localStorage.getItem('adminToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || error.error || `HTTP ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Network error', 0);
    }
  }
}

/**
 * Класс ошибки API
 */
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const api = new ApiClient(API_BASE);

// ========== API методы ==========

/**
 * Получить информацию о бизнесе
 */
export async function getBusiness() {
  return api.get('/business');
}

/**
 * Получить список услуг
 */
export async function getServices() {
  return api.get('/services');
}

/**
 * Получить услугу по ID
 */
export async function getService(id) {
  return api.get(`/services/${id}`);
}

/**
 * Создать услугу (Admin)
 */
export async function createService(data) {
  return api.post('/services', data);
}

/**
 * Обновить услугу (Admin)
 */
export async function updateService(id, data) {
  return api.put(`/services/${id}`, data);
}

/**
 * Удалить услугу (Admin)
 */
export async function deleteService(id) {
  return api.delete(`/services/${id}`);
}

/**
 * Получить доступные слоты на дату
 */
export async function getSlots(date, serviceId) {
  return api.get(`/slots/${date}?serviceId=${serviceId}`);
}

/**
 * Создать запись
 */
export async function createBooking(bookingData) {
  return api.post('/bookings', bookingData);
}

/**
 * Получить запись по ID
 */
export async function getBooking(bookingId) {
  return api.get(`/bookings/${bookingId}`);
}

/**
 * Отменить запись
 */
export async function cancelBooking(bookingId, reason) {
  return api.post(`/bookings/${bookingId}/cancel`, { reason });
}

/**
 * Получить список записей (Admin)
 */
export async function getBookings(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/bookings?${query}`);
}

/**
 * Изменить статус записи (Admin)
 */
export async function updateBookingStatus(bookingId, status) {
  return api.put(`/bookings/${bookingId}/status`, { status });
}

/**
 * Авторизация админа
 */
export async function adminAuth(initData) {
  return api.post('/admin/auth', { initData });
}

/**
 * Получить статистику дашборда (Admin)
 */
export async function getAdminDashboard() {
  return api.get('/admin/dashboard');
}

/**
 * Получить расписание
 */
export async function getSchedule() {
  return api.get('/business/schedule');
}

/**
 * Обновить расписание на день (Admin)
 */
export async function updateSchedule(weekday, data) {
  return api.put(`/business/schedule/${weekday}`, data);
}

export { ApiError, api };
