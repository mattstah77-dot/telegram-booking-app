import { useEffect, useState } from 'react';
import { getSchedule, updateSchedule } from '../../utils/api';

/**
 * Управление расписанием
 */
function AdminSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const shortDayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      setIsLoading(true);
      const data = await getSchedule();
      // Сортируем по дням недели (начинаем с понедельника)
      const sorted = [1, 2, 3, 4, 5, 6, 0].map(weekday => 
        data.find(s => s.weekday === weekday) || {
          weekday,
          isWorking: weekday !== 0,
          startTime: '09:00',
          endTime: '18:00'
        }
      );
      setSchedule(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate(weekday, data) {
    try {
      await updateSchedule(weekday, data);
      setEditingDay(null);
      loadSchedule();
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
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
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg text-tg-text">
        Расписание работы
      </h2>

      {/* Schedule list */}
      <div className="space-y-2">
        {schedule.map((day) => (
          <div
            key={day.weekday}
            className="bg-tg-secondary rounded-xl p-4"
          >
            {editingDay === day.weekday ? (
              <EditForm
                day={day}
                dayName={dayNames[day.weekday]}
                onSave={handleUpdate}
                onCancel={() => setEditingDay(null)}
              />
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-tg-text">
                    {dayNames[day.weekday]}
                  </div>
                  {day.isWorking ? (
                    <div className="text-sm text-tg-hint">
                      {day.startTime} — {day.endTime}
                    </div>
                  ) : (
                    <div className="text-sm text-red-500">
                      Выходной
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingDay(day.weekday)}
                  className="text-sm text-tg-link"
                >
                  Изменить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        💡 Совет: Укажите перерывы в настройках бизнеса (обед и т.д.)
      </div>
    </div>
  );
}

/**
 * Форма редактирования дня
 */
function EditForm({ day, dayName, onSave, onCancel }) {
  const [isWorking, setIsWorking] = useState(day.isWorking);
  const [startTime, setStartTime] = useState(day.startTime);
  const [endTime, setEndTime] = useState(day.endTime);

  return (
    <div className="space-y-3">
      <div className="font-medium text-tg-text">{dayName}</div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`working-${day.weekday}`}
          checked={isWorking}
          onChange={(e) => setIsWorking(e.target.checked)}
        />
        <label htmlFor={`working-${day.weekday}`} className="text-sm">
          Рабочий день
        </label>
      </div>
      
      {isWorking && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-tg-hint mb-1">Начало</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-tg-hint mb-1">Конец</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border rounded-lg text-sm"
        >
          Отмена
        </button>
        <button
          onClick={() => onSave(day.weekday, { isWorking, startTime, endTime })}
          className="flex-1 py-2 bg-tg-button text-tg-buttonText rounded-lg text-sm"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}

export default AdminSchedule;
