import { useEffect, useState } from 'react';
import { getAdminDashboard, getBookings } from '../../utils/api';
import { formatDate, formatPrice } from '../../utils/formatting';

/**
 * Админ дашборд
 */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [dashboardData, bookingsData] = await Promise.all([
        getAdminDashboard(),
        getBookings({ limit: 10 })
      ]);
      
      setStats(dashboardData);
      setTodayBookings(bookingsData.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

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
        Ошибка загрузки: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tg-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-tg-text">
            {stats?.todayBookings || 0}
          </div>
          <div className="text-sm text-tg-hint">Сегодня</div>
        </div>
        <div className="bg-tg-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-tg-text">
            {stats?.weekBookings || 0}
          </div>
          <div className="text-sm text-tg-hint">За неделю</div>
        </div>
        <div className="bg-tg-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-tg-text">
            {stats?.monthBookings || 0}
          </div>
          <div className="text-sm text-tg-hint">За месяц</div>
        </div>
        <div className="bg-tg-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-tg-text">
            {formatPrice(stats?.totalRevenue || 0)}
          </div>
          <div className="text-sm text-tg-hint">Выручка</div>
        </div>
      </div>

      {/* Pending bookings alert */}
      {stats?.pendingBookings > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <div className="font-medium text-yellow-800">
                {stats.pendingBookings} записей ожидают подтверждения
              </div>
              <div className="text-sm text-yellow-600">
                Проверьте раздел "Записи"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div>
        <h2 className="font-semibold text-lg text-tg-text mb-3">
          Ближайшие записи
        </h2>
        {todayBookings.length === 0 ? (
          <div className="text-center py-8 text-tg-hint">
            Нет записей
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-tg-secondary rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-tg-text">
                    {booking.clientName}
                  </div>
                  <div className="text-sm text-tg-hint">
                    {booking.service?.name} • {formatDate(booking.date)} • {booking.startTime}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {booking.status === 'confirmed' ? 'Подтв.' :
                   booking.status === 'pending' ? 'Ожидает' :
                   booking.status === 'cancelled' ? 'Отменена' : booking.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
