import { useNavigate } from 'react-router-dom';
import useBookingStore from '../context/bookingStore';
import { useSlots } from '../hooks/useSlots';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { formatDate } from '../utils/formatting';
import { haptic } from '../utils/telegram';

/**
 * Страница выбора времени
 */
function TimeSlots() {
  const navigate = useNavigate();
  const { selectedService, selectedDate, selectedTime, setSelectedTime } = useBookingStore();

  // Загрузка слотов
  const { slots, isLoading, error } = useSlots(selectedDate, selectedService?.id);

  // Если услуга или дата не выбраны, вернуться назад
  if (!selectedService || !selectedDate) {
    navigate('/');
    return null;
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    navigate('/booking');
  };

  const handleBack = () => {
    haptic.impact('light');
    navigate('/calendar');
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
        <h1 className="text-xl font-bold text-tg-text">Выберите время</h1>
        <p className="text-sm text-tg-hint mt-1">
          {formatDate(selectedDate)}
        </p>
      </div>

      {/* Service info */}
      <div className="mb-6 p-4 bg-tg-secondary rounded-xl">
        <div className="font-medium text-tg-text">{selectedService.name}</div>
        <div className="text-sm text-tg-hint">
          {selectedService.duration} мин • {selectedService.price} ₽
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-tg-button" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-500">
          Ошибка загрузки слотов
        </div>
      )}

      {/* Time slots */}
      {!isLoading && !error && (
        <TimeSlotPicker
          slots={slots}
          selectedTime={selectedTime}
          onTimeSelect={handleTimeSelect}
        />
      )}
    </div>
  );
}

export default TimeSlots;
