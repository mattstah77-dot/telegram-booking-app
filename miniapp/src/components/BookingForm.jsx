import { useState } from 'react';
import clsx from 'clsx';
import { formatPhone, isValidPhone, isValidName } from '../utils/formatting';
import { haptic } from '../utils/telegram';

/**
 * Форма записи
 */
function BookingForm({ initialData, onSubmit, isLoading }) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [errors, setErrors] = useState({});

  // Валидация
  const validate = () => {
    const newErrors = {};

    if (!isValidName(name)) {
      newErrors.name = 'Имя должно содержать от 2 до 50 символов';
    }

    if (!isValidPhone(phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      haptic.notification('error');
      return;
    }

    haptic.impact('medium');
    onSubmit?.({ name: name.trim(), phone: formatPhone(phone) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Имя */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-tg-text">
          Ваше имя *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван"
          className={clsx(
            'w-full px-4 py-3 rounded-xl border text-base transition-colors',
            errors.name
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 focus:border-tg-button',
            'focus:outline-none'
          )}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Телефон */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-tg-text">
          Телефон *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (999) 123-45-67"
          className={clsx(
            'w-full px-4 py-3 rounded-xl border text-base transition-colors',
            errors.phone
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 focus:border-tg-button',
            'focus:outline-none'
          )}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={isLoading}
        className={clsx(
          'w-full py-3.5 rounded-xl font-medium text-base transition-all touch-feedback',
          'bg-tg-button text-tg-buttonText',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Отправка...
          </span>
        ) : (
          'Подтвердить запись'
        )}
      </button>
    </form>
  );
}

export default BookingForm;
