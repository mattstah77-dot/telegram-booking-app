import { useNavigate } from 'react-router-dom';
import useBookingStore from '../context/bookingStore';
import { useBooking } from '../hooks/useBooking';
import { useTelegram } from '../hooks/useTelegram';
import BookingForm from '../components/BookingForm';
import { formatDate, formatPrice, formatDuration } from '../utils/formatting';
import { haptic } from '../utils/telegram';

/**
 * Страница оформления записи
 */
function Booking() {
  const navigate = useNavigate();
  const { userId } = useTelegram();
  const { book, isLoading, error } = useBooking();
  const { selectedService, selectedDate, selectedTime, customerData } = useBookingStore();

  // Если не все выбрано, вернуться назад
  if (!selectedService || !selectedDate || !selectedTime) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (data) => {
    const result = await book(userId);
    
    if (result) {
      haptic.notification('success');
      navigate('/confirmation');
    }
  };

  const handleBack = () => {
    haptic.impact('light');
    navigate('/slots');
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
        <h1 className="text-xl font-bold text-tg-text">Ваши данные</h1>
      </div>

      {/* Booking summary */}
      <div className="mb-6 p-4 bg-tg-secondary rounded-xl space-y-2">
        <div className="flex justify-between">
          <span className="text-tg-hint">Услуга:</span>
          <span className="font-medium text-tg-text">{selectedService.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tg-hint">Дата:</span>
          <span className="font-medium text-tg-text">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tg-hint">Время:</span>
          <span className="font-medium text-tg-text">{selectedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tg-hint">Длительность:</span>
          <span className="font-medium text-tg-text">{formatDuration(selectedService.duration)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-tg-hint">К оплате:</span>
          <span className="font-bold text-lg text-tg-text">{formatPrice(selectedService.price)}</span>
        </div>
      </div>

      {/* Form */}
      <BookingForm
        initialData={customerData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-center">
          {error}
        </div>
      )}
    </div>
  );
}

export default Booking;
