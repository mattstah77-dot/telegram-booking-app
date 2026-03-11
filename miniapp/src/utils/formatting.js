import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматировать дату для отображения
 */
export function formatDate(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(dateObj)) {
    return 'Сегодня';
  }

  if (isTomorrow(dateObj)) {
    return 'Завтра';
  }

  return format(dateObj, 'd MMMM, EEEE', { locale: ru });
}

/**
 * Форматировать дату кратко
 */
export function formatDateShort(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'd MMM', { locale: ru });
}

/**
 * Форматировать время
 */
export function formatTime(time) {
  return time;
}

/**
 * Форматировать цену
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматировать длительность
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${mins} мин`;
}

/**
 * Форматировать телефон
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }

  return phone;
}

/**
 * Валидация телефона
 */
export function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Валидация имени
 */
export function isValidName(name) {
  return name.trim().length >= 2 && name.trim().length <= 50;
}

/**
 * Получить день недели
 */
export function getDayName(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE', { locale: ru });
}

/**
 * Получить относительное время
 */
export function getRelativeTime(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru });
}
