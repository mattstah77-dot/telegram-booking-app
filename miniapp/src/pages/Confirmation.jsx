import { useNavigate } from 'react-router-dom';
import useBookingStore from '../context/bookingStore';
import { formatDate, formatPrice, formatDuration } from '../utils/formatting';
import { closeApp, haptic } from '../utils/telegram';

/**
 * Страница подтверждения записи
 */
function Confirmation() {
  const navigate = useNavigate();
  const { selectedService, selectedDate, selectedTime } = useBookingStore();

  // Если записи нет, вернуться на главную
  if (!selectedService || !selectedDate || !selectedTime) {
    navigate('/');
    return null;
  }

  const handleDone = () => {
    haptic.impact('medium');
    closeApp();
  };

  const handleNewBooking = () => {
    haptic.impact('light');
    useBookingStore.getState().reset();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4 flex flex-col">
      {/* Success icon */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-tg-text mb-2">Успешно!</h1>
        <p className="text-tg-hint text-center mb-8">
          Ваша запись оформлена. Мы ждём вас!
        </p>

        {/* Booking details */}
        <div className="w-full max-w-sm bg-tg-secondary rounded-xl p-4 space-y-3">
          <div className="text-center pb-3 border-b border-gray-200">
            <div className="font-semibold text-lg text-tg-text">
              {selectedService.name}
            </div>
            <div className="text-tg-hint">
              {formatDuration(selectedService.duration)} • {formatPrice(selectedService.price)}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-tg-hint">📅 Дата</span>
            <span className="font-medium text-tg-text">{formatDate(selectedDate)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-tg-hint">🕐 Время</span>
            <span className="font-medium text-tg-text">{selectedTime}</span>
          </div>

          <div className="pt-3 border-t border-gray-200 text-center text-sm text-tg-hint">
            Напоминание придёт за 1 час до визита
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-8">
        <button
          onClick={handleDone}
          className="w-full py-3.5 rounded-xl font-medium text-base bg-tg-button text-tg-buttonText touch-feedback"
        >
          Готово
        </button>

        <button
          onClick={handleNewBooking}
          className="w-full py-3.5 rounded-xl font-medium text-base bg-tg-secondary text-tg-text touch-feedback"
        >
          Новая запись
        </button>
      </div>
    </div>
  );
}

export default Confirmation;
