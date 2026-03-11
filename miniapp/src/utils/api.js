const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
   * Базовый запрос
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Добавляем Telegram init data для авторизации
    if (window.Telegram?.WebApp?.initData) {
      headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || `HTTP ${response.status}`, response.status);
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
export async function cancelBooking(bookingId) {
  return api.post(`/bookings/${bookingId}/cancel`);
}

export { ApiError };
