import { useState, useEffect } from 'react';
import { getUser, getPlatform, isTelegram } from '../utils/telegram';

/**
 * Хук для работы с Telegram Mini App
 */
export function useTelegram() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Получаем данные пользователя
    const userData = getUser();
    setUser(userData);

    // Получаем platform
    setPlatform(getPlatform());

    // Приложение готово
    setIsReady(true);
  }, []);

  return {
    user,
    isReady,
    platform,
    isTelegram: isTelegram(),
    userId: user?.id,
    firstName: user?.first_name,
    lastName: user?.last_name,
    username: user?.username,
  };
}
