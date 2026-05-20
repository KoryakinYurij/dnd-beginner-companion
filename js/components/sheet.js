/* ==========================================================================
   D&D 5e Помощник Новичка — Sheet Component (Главный Лист Персонажа)
   ========================================================================== */

// Импорт всех компонентов
import * as header from './header.js';
import * as combat from './combat.js';
import * as abilities from './abilities.js';
import * as skills from './skills.js';
import * as attacks from './attacks.js';
import * as inventory from './inventory.js';
import * as spells from './spells.js';
import * as features from './features.js';
import * as proficiencies from './proficiencies.js';
import * as notes from './notes.js';
import * as levelUpWizard from './levelUpWizard.js';

// Импорт утилит и состояния
import { setState, getState, getActiveCharacter } from '../state.js';
import { $, $$ } from '../utils.js';
import { roll, rollWithMod, playDiceSound, toggleSound } from '../dice.js';
import { getModifier, XP_TABLE } from '../rules/index.js';

// Константы вкладок
const TABS = ['attacks', 'inventory', 'spells', 'features', 'notes'];

// Звуковое состояние для шаблона (инициализируется в bind)
let soundEnabled = true;

/**
 * Рендерит полный HTML листа персонажа.
 * @param {Object} state - Глобальное состояние приложения.
 * @returns {string} - HTML разметка всего листа.
 */
export function render(state) {
  const character = getActiveCharacter();
  if (!character) {
    return '<div class="sheet-card"><p>Загрузка персонажа...</p></div>';
  }
  
  const activeTab = state.activeTab || 'attacks';
  const rollLog = state.rollLog || [];
  const canLevelUp = checkCanLevelUp(character);
  
  return `
    <div class="sheet-layout">
      <!-- ШАПКА ЛИСТА ПЕРСОНАЖА -->
      <div class="sheet-card sheet-header-card">
        ${header.render(character, state)}
      </div>
      
      <!-- КОЛОНКА 1: ХАРАКТЕРИСТИКИ -->
      <div class="sheet-card">
        ${abilities.render(character, state)}
      </div>
      
      <!-- КОЛОНКА 2: БОЕВОЙ БЛОК + НАВЫКИ -->
      <div class="sheet-card">
        ${combat.render(character, state)}
        <div style="margin-top: 20px;">
          ${skills.render(character, state)}
        </div>
      </div>
      
      <!-- ВКЛАДКИ (в колонке 2, после боевого блока) -->
      <div class="sheet-card sheet-tabs-container">
        <div class="tab-bar-menu">
          ${TABS.map(tab => `
            <button class="tab-menu-btn ${activeTab === tab ? 'active' : ''}" data-tab="${tab}">
              ${getTabIcon(tab)} ${getTabLabel(tab)}
            </button>
          `).join('')}
        </div>
        <div class="tab-pane-content ${activeTab === 'attacks' ? 'active' : ''}" data-tab-content="attacks">
          ${attacks.render(character, state)}
        </div>
        <div class="tab-pane-content ${activeTab === 'inventory' ? 'active' : ''}" data-tab-content="inventory">
          ${inventory.render(character, state)}
        </div>
        <div class="tab-pane-content ${activeTab === 'spells' ? 'active' : ''}" data-tab-content="spells">
          ${spells.render(character, state)}
        </div>
        <div class="tab-pane-content ${activeTab === 'features' ? 'active' : ''}" data-tab-content="features">
          ${features.render()}
        </div>
        <div class="tab-pane-content ${activeTab === 'notes' ? 'active' : ''}" data-tab-content="notes">
          ${notes.render(character, state)}
        </div>
      </div>
      
      <!-- ПРАВЫЙ САЙДБАР: ДАЙС-РОЛЛЕР -->
      <div class="sheet-card sheet-sidebar-right">
        ${renderDiceRoller()}
        ${renderRollLog(rollLog)}
        ${renderProficiencies()}
      </div>
    </div>
  `;
}

/**
 * Рендерит блок бросания кубиков.
 * @returns {string}
 */
function renderDiceRoller() {
  // Используем soundEnabled вместо toggleSound() чтобы избежать side effect в шаблоне
  const soundIcon = soundEnabled ? '🔊' : '🔇';
  
  return `
    <div class="dice-roller-header">
      <h3 class="sheet-card-title" style="margin:0;border:0;padding:0;">🎲 Бросок</h3>
    </div>
    <div class="dice-roller-grid">
      ${[4, 6, 8, 10, 12, 20].map(sides => `
        <button class="dice-roll-btn" data-sides="${sides}">
          <span class="dice-roll-btn-icon">${getDiceIcon(sides)}</span>
          <span class="dice-roll-btn-name">d${sides}</span>
        </button>
      `).join('')}
    </div>
    <div style="margin-top: 15px; text-align: center;">
      <button id="btn-sound-toggle-local" class="btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;">
        ${soundIcon} Звук
      </button>
    </div>
  `;
}

/**
 * Рендерит историю бросков.
 * @param {Array} rollLog - Массив бросков.
 * @returns {string}
 */
function renderRollLog(rollLog) {
  const recentLogs = rollLog.slice(0, 10);
  
  if (recentLogs.length === 0) {
    return `
      <div class="roll-history-card">
        <h4 class="sheet-card-title">📜 История</h4>
        <div class="empty-roll-log">Бросьте кубик!</div>
      </div>
    `;
  }
  
  const itemsHtml = recentLogs.map(entry => {
    const critClass = entry.isCrit ? 'crit' : (entry.isCritFail ? 'crit-fail' : '');
    const formula = entry.formula || `d20 ${getModifierDisplay(entry.modifier)}`;
    return `
      <div class="roll-history-item ${critClass}">
        <div class="roll-history-item-header">
          <span>${entry.label}</span>
          <span>${entry.timestamp}</span>
        </div>
        <div class="roll-history-item-body">
          <span class="roll-history-formula">${formula}</span>
          <span class="roll-history-result">${entry.total}</span>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="roll-history-card">
      <h4 class="sheet-card-title">📜 История</h4>
      <div class="roll-history-list">
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Рендерит блок владений.
 * @returns {string}
 */
function renderProficiencies() {
  return `
    <div class="proficiencies-list-grid">
      ${proficiencies.render()}
    </div>
  `;
}

/**
 * Привязывает обработчики событий к листу персонажа.
 * @param {HTMLElement} container - Контейнер листа.
 */
export function bind(container) {
  // Инициализируем состояние звука из dice.js
  soundEnabled = toggleSound();
  
  // Bind header component с коллбэком для Level Up
  header.bind(container, {
    onLevelUp: () => levelUpWizard.open()
  });
  
  // Bind abilities component
  abilities.bind(container);
  
  // Bind combat component
  combat.bind(container);
  
  // Bind skills component
  skills.bind(container);
  
  // Привязка контента активной вкладки
  const activeTab = getState().activeTab || 'attacks';
  bindTabContent(activeTab, container);
  
  // Tab navigation handlers
  const tabBtns = $$('.tab-menu-btn', container);
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab, container);
    });
  });
  
  // Dice roller handlers
  const diceBtns = $$('.dice-roll-btn', container);
  diceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.sides);
      rollDice(sides, btn);
    });
  });
  
  // Sound toggle - обновляем состояние и перерисовываем кнопку
  const soundBtn = $('#btn-sound-toggle-local', container);
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = toggleSound();
      soundBtn.innerHTML = `${soundEnabled ? '🔊' : '🔇'} Звук`;
    });
  }
  
  // Подписка на обновление rollLog для перерисовки истории
  import('../state.js').then(({ subscribe }) => {
    subscribe('rollLog', () => {
      const logContainer = $('.roll-history-list', container);
      if (logContainer) {
        const state = getState();
        logContainer.innerHTML = renderRollLogContent(state.rollLog);
      }
    });
  });
}

/**
 * Рендерит только содержимое истории бросков (без обёртки).
 * @param {Array} rollLog - Массив бросков.
 * @returns {string}
 */
function renderRollLogContent(rollLog) {
  const recentLogs = (rollLog || []).slice(0, 10);
  
  if (recentLogs.length === 0) {
    return '<div class="empty-roll-log">Бросьте кубик!</div>';
  }
  
  return recentLogs.map(entry => {
    const critClass = entry.isCrit ? 'crit' : (entry.isCritFail ? 'crit-fail' : '');
    const formula = entry.formula || 'd20';
    return `
      <div class="roll-history-item ${critClass}">
        <div class="roll-history-item-header">
          <span>${entry.label}</span>
          <span>${entry.timestamp}</span>
        </div>
        <div class="roll-history-item-body">
          <span class="roll-history-formula">${formula}</span>
          <span class="roll-history-result">${entry.total}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Переключает вкладку.
 * @param {string} tab - Название вкладки.
 * @param {HTMLElement} container - Контейнер.
 */
function switchTab(tab, container) {
  // Обновляем состояние
  setState({ activeTab: tab });
  
  // Обновляем кнопки вкладок
  $$('.tab-menu-btn', container).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Обновляем содержимое вкладок
  $$('.tab-pane-content', container).forEach(content => {
    content.classList.toggle('active', content.dataset.tabContent === tab);
  });
  
  // Bind new content
  bindTabContent(tab, container);
}

/**
 * Привязывает обработчики к содержимому активной вкладки.
 * @param {string} tab - Название вкладки.
 * @param {HTMLElement} container - Контейнер.
 */
function bindTabContent(tab, container) {
  const contentArea = $(`[data-tab-content="${tab}"]`, container);
  if (!contentArea) return;
  
  switch (tab) {
    case 'attacks':
      attacks.bind(contentArea);
      break;
    case 'inventory':
      inventory.bind(contentArea);
      break;
    case 'spells':
      spells.bind(contentArea);
      break;
    case 'features':
      features.bind(contentArea);
      break;
    case 'notes':
      notes.bind(contentArea);
      break;
  }
}

/**
 * Выполняет бросок кубика с анимацией.
 * @param {number} sides - Количество граней.
 * @param {HTMLElement} btn - Кнопка кубика.
 */
function rollDice(sides, btn) {
  // Анимация броска
  if (btn) {
    btn.classList.add('rolling');
    setTimeout(() => btn.classList.remove('rolling'), 400);
  }
  
  playDiceSound();
  
  const result = roll(sides);
  const isCrit = sides === 20 && result === 20;
  const isCritFail = sides === 20 && result === 1;
  
  // Показываем toast
  let message = `🎲 d${sides}: ${result}`;
  if (isCrit) message += ' 🌟 КРИТ!';
  if (isCritFail) message += ' 💀 Провал!';
  
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: message }
  }));
  
  // Vibration feedback
  if (navigator.vibrate) {
    if (isCrit) navigator.vibrate([100, 50, 100]);
    else if (isCritFail) navigator.vibrate(200);
    else navigator.vibrate(50);
  }
}

/**
 * Проверяет, можно ли повысить уровень.
 * @param {Object} character - Персонаж.
 * @returns {boolean}
 */
function checkCanLevelUp(character) {
  if (character.isMilestone) return character.level < 20;
  if (character.level >= 20) return false;
  
  const nextLevelXP = XP_TABLE[character.level]?.xp;
  if (nextLevelXP === undefined) return false;
  
  return character.xp >= nextLevelXP;
}

/**
 * Получает отформатированную строку модификатора.
 * @param {number} mod - Модификатор.
 * @returns {string}
 */
function getModifierDisplay(mod) {
  if (mod === undefined || mod === null) return '';
  if (mod > 0) return `+${mod}`;
  if (mod === 0) return '0';
  return `${mod}`;
}

/**
 * Получает иконку вкладки.
 * @param {string} tab - Название вкладки.
 * @returns {string}
 */
function getTabIcon(tab) {
  const icons = {
    attacks: '⚔️',
    inventory: '🎒',
    spells: '✨',
    features: '⭐',
    notes: '📝'
  };
  return icons[tab] || '📄';
}

/**
 * Получает название вкладки.
 * @param {string} tab - Название вкладки.
 * @returns {string}
 */
function getTabLabel(tab) {
  const labels = {
    attacks: 'Атаки',
    inventory: 'Инвентарь',
    spells: 'Заклинания',
    features: 'Черты',
    notes: 'Заметки'
  };
  return labels[tab] || tab;
}

/**
 * Получает иконку кубика по количеству граней.
 * @param {number} sides - Количество граней.
 * @returns {string}
 */
function getDiceIcon(sides) {
  const diceChars = {
    4: '◇',
    6: '⬢',
    8: '⬢',
    10: '⬡',
    12: '⬡',
    20: '⬣'
  };
  return diceChars[sides] || '◯';
}