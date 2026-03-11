import WebApp from '@twa-dev/sdk';

export const tg = WebApp;

/**
 * Инициализация Telegram Mini App
 */
export function initTelegram() {
  // Раскрыть на весь экран
  tg.expand();

  // Применить тему
  applyTheme();

  // Слушатель изменения темы
  tg.onEvent('themeChanged', applyTheme);
}

/**
 * Применить тему Telegram
 */
function applyTheme() {
  const root = document.documentElement;
  const params = tg.themeParams;

  if (params.bg_color) {
    root.style.setProperty('--tg-theme-bg-color', params.bg_color);
  }
  if (params.text_color) {
    root.style.setProperty('--tg-theme-text-color', params.text_color);
  }
  if (params.hint_color) {
    root.style.setProperty('--tg-theme-hint-color', params.hint_color);
  }
  if (params.link_color) {
    root.style.setProperty('--tg-theme-link-color', params.link_color);
  }
  if (params.button_color) {
    root.style.setProperty('--tg-theme-button-color', params.button_color);
  }
  if (params.button_text_color) {
    root.style.setProperty('--tg-theme-button-text-color', params.button_text_color);
  }
  if (params.secondary_bg_color) {
    root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color);
  }
}

/**
 * Получить данные пользователя
 */
export function getUser() {
  return tg.initDataUnsafe?.user || null;
}

/**
 * Получить ID пользователя
 */
export function getUserId() {
  return tg.initDataUnsafe?.user?.id || null;
}

/**
 * Закрыть Mini App
 */
export function closeApp() {
  tg.close();
}

/**
 * Показать popup
 */
export function showPopup(title, message, buttons = [{ type: 'ok' }]) {
  return new Promise((resolve) => {
    tg.showPopup(
      {
        title,
        message,
        buttons,
      },
      resolve
    );
  });
}

/**
 * Показать alert
 */
export function showAlert(message) {
  return new Promise((resolve) => {
    tg.showAlert(message, resolve);
  });
}

/**
 * Показать confirm
 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    tg.showConfirm(message, resolve);
  });
}

/**
 * Haptic feedback
 */
export const haptic = {
  impact(style = 'medium') {
    tg.HapticFeedback?.impactOccurred(style);
  },
  notification(type = 'success') {
    tg.HapticFeedback?.notificationOccurred(type);
  },
  selection() {
    tg.HapticFeedback?.selectionChanged();
  },
};

/**
 * Открыть ссылку
 */
export function openLink(url) {
  tg.openLink(url);
}

/**
 * Открыть ссылку в Telegram
 */
export function openTelegramLink(url) {
  tg.openTelegramLink(url);
}

/**
 * Отправить данные в бот
 */
export function sendData(data) {
  tg.sendData(JSON.stringify(data));
}

/**
 * Получить platform
 */
export function getPlatform() {
  return tg.platform || 'unknown';
}

/**
 * Проверить, запущено ли в Telegram
 */
export function isTelegram() {
  return !!tg.initData;
}
