/* ==========================================================================
   D&D 5e Помощник Новичка — Header Component (Шапка персонажа)
   ========================================================================== */

import { setState, getActiveCharacter, getState } from '../state.js';
import { $, $$ } from '../utils.js';
import { getModifier, getXPForNextLevel, getProficiencyBonus } from '../rules/index.js';

/**
 * Рендерит HTML шапки персонажа.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const level = character.level || 1;
  const xp = character.xp || 0;
  const isMilestone = character.isMilestone || false;
  const nextLevelXP = getXPForNextLevel(level);
  const canLevelUp = nextLevelXP !== null && (isMilestone || xp >= nextLevelXP);
  const profBonus = getProficiencyBonus(level);
  
  // Calculate XP progress for milestone display
  let xpProgress = 100;
  let xpNeeded = 0;
  if (!isMilestone && nextLevelXP) {
    const prevLevelXP = level > 1 ? getXPForNextLevel(level - 1) || 0 : 0;
    const xpInCurrentLevel = xp - prevLevelXP;
    const xpNeededForLevel = nextLevelXP - prevLevelXP;
    xpProgress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
    xpNeeded = nextLevelXP - xp;
  }
  
  const inspiration = character.inspiration || false;
  const showHelp = state.showHelp !== false;
  
  return `
    <div class="sheet-header-info">
      <button id="btn-back-home" class="btn-secondary" style="align-self: flex-start;" title="Вернуться к списку персонажей">
        ← Назад
      </button>
      
      <div class="sheet-header-avatar">
        ${character.portrait || '⚔️'}
      </div>
      
      <div class="sheet-header-names">
        <h2>
          ${character.name}
          ${canLevelUp ? `<button id="btn-level-up" class="level-up-btn-glow" style="font-size: 0.8rem; padding: 4px 10px;">⚡ LEVEL UP!</button>` : ''}
        </h2>
        <p class="sheet-header-meta">${character.race || ''} • ${character.class || ''} • Уровень ${level} (Prof +${profBonus})</p>
      </div>
    </div>
    
    <div class="xp-milestone-panel">
      <div class="xp-tracker-wrapper">
        <div class="xp-numeric-row">
          <span>Опыт (XP)</span>
          <span>${xp.toLocaleString()}${!isMilestone && nextLevelXP ? ` / ${nextLevelXP.toLocaleString()}` : ''}</span>
        </div>
        ${!isMilestone && nextLevelXP ? `
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width: ${xpProgress}%"></div>
        </div>
        ` : ''}
      </div>
      
      <button id="btn-inspiration" class="inspiration-toggle-btn ${inspiration ? 'active' : ''}" ${showHelp ? 'title="Звезда Вдохновения"' : ''}>
        ⭐
      </button>
    </div>
    
    <div style="display: flex; gap: 10px; grid-column: 1 / -1;">
      <button id="btn-long-rest" class="btn-secondary" ${showHelp ? 'title="Длинный отдых восстанавливает HP и слоты"' : ''}>
        🌙 Длинный Отдых
      </button>
      <button id="btn-short-rest" class="btn-secondary" ${showHelp ? 'title="Короткий отдых восстанавливает Hit Dice"' : ''}>
        ☕ Короткий Отдых
      </button>
    </div>
  `;
}

/**
 * Привязывает обработчики к шапке персонажа.
 * @param {HTMLElement} container - Контейнер компонента.
 * @param {Object} callbacks - Колбэки для внешних обработчиков (levelUp, etc).
 */
export function bind(container, callbacks = {}) {
  // Кнопка "Назад"
  const btnBack = $('#btn-back-home', container);
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      setState({ currentScreen: 'home' });
    });
  }
  
  // Кнопка Вдохновения
  const btnInspiration = $('#btn-inspiration', container);
  if (btnInspiration) {
    btnInspiration.addEventListener('click', () => {
      const state = getState();
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return;
      
      const updatedChars = state.characters.map(c => 
        c.id === char.id ? { ...c, inspiration: !c.inspiration } : c
      );
      setState({ characters: updatedChars });
    });
  }
  
  // Кнопка Level Up (если есть)
  const btnLevelUp = $('#btn-level-up', container);
  if (btnLevelUp) {
    btnLevelUp.addEventListener('click', () => {
      if (callbacks.onLevelUp) {
        callbacks.onLevelUp();
      }
    });
  }
  
  // Кнопки отдыха
  const btnLongRest = $('#btn-long-rest', container);
  if (btnLongRest) {
    btnLongRest.addEventListener('click', () => handleLongRest());
  }
  
  const btnShortRest = $('#btn-short-rest', container);
  if (btnShortRest) {
    btnShortRest.addEventListener('click', () => handleShortRest());
  }
}

/**
 * Обработка длинного отдыха (Long Rest).
 */
function handleLongRest() {
  const state = getState();
  const char = state.characters.find(c => c.id === state.activeCharacterId);
  if (!char) return;
  
  // Полное восстановление HP
  const updatedChar = {
    ...char,
    hp: {
      ...char.hp,
      current: char.hp.max,
      temp: 0
    },
    deathSaves: { successes: 0, failures: 0 }
  };
  
  // Восстановление слотов заклинаний
  if (updatedChar.spellSlots) {
    Object.keys(updatedChar.spellSlots).forEach(slot => {
      updatedChar.spellSlots[slot] = {
        ...updatedChar.spellSlots[slot],
        current: updatedChar.spellSlots[slot].max
      };
    });
  }
  
  // Сохраняем через state manager
  import('../state.js').then(({ saveCharacter }) => {
    saveCharacter(updatedChar);
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: '🌙 Длинный отдых: HP и слоты восстановлены!' }
    }));
  });
}

/**
 * Обработка короткого отдыха (Short Rest).
 */
function handleShortRest() {
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: '☕ Короткий отдых: Используйте Hit Dice для лечения!' }
  }));
}