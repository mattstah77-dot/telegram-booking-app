import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { haptic } from '../utils/telegram';

/**
 * Календарь для выбора даты
 */
function Calendar({ selectedDate, availableDates = [], onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Генерация дней месяца
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start, end });

    // Добавляем пустые ячейки в начале (для выравнивания по дням недели)
    const startDay = start.getDay();
    const emptyDays = Array(startDay).fill(null);

    return [...emptyDays, ...monthDays];
  }, [currentMonth]);

  // Дни недели
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Проверка доступности даты
  const isDateAvailable = (date) => {
    if (!date) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
  };

  // Проверка, можно ли выбрать дату
  const isDateSelectable = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isBefore(date, today) && isDateAvailable(date);
  };

  // Обработка выбора даты
  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return;
    
    haptic.selection();
    onDateSelect?.(format(date, 'yyyy-MM-dd'));
  };

  // Навигация по месяцам
  const goToPrevMonth = () => {
    haptic.impact('light');
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    haptic.impact('light');
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="bg-tg-bg rounded-xl p-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg bg-tg-secondary hover:bg-gray-200 transition-colors"
        >
          ←
        </button>
        <span className="font-semibold text-base">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg bg-tg-secondary hover:bg-gray-200 transition-colors"
        >
          →
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-tg-hint py-2 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Даты */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
          const isAvailable = isDateAvailable(date);
          const isPast = isBefore(date, new Date()) && !isToday(date);
          const isSelectable = isDateSelectable(date);

          return (
            <button
              key={date.toISOString()}
              disabled={!isSelectable}
              onClick={() => handleDateClick(date)}
              className={clsx(
                'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                isSelected && 'bg-tg-button text-tg-buttonText',
                !isSelected && isSelectable && 'bg-tg-secondary text-tg-text hover:bg-gray-200',
                !isSelectable && 'text-tg-hint opacity-50',
                isToday(date) && !isSelected && 'border border-tg-button'
              )}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-tg-hint">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-tg-button" />
          <span>Выбрано</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-tg-secondary" />
          <span>Доступно</span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
