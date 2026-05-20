/* ==========================================================================
   D&D 5e Помощник Новичка — Combat Component (Боевые параметры)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$ } from '../utils.js';
import { getModifier, getProficiencyBonus } from '../rules/index.js';
import { rollWithMod } from '../dice.js';

/**
 * Рендерит HTML блока боевых параметров.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const showHelp = state.showHelp !== false;
  const hp = character.hp || { current: 10, max: 10, temp: 0 };
  const dexMod = getModifier(character.abilities?.DEX || 10);
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  const level = character.level || 1;
  
  // Base AC calculation
  const baseAC = 10 + dexMod;
  const ac = character.acOverride || baseAC;
  
  // Initiative
  const initiative = dexMod;
  
  // Speed
  const speed = 30;
  
  // Hit Dice
  const hitDieSize = getHitDieSize(character.class);
  const hitDiceTotal = level;
  const hitDiceUsed = 0;
  
  // Death Saves
  const deathSaves = character.deathSaves || { successes: 0, failures: 0 };
  
  // Conditions
  const conditions = character.conditions || [];
  
  // Calculate HP percentage
  const hpPercent = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));
  
  // Dynamic HP bar gradient based on percentage
  const hpGradient = hpPercent > 50 
    ? 'linear-gradient(90deg, #06d6a0, #00c853)'  // Green (>50%)
    : hpPercent > 25 
      ? 'linear-gradient(90deg, #f77f00, #ffab00)'  // Yellow (25-50%)
      : 'linear-gradient(90deg, #c9184a, #ff4d6d)';  // Red (<25%)
  
  return `
    <!-- БОЕВОЙ ХАБ: HP, AC, Инициатива, Скорость -->
    <div class="combat-hub-grid">
      <div class="combat-hub-box" data-action="roll-initiative" ${showHelp ? 'title="Бросок инициативы"' : ''}>
        <span class="combat-hub-box-val">${formatModifier(initiative)}</span>
        <span class="combat-hub-box-lbl">Инициатива</span>
      </div>
      <div class="combat-hub-box" ${showHelp ? 'title="Класс брони - защита от атак"' : ''}>
        <span class="combat-hub-box-val">${ac}</span>
        <span class="combat-hub-box-lbl">Класс Брони</span>
      </div>
      <div class="combat-hub-box" ${showHelp ? 'title="Скорость передвижения"' : ''}>
        <span class="combat-hub-box-val">${speed}</span>
        <span class="combat-hub-box-lbl">Скорость (фт)</span>
      </div>
    </div>
    
    <!-- HP БЛОК -->
    <div class="hp-main-box" id="hp-block">
      <div class="hp-details-row">
        <div class="hp-numbers-large">
          <input type="number" class="hp-input-small" id="hp-current" value="${hp.current}" min="0" max="${hp.max}">
          <span class="hp-max-divider">/</span>
          <span class="hp-max-val">${hp.max}</span>
        </div>
        <div class="hp-controls-row">
          <button class="btn-secondary" data-action="hp-minus" title="Урон">−</button>
          <button class="btn-primary" data-action="hp-plus" title="Лечение">+</button>
          <input type="number" class="hp-input-small hp-temp-input" id="hp-temp" value="${hp.temp || 0}" placeholder="Темп">
        </div>
      </div>
      <div class="hp-bar-outer">
        <div class="hp-bar-inner" id="hp-bar-fill" style="width: ${hpPercent}%; background: ${hpGradient};"></div>
      </div>
      ${hp.temp > 0 ? `<div style="font-size: 0.8rem; color: var(--accent-blue);">Темп HP: +${hp.temp}</div>` : ''}
    </div>
    
    <!-- HIT DICE -->
    <div class="hit-dice-wrapper">
      <div>
        <span style="font-weight: 600;">🎲 Hit Dice: d${hitDieSize}</span>
        <span style="margin-left: 10px; color: var(--text-secondary);">${hitDiceTotal - hitDiceUsed} доступно</span>
      </div>
      <div class="hit-dice-pips-container">
        ${Array.from({ length: hitDiceTotal }, (_, i) => `
          <button class="hd-pip ${i < hitDiceUsed ? 'spent' : 'available'}" data-index="${i}" title="Бросить d${hitDieSize}"></button>
        `).join('')}
      </div>
    </div>
    
    <!-- DEATH SAVES -->
    ${hp.current <= 0 ? `
    <div class="death-saves-box">
      <div class="death-saves-title">☠️ Спасброски Смерти</div>
      <div class="death-saves-rows">
        <div class="death-save-row">
          <span class="ds-label">Успехи:</span>
          <div class="ds-pips">
            ${[1, 2, 3].map(i => `
              <button class="ds-pip success ${deathSaves.successes >= i ? 'active' : ''}" data-type="success" data-index="${i}" title="Успех"></button>
            `).join('')}
          </div>
        </div>
        <div class="death-save-row">
          <span class="ds-label">Провалы:</span>
          <div class="ds-pips">
            ${[1, 2, 3].map(i => `
              <button class="ds-pip failure ${deathSaves.failures >= i ? 'active' : ''}" data-type="failure" data-index="${i}" title="Провал"></button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- CONDITIONS -->
    <div class="conditions-panel-wrapper">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: 600; color: var(--accent-purple);">📌 Состояния</span>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" data-action="add-condition">+ Добавить</button>
      </div>
      <div class="conditions-grid">
        ${conditions.length > 0 ? conditions.map(cond => `
          <span class="condition-pill active">${cond}</span>
        `).join('') : '<span style="color: var(--text-muted); font-size: 0.85rem;">Нет активных состояний</span>'}
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку боевых параметров.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Initiative roll
  const initBox = $('.combat-hub-box[data-action="roll-initiative"]', container);
  if (initBox) {
    initBox.addEventListener('click', () => {
      rollWithMod(20, getModifier(getActiveCharacter()?.abilities?.DEX || 10), 'Инициатива');
    });
  }
  
  // HP controls
  const hpMinusBtn = $('[data-action="hp-minus"]', container);
  if (hpMinusBtn) {
    hpMinusBtn.addEventListener('click', () => {
      const amount = prompt('Введите урон:');
      if (amount && !isNaN(amount)) {
        adjustHP(-parseInt(amount));
      }
    });
  }
  
  const hpPlusBtn = $('[data-action="hp-plus"]', container);
  if (hpPlusBtn) {
    hpPlusBtn.addEventListener('click', () => {
      const amount = prompt('Введите лечение:');
      if (amount && !isNaN(amount)) {
        adjustHP(parseInt(amount));
      }
    });
  }
  
  // HP input change
  const hpCurrentInput = $('#hp-current', container);
  if (hpCurrentInput) {
    hpCurrentInput.addEventListener('change', () => {
      const value = parseInt(hpCurrentInput.value) || 0;
      const char = getActiveCharacter();
      if (char) {
        const updatedChars = getState().characters.map(c => 
          c.id === char.id ? { ...c, hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, value)) } } : c
        );
        setState({ characters: updatedChars });
      }
    });
  }
  
  // Hit Dice pips
  const hdPips = $$('.hd-pip', container);
  hdPips.forEach(pip => {
    pip.addEventListener('click', () => {
      if (!pip.classList.contains('spent')) {
        const char = getActiveCharacter();
        if (char) {
          const conMod = getModifier(char.abilities?.CON || 10);
          rollWithMod(getHitDieSize(char.class), conMod, `Hit Dice (d${getHitDieSize(char.class)})`);
          pip.classList.add('spent');
        }
      }
    });
  });
  
  // Death Saves
  const dsPips = $$('.ds-pip', container);
  dsPips.forEach(pip => {
    pip.addEventListener('click', () => {
      const type = pip.dataset.type;
      const index = parseInt(pip.dataset.index);
      toggleDeathSave(type, index);
    });
  });
  
  // Add condition button
  const addConditionBtn = $('[data-action="add-condition"]', container);
  if (addConditionBtn) {
    addConditionBtn.addEventListener('click', () => showConditionModal());
  }
}

/**
 * Изменяет HP персонажа.
 * @param {number} amount - Изменение HP (отрицательное для урона).
 */
function adjustHP(amount) {
  const char = getActiveCharacter();
  if (!char) return;
  
  let newCurrent = char.hp.current + amount;
  let newTemp = char.hp.temp || 0;
  
  // Handle temp HP damage
  if (amount < 0 && newTemp > 0) {
    const damageToTemp = Math.min(newTemp, Math.abs(amount));
    newTemp -= damageToTemp;
    amount += damageToTemp;
  }
  
  newCurrent = Math.max(0, Math.min(char.hp.max, newCurrent));
  
  const updatedChars = getState().characters.map(c => 
    c.id === char.id ? { ...c, hp: { ...c.hp, current: newCurrent, temp: newTemp } } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Переключает спасбросок смерти.
 * @param {string} type - 'success' или 'failure'.
 * @param {number} index - Индекс (1-3).
 */
function toggleDeathSave(type, index) {
  const char = getActiveCharacter();
  if (!char) return;
  
  const currentSaves = char.deathSaves || { successes: 0, failures: 0 };
  const currentCount = type === 'success' ? currentSaves.successes : currentSaves.failures;
  const newCount = currentCount >= index ? index - 1 : index;
  
  const key = type === 'success' ? 'successes' : 'failures';
  
  const updatedChars = getState().characters.map(c => {
    if (c.id !== char.id) return c;
    return { ...c, deathSaves: { ...c.deathSaves, [key]: newCount } };
  });
  setState({ characters: updatedChars });
}

/**
 * Показывает модалку для добавления состояния.
 */
function showConditionModal() {
  const conditions = [
    'Ослеплён', 'Очарован', 'Глухота', 'Испуг', 'Истощение', 
    'Окровавлен', 'Обессилен', 'Неподвижность', 'Невидимость', 
    'Опутан', 'Оглушён', 'Отравлен', 'Лежащий', 'Оглушён'
  ];
  
  const modal = $('#modal-content');
  modal.innerHTML = `
    <div class="condition-select-modal" style="max-width: 500px;">
      <button class="modal-close-btn" id="close-condition-modal">&times;</button>
      <h2>📌 Добавить Состояние</h2>
      <div class="conditions-grid" style="margin-top: 15px;">
        ${conditions.map(cond => `
          <button class="condition-pill" data-condition="${cond}">${cond}</button>
        `).join('')}
      </div>
      <button class="btn-danger" id="btn-clear-conditions" style="margin-top: 15px; width: 100%;">Снять все состояния</button>
    </div>
  `;
  
  $('#modal-overlay').classList.add('active');
  
  $('#close-condition-modal')?.addEventListener('click', () => {
    $('#modal-overlay').classList.remove('active');
    $('#modal-content').innerHTML = '';
  });
  
  $$('.condition-pill', modal).forEach(btn => {
    btn.addEventListener('click', () => {
      const cond = btn.dataset.condition;
      addCondition(cond);
      $('#modal-overlay').classList.remove('active');
      $('#modal-content').innerHTML = '';
    });
  });
  
  $('#btn-clear-conditions')?.addEventListener('click', () => {
    clearAllConditions();
    $('#modal-overlay').classList.remove('active');
    $('#modal-content').innerHTML = '';
  });
}

/**
 * Добавляет состояние персонажу.
 * @param {string} condition - Название состояния.
 */
function addCondition(condition) {
  const char = getActiveCharacter();
  if (!char) return;
  
  const conditions = [...(char.conditions || [])];
  if (!conditions.includes(condition)) {
    conditions.push(condition);
  }
  
  const updatedChars = getState().characters.map(c => 
    c.id === char.id ? { ...c, conditions } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Удаляет все состояния.
 */
function clearAllConditions() {
  const char = getActiveCharacter();
  if (!char) return;
  
  const updatedChars = getState().characters.map(c => 
    c.id === char.id ? { ...c, conditions: [] } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Получает размер Hit Die класса.
 * @param {string} className - Название класса.
 * @returns {number}
 */
function getHitDieSize(className) {
  const name = (className || '').toLowerCase();
  if (name.includes('варвар')) return 12;
  if (name.includes('воин') || name.includes('паладин') || name.includes('следопыт')) return 10;
  if (name.includes('бард') || name.includes('жрец') || name.includes('друид') || name.includes('монах') || name.includes('плут') || name.includes('колдун')) return 8;
  if (name.includes('маг') || name.includes('чародей')) return 6;
  return 8;
}

/**
 * Форматирует модификатор.
 * @param {number} n - Число.
 * @returns {string}
 */
function formatModifier(n) {
  if (n > 0) return `+${n}`;
  if (n === 0) return '0';
  return `${n}`;
}