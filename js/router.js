/* ==========================================================================
   D&D 5e Помощник Новичка — Маршрутизатор (Router)
   ========================================================================== */

import { $ } from './utils.js';

/**
 * Переключает видимый экран приложения.
 * @param {string} screenName - Имя экрана ('home' | 'wizard' | 'sheet').
 */
export function navigate(screenName) {
  const screens = {
    home: $('#screen-home'),
    wizard: $('#screen-wizard'),
    sheet: $('#screen-sheet')
  };

  // Проверим, существуют ли экраны
  if (!screens[screenName]) {
    console.error(`Экран "${screenName}" не найден в DOM.`);
    return;
  }

  // Убираем активный класс у всех и добавляем нужному
  Object.keys(screens).forEach(key => {
    const screen = screens[key];
    if (key === screenName) {
      screen.style.display = 'block';
      // Небольшая задержка для плавного появления
      setTimeout(() => {
        screen.classList.add('active');
      }, 20);
    } else {
      screen.classList.remove('active');
      screen.style.display = 'none';
    }
  });

  // Синхронизируем состояние истории браузера (опционально, но полезно)
  if (window.history.state?.screen !== screenName) {
    window.history.pushState({ screen: screenName }, '', `#${screenName}`);
  }
  
  // Прокручиваем наверх при смене экрана
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Инициализация обработчика кнопки "Назад" в браузере
export function initRouter(onNavigateCallback) {
  window.addEventListener('popstate', (event) => {
    const screenName = event.state?.screen || 'home';
    navigate(screenName);
    if (onNavigateCallback) {
      onNavigateCallback(screenName);
    }
  });

  // Первичная навигация при загрузке по хэшу
  const hash = window.location.hash.replace('#', '');
  if (['home', 'wizard', 'sheet'].includes(hash)) {
    navigate(hash);
    if (onNavigateCallback) {
      onNavigateCallback(hash);
    }
  }
}
