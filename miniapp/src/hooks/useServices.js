import { useState, useEffect } from 'react';
import { getServices } from '../utils/api';

/**
 * Хук для загрузки списка услуг
 */
export function useServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        setIsLoading(true);
        const data = await getServices();
        if (isMounted) {
          setServices(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, []);

  return { services, isLoading, error };
}
