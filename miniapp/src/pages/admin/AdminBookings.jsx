import { useEffect, useState } from 'react';
import { getBookings, updateBookingStatus } from '../../utils/api';
import { formatDate, formatPrice } from '../../utils/formatting';

/**
 * Управление записями
 */
function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setIsLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const data = await getBookings(params);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(bookingId, newStatus) {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadBookings();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  }

  const statusFilters = [
    { value: 'all', label: 'Все' },
    { value: 'pending', label: 'Ожидают' },
    { value: 'confirmed', label: 'Подтверждены' },
    { value: 'completed', label: 'Завершены' },
    { value: 'cancelled', label: 'Отменены' }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-700'
  };

  const statusLabels = {
    pending: 'Ожидает',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена',
    no_show: 'Не явился'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-tg-button" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === f.value
                ? 'bg-tg-button text-tg-buttonText'
                : 'bg-tg-secondary text-tg-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <div className="text-center py-8 text-tg-hint">
          Нет записей
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-tg-secondary rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-tg-text">
                    {booking.clientName}
                  </div>
                  <div className="text-sm text-tg-hint">
                    📞 {booking.clientPhone}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[booking.status]}`}>
                  {statusLabels[booking.status]}
                </span>
              </div>
              
              <div className="text-sm space-y-1 mb-3">
                <div className="text-tg-text">
                  💇 {booking.serviceName}
                </div>
                <div className="text-tg-hint">
                  📅 {formatDate(booking.date)} • 🕐 {booking.startTime}
                </div>
                <div className="text-tg-hint">
                  💰 {formatPrice(booking.price)}
                </div>
              </div>
              
              {/* Actions */}
              {booking.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                    className="flex-1 py-1.5 bg-green-500 text-white rounded text-sm"
                  >
                    ✓ Подтвердить
                  </button>
                  <button
                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                    className="flex-1 py-1.5 bg-red-500 text-white rounded text-sm"
                  >
                    ✕ Отменить
                  </button>
                </div>
              )}
              
              {booking.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(booking.id, 'completed')}
                    className="flex-1 py-1.5 bg-blue-500 text-white rounded text-sm"
                  >
                    ✓ Завершить
                  </button>
                  <button
                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                    className="flex-1 py-1.5 bg-red-500 text-white rounded text-sm"
                  >
                    ✕ Отменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
