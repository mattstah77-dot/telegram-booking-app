import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminAuth, getBusiness } from '../../utils/api';
import { getUser } from '../../utils/telegram';

/**
 * Layout для админ-панели
 */
function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Проверяем, есть ли токен
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        // Пробуем авторизоваться через Telegram
        const user = getUser();
        if (!user) {
          navigate('/');
          return;
        }

        const initData = window.Telegram?.WebApp?.initData;
        if (!initData) {
          navigate('/');
          return;
        }

        const result = await adminAuth(initData);
        localStorage.setItem('adminToken', result.token);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(true);
      }

      // Загружаем данные бизнеса
      const businessData = await getBusiness();
      setBusiness(businessData);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-tg-button" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const navItems = [
    { to: '/admin', label: '📊 Дашборд', end: true },
    { to: '/admin/services', label: '💇 Услуги' },
    { to: '/admin/bookings', label: '📅 Записи' },
    { to: '/admin/schedule', label: '⏰ Расписание' },
  ];

  return (
    <div className="min-h-screen bg-tg-bg">
      {/* Header */}
      <header className="bg-tg-secondary border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-tg-text">
              {business?.name || 'Админ-панель'}
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/');
            }}
            className="text-sm text-tg-hint"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-tg-secondary border-b border-gray-200 overflow-x-auto">
        <div className="flex px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-tg-button text-tg-button'
                    : 'border-transparent text-tg-hint hover:text-tg-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-4">
        <Outlet context={{ business }} />
      </main>
    </div>
  );
}

export default AdminLayout;
