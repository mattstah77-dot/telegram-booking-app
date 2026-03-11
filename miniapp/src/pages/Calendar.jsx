import { useNavigate } from 'react-router-dom';
import useBookingStore from '../context/bookingStore';
import Calendar from '../components/Calendar';
import { formatDate } from '../utils/formatting';
import { haptic } from '../utils/telegram';

/**
 * Страница выбора даты
 */
function CalendarPage() {
  const navigate = useNavigate();
  const { selectedService, selectedDate, setSelectedDate } = useBookingStore();

  // Если услуга не выбрана, вернуться назад
  if (!selectedService) {
    navigate('/');
    return null;
  }

  // Доступные даты (пример - все дни на ближайший месяц)
  // В реальном приложении загружать с сервера
  const availableDates = generateAvailableDates();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    haptic.notification('success');
    navigate('/slots');
  };

  const handleBack = () => {
    haptic.impact('light');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-tg-link mb-2 flex items-center"
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold text-tg-text">Выберите дату</h1>
        <p className="text-sm text-tg-hint mt-1">
          {selectedService.name} • {selectedService.duration} мин
        </p>
      </div>

      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        availableDates={availableDates}
        onDateSelect={handleDateSelect}
      />

      {/* Selected info */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-tg-secondary rounded-xl">
          <p className="text-sm text-tg-hint">Выбрано:</p>
          <p className="font-medium text-tg-text">{formatDate(selectedDate)}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Генерация списка доступных дат (пример)
 */
function generateAvailableDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Пропустить воскресенье (day = 0)
    if (date.getDay() !== 0) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }

  return dates;
}

export default CalendarPage;
