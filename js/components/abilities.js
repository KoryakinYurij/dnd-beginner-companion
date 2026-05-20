/* ==========================================================================
   D&D 5e Помощник Новичка — Abilities Component (Характеристики)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$ } from '../utils.js';
import { getModifier, getProficiencyBonus } from '../rules/index.js';
import { rollWithMod } from '../dice.js';

const ABILITIES_INFO = {
  STR: { name: 'Сила', nameEn: 'Strength', icon: '💪' },
  DEX: { name: 'Ловкость', nameEn: 'Dexterity', icon: '🌀' },
  CON: { name: 'Телосложение', nameEn: 'Constitution', icon: '❤️' },
  INT: { name: 'Интеллект', nameEn: 'Intelligence', icon: '🧠' },
  WIS: { name: 'Мудрость', nameEn: 'Wisdom', icon: '👁️' },
  CHA: { name: 'Харизма', nameEn: 'Charisma', icon: '✨' }
};

/**
 * Рендерит HTML карточек характеристик.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const showHelp = state.showHelp !== false;
  const abilities = character.abilities || {};
  const savingThrows = character.savingThrows || [];
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  
  const abilityRows = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => {
    const info = ABILITIES_INFO[key];
    const score = abilities[key] || 10;
    const mod = getModifier(score);
    const hasSaveProf = savingThrows.includes(key);
    const saveBonus = hasSaveProf ? mod + proficiencyBonus : mod;
    
    return `
      <div class="ability-card-row" data-ability="${key}" ${showHelp ? `title="Двойной клик для редактирования, клик на модификатор - бросок"` : ''}>
        <div class="ability-card-lbl">
          <span class="ability-card-name-ru">${info.name}</span>
          <span class="ability-card-name-en">${info.nameEn}</span>
        </div>
        <div class="ability-card-score-box">
          <span class="ability-card-score" data-score="${score}">${score}</span>
          <button class="ability-card-modifier" data-ability="${key}" title="Клик: бросок ${info.name} | Двойной клик: редактировать">
            ${formatModifier(mod)}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="abilities-vertical-stack">
      <h3 class="sheet-card-title">📊 Характеристики</h3>
      ${abilityRows}
    </div>
  `;
}

/**
 * Привязывает обработчики к карточкам характеристик.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Обработчики dblclick на строку (режим редактирования для ASI)
  const rows = $$('.ability-card-row', container);
  rows.forEach(row => {
    row.addEventListener('dblclick', (e) => {
      // Ignore if clicking on button
      if (e.target.tagName === 'BUTTON') return;
      
      const ability = row.dataset.ability;
      const character = getActiveCharacter();
      if (!character) return;
      
      const currentScore = character.abilities[ability] || 10;
      
      // Find score display element
      const scoreEl = row.querySelector('.ability-card-score');
      if (!scoreEl) return;
      
      // Create input element
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'ability-score-edit';
      input.value = currentScore;
      input.min = 1;
      input.max = 30;
      input.style.cssText = 'width: 50px; text-align: center; font-size: inherit; background: var(--bg-secondary); border: 1px solid var(--accent-gold); border-radius: 4px; color: var(--text-primary);';
      
      // Replace text with input
      scoreEl.textContent = '';
      scoreEl.appendChild(input);
      input.focus();
      input.select();
      
      // Save on blur or Enter
      const saveEdit = () => {
        const newScore = parseInt(input.value);
        if (!isNaN(newScore) && newScore >= 1 && newScore <= 30) {
          updateAbility(ability, newScore);
        }
        // Restore text display
        const char = getActiveCharacter();
        if (char) {
          scoreEl.textContent = char.abilities[ability] || 10;
        }
      };
      
      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    });
    
    // Single click on row - does nothing (click is only on modifier button)
  });
  
  // Обработчики клика на модификатор (бросок)
  const modBtns = $$('.ability-card-modifier', container);
  modBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const ability = btn.dataset.ability;
      const character = getActiveCharacter();
      if (!character) return;
      
      const mod = getModifier(character.abilities[ability]);
      const proficiencyBonus = getProficiencyBonus(character.level || 1);
      const hasSaveProf = character.savingThrows?.includes(ability);
      const totalMod = hasSaveProf ? mod + proficiencyBonus : mod;
      
      rollWithMod(20, totalMod, `${ABILITIES_INFO[ability]?.name} (Спасбросок)`);
    });
  });
}

/**
 * Обновляет значение характеристики.
 * @param {string} ability - Ключ характеристики.
 * @param {number} value - Новое значение.
 */
function updateAbility(ability, value) {
  const character = getActiveCharacter();
  if (!character) return;
  
  const abilities = { ...character.abilities, [ability]: value };
  
  const updatedChars = getState().characters.map(c => 
    c.id === character.id ? { ...c, abilities } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Вспомогательная функция для форматирования модификатора.
 * @param {number} n - Число.
 * @returns {string}
 */
function formatModifier(n) {
  if (n > 0) return `+${n}`;
  if (n === 0) return '0';
  return `${n}`;
}