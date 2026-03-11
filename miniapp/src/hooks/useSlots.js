import { useState, useEffect, useCallback } from 'react';
import { getSlots } from '../utils/api';

/**
 * Хук для загрузки доступных слотов
 */
export function useSlots(date, serviceId) {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSlots = useCallback(async () => {
    if (!date || !serviceId) {
      setSlots([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getSlots(date, serviceId);
      setSlots(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, serviceId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, isLoading, error, refetch: fetchSlots };
}
