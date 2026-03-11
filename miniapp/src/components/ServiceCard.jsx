import clsx from 'clsx';
import { formatPrice, formatDuration } from '../utils/formatting';
import { haptic } from '../utils/telegram';

/**
 * Карточка услуги
 */
function ServiceCard({ service, isSelected, onSelect }) {
  const handleClick = () => {
    haptic.selection();
    onSelect?.(service);
  };

  return (
    <div
      className={clsx(
        'bg-tg-bg rounded-xl p-4 border transition-all touch-feedback',
        isSelected ? 'border-tg-button border-2' : 'border-gray-200'
      )}
      onClick={handleClick}
    >
      {/* Верхняя часть */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base text-tg-text">{service.name}</h3>
          {service.description && (
            <p className="text-sm text-tg-hint mt-1 line-clamp-2">{service.description}</p>
          )}
        </div>
        <div className="text-right ml-4">
          <span className="font-bold text-lg text-tg-text">{formatPrice(service.price)}</span>
        </div>
      </div>

      {/* Длительность */}
      <div className="flex items-center text-sm text-tg-hint mb-3">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {formatDuration(service.duration)}
      </div>

      {/* Кнопка */}
      <button
        className={clsx(
          'w-full py-2.5 rounded-lg font-medium transition-colors',
          isSelected
            ? 'bg-tg-button text-tg-buttonText'
            : 'bg-tg-secondary text-tg-text'
        )}
      >
        {isSelected ? 'Выбрано ✓' : 'Выбрать'}
      </button>
    </div>
  );
}

export default ServiceCard;
