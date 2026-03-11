import { useState, useCallback } from 'react';
import { createBooking } from '../utils/api';
import useBookingStore from '../context/bookingStore';

/**
 * Хук для создания бронирования
 */
export function useBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  const { getBookingData, setStatus } = useBookingStore();

  const book = useCallback(
    async (telegramId) => {
      const bookingData = getBookingData();

      if (!bookingData) {
        setError('Нет данных для бронирования');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        setStatus('loading');

        const result = await createBooking({
          ...bookingData,
          telegramId,
        });

        setBooking(result);
        setStatus('success');
        return result;
      } catch (err) {
        setError(err.message);
        setStatus('error', err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getBookingData, setStatus]
  );

  return { book, isLoading, error, booking };
}
