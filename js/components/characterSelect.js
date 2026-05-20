/* ==========================================================================
   D&D 5e Помощник Новичка — Выбор персонажа (Character Select Component)
   ========================================================================== */

import { setState, deleteCharacter, exportCharacter } from '../state.js';
import { $, escapeHtml } from '../utils.js';

/**
 * Рендерит разметку экрана выбора персонажей.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(state) {
  const chars = state.characters || [];
  
  let gridContent = '';
  
  if (chars.length === 0) {
    gridContent = `
      <div class="empty-characters">
        <div class="empty-char-icon">🧙‍♂️</div>
        <h3>У вас пока нет героев</h3>
        <p style="margin-top: 8px; font-size: 0.9rem;">Нажмите кнопку ниже, чтобы создать своего первого искателя приключений. Наш интерактивный мастер проведет вас по всем шагам!</p>
      </div>
    `;
  } else {
    gridContent = chars.map(char => {
      return `
        <div class="char-select-card" data-id="${char.id}">
          <div class="char-card-header">
            <div class="char-card-icon">${char.portrait || '⚔️'}</div>
            <div class="char-card-title">
              <h3>${escapeHtml(char.name)}</h3>
              <p>${char.race} • ${char.class} ${char.level} уровня</p>
            </div>
          </div>
          
          <div class="char-card-stats">
            <div>
              <div class="char-card-stat-val">${char.hp.max}</div>
              <div class="char-card-stat-lbl">HP макс</div>
            </div>
            <div>
              <div class="char-card-stat-val">${char.abilities.STR}</div>
              <div class="char-card-stat-lbl">Сила</div>
            </div>
            <div>
              <div class="char-card-stat-val">${char.abilities.DEX}</div>
              <div class="char-card-stat-lbl">Ловк</div>
            </div>
          </div>
          
          <div class="char-card-actions">
            <button class="btn-primary btn-play" data-id="${char.id}">▶ Играть</button>
            <button class="btn-secondary btn-export" data-id="${char.id}" title="Экспорт в файл .json">📤</button>
            <button class="btn-danger btn-delete" data-id="${char.id}" title="Удалить героя">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  return `
    <div class="home-container">
      <header class="home-header">
        <h1 class="logo-title">DnD Помощник</h1>
        <p class="logo-subtitle">Твой идеальный проводник в мир Dungeons &amp; Dragons</p>
      </header>
      
      <div class="character-select-hub">
        <div class="characters-grid-wrapper">
          <h2 class="section-title-parchment">Твои Герои</h2>
          <div id="characters-grid" class="characters-grid">
            ${gridContent}
          </div>
        </div>
        
        <div class="home-actions">
          <button id="btn-new-character" class="btn-glow-gold">⚔️ Создать Нового Героя</button>
          <label class="btn-secondary-custom" for="input-import-char">
            📥 Импортировать Персонажа (.json)
          </label>
        </div>
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики событий к элементам экрана выбора.
 * @param {HTMLElement} container - Контейнер экрана.
 */
export function bind(container) {
  // Кнопка создания нового персонажа
  const btnNew = $('#btn-new-character', container);
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      // Инициализируем пустые временные данные создания
      setState({ 
        wizardData: {
          step: 1,
          name: '',
          gender: 'Мужской',
          portrait: '⚔️',
          race: null,
          class: null,
          background: null,
          statsMethod: 'array', // 'array' | 'roll' | 'point'
          assignedStats: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null },
          statPool: [15, 14, 13, 12, 10, 8],
          rolledStats: [],
          rollsDone: false,
          pointBuy: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
          pointBuyRemaining: 27,
          skills: []
        },
        currentScreen: 'wizard'
      });
    });
  }

  // Кнопки играть/экспорт/удалить на карточках
  container.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.btn-play');
    if (playBtn) {
      const id = playBtn.dataset.id;
      setState({ 
        activeCharacterId: id,
        currentScreen: 'sheet',
        activeTab: 'attacks' // сброс вкладки
      });
      return;
    }

    const exportBtn = e.target.closest('.btn-export');
    if (exportBtn) {
      const id = exportBtn.dataset.id;
      exportCharacter(id);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { text: '📤 Файл персонажа экспортирован!' }
      }));
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const charName = e.target.closest('.char-select-card').querySelector('h3').textContent;
      
      // Красивое стандартное подтверждение в браузере
      if (confirm(`Вы уверены, что хотите навсегда удалить героя ${charName}? Это действие нельзя отменить.`)) {
        deleteCharacter(id);
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { text: `🗑️ Персонаж ${charName} удален.` }
        }));
      }
      return;
    }
  });
}
