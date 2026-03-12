import { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '../../utils/api';
import { formatPrice, formatDuration } from '../../utils/formatting';

/**
 * Управление услугами
 */
function AdminServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setIsLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(data) {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setShowForm(false);
      setEditingService(null);
      loadServices();
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить услугу?')) return;
    
    try {
      await deleteService(id);
      loadServices();
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg text-tg-text">
          Услуги ({services.length})
        </h2>
        <button
          onClick={() => {
            setEditingService(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-tg-button text-tg-buttonText rounded-lg text-sm font-medium"
        >
          + Добавить
        </button>
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="text-center py-8 text-tg-hint">
          Нет услуг
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-tg-secondary rounded-xl p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-tg-text">{service.name}</span>
                    {!service.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Неактивна
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-tg-hint mt-1">
                    {formatDuration(service.durationMinutes)} • {formatPrice(service.price)}
                  </div>
                  {service.description && (
                    <div className="text-sm text-tg-hint mt-1">
                      {service.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowForm(true);
                    }}
                    className="text-sm text-tg-link"
                  >
                    Изм.
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-sm text-red-500"
                  >
                    Удал.
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Форма услуги
 */
function ServiceForm({ service, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price ? service.price / 100 : '',
    durationMinutes: service?.durationMinutes || 30,
    isActive: service?.isActive ?? true
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    
    await onSave({
      ...formData,
      price: Math.round(parseFloat(formData.price) * 100)
    });
    
    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-tg-bg rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-4">
          {service ? 'Редактировать услугу' : 'Новая услуга'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Цена (₽) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Время (мин) *</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
                min="5"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm">Активна</label>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 bg-tg-button text-tg-buttonText rounded-lg"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminServices;
