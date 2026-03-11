import clsx from 'clsx';
import { haptic } from '../utils/telegram';

/**
 * Сетка временных слотов
 */
function TimeSlotPicker({ slots, selectedTime, onTimeSelect }) {
  // Группировка слотов по времени дня
  const groupedSlots = {
    morning: slots.filter((s) => parseInt(s.time.split(':')[0]) < 12),
    afternoon: slots.filter((s) => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: slots.filter((s) => parseInt(s.time.split(':')[0]) >= 17),
  };

  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    
    haptic.selection();
    onTimeSelect?.(slot.time);
  };

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-tg-hint">
        Нет доступных слотов на эту дату
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Утро */}
      {groupedSlots.morning.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-tg-hint mb-2">Утро</h3>
          <div className="grid grid-cols-3 gap-2">
            {groupedSlots.morning.map((slot) => (
              <SlotButton
                key={slot.time}
                slot={slot}
                isSelected={selectedTime === slot.time}
                onClick={() => handleSlotClick(slot)}
              />
            ))}
          </div>
        </div>
      )}

      {/* День */}
      {groupedSlots.afternoon.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-tg-hint mb-2">День</h3>
          <div className="grid grid-cols-3 gap-2">
            {groupedSlots.afternoon.map((slot) => (
              <SlotButton
                key={slot.time}
                slot={slot}
                isSelected={selectedTime === slot.time}
                onClick={() => handleSlotClick(slot)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Вечер */}
      {groupedSlots.evening.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-tg-hint mb-2">Вечер</h3>
          <div className="grid grid-cols-3 gap-2">
            {groupedSlots.evening.map((slot) => (
              <SlotButton
                key={slot.time}
                slot={slot}
                isSelected={selectedTime === slot.time}
                onClick={() => handleSlotClick(slot)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Кнопка слота
 */
function SlotButton({ slot, isSelected, onClick }) {
  return (
    <button
      disabled={!slot.available}
      onClick={onClick}
      className={clsx(
        'py-3 rounded-lg text-center font-medium transition-all touch-feedback',
        isSelected && 'bg-tg-button text-tg-buttonText',
        !isSelected && slot.available && 'bg-tg-secondary text-tg-text',
        !slot.available && 'bg-gray-100 text-gray-400 line-through cursor-not-allowed'
      )}
    >
      {slot.time}
    </button>
  );
}

export default TimeSlotPicker;
