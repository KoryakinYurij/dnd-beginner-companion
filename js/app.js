/* ==========================================================================
   D&D 5e Помощник Новичка — Точка входа приложения (Core App Entry Point)
   ========================================================================== */

import { loadFromStorage, getState, setState, subscribe, importCharacter } from './state.js';
import { navigate, initRouter } from './router.js';
import { toggleSound } from './dice.js';
import { $ } from './utils.js';

// Импорт UI-рендереров компонентов
import * as characterSelect from './components/characterSelect.js';
import * as wizard from './components/wizard.js';
import * as sheet from './components/sheet.js';

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализируем роутер и реактивные подписки
  initRouter(handleScreenNavigation);
  setupSubscriptions();
  
  // 2. Загружаем данные из localStorage
  loadFromStorage();
  
  // 3. Если загрузился активный персонаж, направляем на лист, иначе на главную
  const activeCharId = getState().activeCharacterId;
  if (activeCharId) {
    setState({ currentScreen: 'sheet' });
  } else {
    setState({ currentScreen: 'home' });
  }

  // 3.1 Гарантируем первичный рендер/биндинг даже если экран не изменился
  renderScreen(getState().currentScreen, getState());

  // 4. Инициализация глобальных UI обработчиков событий
  setupGlobalEvents();
});

/**
 * Обрабатывает физическое переключение экранов роутером.
 * Вызывается при popstate или ручном navigate().
 * @param {string} screenName - Имя нового экрана.
 */
function handleScreenNavigation(screenName) {
  setState({ currentScreen: screenName });
}

/**
 * Подписки компонентов на изменение состояния (точечный ре-рендер).
 */
function setupSubscriptions() {
  // Подписка на смену экранов
  subscribe('currentScreen', (screenName, fullState) => {
    navigate(screenName);
    renderScreen(screenName, fullState);
  });

  // Подписка на обновление персонажей (перерендер списка на главной)
  subscribe('characters', (charactersList, fullState) => {
    if (fullState.currentScreen === 'home') {
      const container = $('#screen-home');
      container.innerHTML = characterSelect.render(fullState);
      characterSelect.bind(container);
    }
  });

  // Подписка на изменение глобального параметра отображения подсказок
  subscribe('showHelp', (showHelp, fullState) => {
    const btn = $('#btn-help-toggle');
    if (btn) {
      btn.innerHTML = showHelp ? '❓' : '🚫';
      btn.title = showHelp ? 'Скрыть подсказки новичкам' : 'Показать подсказки новичкам';
    }
    
    // Перерендер текущего листа персонажа для мгновенного скрытия/показа тултипов
    if (fullState.currentScreen === 'sheet') {
      const container = $('#screen-sheet');
      container.innerHTML = sheet.render(fullState);
      sheet.bind(container);
    }
  });
}

/**
 * Рендер и привязка обработчиков для конкретного экрана.
 * @param {string} screenName - Имя экрана.
 * @param {Object} fullState - Глобальное состояние.
 */
function renderScreen(screenName, fullState) {
  if (screenName === 'home') {
    const container = $('#screen-home');
    container.innerHTML = characterSelect.render(fullState);
    characterSelect.bind(container);
  } 
  else if (screenName === 'wizard') {
    const container = $('#screen-wizard');
    container.innerHTML = wizard.render(fullState);
    wizard.bind(container);
  } 
  else if (screenName === 'sheet') {
    const container = $('#screen-sheet');
    container.innerHTML = sheet.render(fullState);
    sheet.bind(container);
  }
}

/**
 * Глобальные обработчики событий (звук, импорт, закрытие модалок).
 */
function setupGlobalEvents() {
  // Кнопка звука
  const btnSound = $('#btn-sound-toggle');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const isSound = toggleSound();
      btnSound.innerHTML = isSound ? '🔊' : '🔇';
      btnSound.title = isSound ? 'Выключить звук броска' : 'Включить звук броска';
      
      // Запустим тихий проверочный щелчок
      if (isSound) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { text: '🔊 Звук кубиков включен!' }
        }));
      }
    });
  }

  // Кнопка тултипов
  const btnHelp = $('#btn-help-toggle');
  if (btnHelp) {
    btnHelp.addEventListener('click', () => {
      const showHelp = getState().showHelp;
      setState({ showHelp: !showHelp });
    });
  }

  // Импорт файлов из инпута
  const inputImport = $('#input-import-char');
  if (inputImport) {
    inputImport.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        const success = await importCharacter(file);
        if (success) {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { text: '📥 Персонаж успешно импортирован!' }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { text: '⚠️ Ошибка импорта. Проверьте формат файла .json', duration: 4000 }
          }));
        }
      }
      // Очищаем инпут для возможности повторной загрузки того же файла
      inputImport.value = '';
    });
  }

  // Слушатель кастомных алертов через кастомные события (для тостов вне dice.js)
  window.addEventListener('app-toast', (e) => {
    showToast(e.detail.text, e.detail.duration || 3000);
  });

  // Закрытие модального окна по клику на оверлей
  const modalOverlay = $('#modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        $('#modal-content').innerHTML = '';
      }
    });
  }
}

/**
 * Показывает стандартный текстовый тост.
 * @param {string} text - Текст.
 * @param {number} duration - Длительность.
 */
function showToast(text, duration) {
  const container = $('#toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span style="font-weight: 600;">${text}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/**
 * Запускает праздничную анимацию конфетти при создании или левелапе героя.
 */
