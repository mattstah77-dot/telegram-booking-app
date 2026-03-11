import { useNavigate } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import useBookingStore from '../context/bookingStore';
import ServiceCard from '../components/ServiceCard';
import { showAlert } from '../utils/telegram';

/**
 * Страница выбора услуги
 */
function Services() {
  const navigate = useNavigate();
  const { services, isLoading, error } = useServices();
  const { selectedService, setSelectedService } = useBookingStore();

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    navigate('/calendar');
  };

  if (error) {
    showAlert('Ошибка загрузки услуг. Попробуйте позже.');
  }

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-tg-text">Выберите услугу</h1>
        <p className="text-sm text-tg-hint mt-1">Доступно {services.length} услуг</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-tg-button" />
        </div>
      )}

      {/* Services list */}
      {!isLoading && services.length > 0 && (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedService?.id === service.id}
              onSelect={handleServiceSelect}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && services.length === 0 && (
        <div className="text-center py-12 text-tg-hint">
          Услуги не найдены
        </div>
      )}
    </div>
  );
}

export default Services;
