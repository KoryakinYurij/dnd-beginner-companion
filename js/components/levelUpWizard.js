/* ==========================================================================
   D&D 5e Помощник Новичка — Level Up Wizard (Повышение Уровня)
   ========================================================================== */

import { getState, setState, saveCharacter } from '../state.js';
import { $, $$ } from '../utils.js';
import { XP_TABLE, getProficiencyBonus, getLevelUpHP, getModifier } from '../rules/index.js';
import { roll } from '../dice.js';
import { triggerConfetti } from '../app.js';

/**
 * Проверяет, достаточно ли XP для повышения уровня.
 * @param {Object} character - Персонаж.
 * @returns {boolean}
 */
export function canLevelUp(character) {
  if (character.isMilestone) return true;
  if (!character || character.level >= 20) return false;
  
  const nextLevelXP = XP_TABLE[character.level]?.xp;
  if (nextLevelXP === undefined) return false;
  
  return character.xp >= nextLevelXP;
}

/**
 * Получить модификатор характеристики персонажа.
 * @param {Object} character - Персонаж.
 * @param {string} ability - Название характеристики (STR, DEX, etc.).
 * @returns {number}
 */
function getCharMod(character, ability) {
  return getModifier(character.abilities[ability] || 10);
}

/**
 * Рендерит HTML модального окна Level Up.
 * @param {Object} character - Персонаж.
 * @returns {string}
 */
export function render(character) {
  const currentLevel = character.level;
  const nextLevel = Math.min(currentLevel + 1, 20);
  const profBonus = getProficiencyBonus(nextLevel);
  
  // Получаем данные класса для определения Hit Die
  const hitDie = getCharacterHitDie(character.class);
  const conMod = getCharMod(character, 'CON');
  
  // Вычисляем HP gain
  const hpGain = getLevelUpHP(hitDie, conMod, true); // average
  
  // Для магов (wizard) - добавляем формулу получения слотов
  const spellSlots = getSpellSlotsForLevel(character.class, nextLevel);
  
  return `
    <div class="level-up-wizard">
      <button class="modal-close-btn" id="close-level-up">&times;</button>
      
      <div class="level-up-header">
        <div class="level-up-icon">🎉</div>
        <h2>Повышение Уровня!</h2>
        <p class="level-up-subtitle">${character.name} готов к ${nextLevel} уровню!</p>
      </div>
      
      <div class="level-up-preview">
        <div class="level-badge">${nextLevel}</div>
        <div class="level-stats-preview">
          <div class="preview-stat">
            <span class="preview-label">Бонус мастерства</span>
            <span class="preview-value">+${profBonus}</span>
          </div>
          <div class="preview-stat">
            <span class="preview-label">HP (среднее)</span>
            <span class="preview-value">+${hpGain}</span>
          </div>
          ${spellSlots > 0 ? `
          <div class="preview-stat">
            <span class="preview-label">Слоты заклинаний 1ур.</span>
            <span class="preview-value">+${spellSlots}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="level-up-options">
        <h3>Выберите способ расчёта HP:</h3>
        <div class="hp-options">
          <label class="hp-option-card">
            <input type="radio" name="hp-method" value="average" checked>
            <div class="hp-option-content">
              <div class="hp-option-icon">📊</div>
              <div class="hp-option-text">
                <strong>Среднее значение</strong>
                <span>+${hpGain} HP</span>
              </div>
            </div>
          </label>
          <label class="hp-option-card">
            <input type="radio" name="hp-method" value="roll">
            <div class="hp-option-content">
              <div class="hp-option-icon">🎲</div>
              <div class="hp-option-text">
                <strong>Бросок кости</strong>
                <span>~+${Math.floor(hitDie / 2) + 1} - ${hitDie + conMod} HP</span>
              </div>
            </div>
          </label>
        </div>
      </div>
      
      ${nextLevel === 4 || nextLevel === 8 || nextLevel === 12 || nextLevel === 16 || nextLevel === 19 ? `
      <div class="asi-reminder">
        <div class="asi-icon">✨</div>
        <div class="asi-text">
          <strong>Возможность улучшения характеристик!</strong>
          <p>На этом уровне вы можете повысить одну или две характеристики на +2 (или одну на +1 дважды).</p>
        </div>
      </div>
      ` : ''}
      
      <div class="level-up-actions">
        <button id="btn-confirm-level-up" class="btn-glow-gold" data-hp-method="average">
          ⚔️ Подтвердить Повышение
        </button>
      </div>
    </div>
  `;
}

/**
 * Открывает модальное окно Level Up.
 * @param {Object} character - Персонаж (опционально, по умолчанию активный).
 */
export function open(character) {
  const char = character || getState().activeCharacterId 
    ? getState().characters.find(c => c.id === getState().activeCharacterId)
    : null;
  
  if (!char) {
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: '⚠️ Персонаж не найден', duration: 3000 }
    }));
    return;
  }
  
  if (!canLevelUp(char)) {
    const nextLevelXP = XP_TABLE[char.level]?.xp || 0;
    const needed = nextLevelXP - char.xp;
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: `⚠️ Недостаточно XP! Нужно ещё ${needed} опыта.`, duration: 4000 }
    }));
    return;
  }
  
  const modal = $('#modal-content');
  modal.innerHTML = render(char);
  
  const overlay = $('#modal-overlay');
  overlay.classList.add('active');
  
  bindModal(char);
}

/**
 * Привязывает обработчики к модальному окну.
 * @param {Object} character - Персонаж.
 */
function bindModal(character) {
  const container = $('#modal-content');
  
  // Закрытие
  const closeBtn = $('#close-level-up', container);
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }
  
  // Выбор метода HP
  const hpOptions = $$('input[name="hp-method"]', container);
  hpOptions.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const confirmBtn = $('#btn-confirm-level-up');
      if (confirmBtn) {
        confirmBtn.dataset.hpMethod = e.target.value;
      }
    });
  });
  
  // Подтверждение
  const confirmBtn = $('#btn-confirm-level-up', container);
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const hpMethod = confirmBtn.dataset.hpMethod || 'average';
      confirmLevelUp(character, hpMethod);
    });
  }
}

/**
 * Подтверждает повышение уровня.
 * @param {Object} character - Персонаж.
 * @param {string} hpMethod - Метод расчёта HP ('average' или 'roll').
 */
function confirmLevelUp(character, hpMethod) {
  const hitDie = getCharacterHitDie(character.class);
  const conMod = getModifier(character.abilities.CON);
  
  // Вычисляем HP gain
  let hpGain;
  if (hpMethod === 'roll') {
    hpGain = getLevelUpHP(hitDie, conMod, false);
  } else {
    hpGain = getLevelUpHP(hitDie, conMod, true);
  }
  
  // Обновляем персонажа
  const updatedChar = {
    ...character,
    level: character.level + 1,
    hp: {
      ...character.hp,
      max: character.hp.max + hpGain,
      current: character.hp.current + hpGain // также восстанавливаем текущее HP
    }
  };
  
  // Обновляем слоты заклинаний если applicable
  const spellSlots = getSpellSlotsForLevel(character.class, updatedChar.level);
  if (spellSlots > 0 && updatedChar.spellSlots) {
    updatedChar.spellSlots = {
      ...updatedChar.spellSlots,
      1: {
        ...updatedChar.spellSlots[1],
        max: spellSlots,
        current: spellSlots // восстанавливаем слоты
      }
    };
  }
  
  // Сбрасываем Death Saves при повышении уровня
  updatedChar.deathSaves = { successes: 0, failures: 0 };
  
  // Сохраняем
  saveCharacter(updatedChar);
  
  // Закрываем модалку
  close();
  
  // Показываем уведомление
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `🎉 ${character.name} теперь ${updatedChar.level} уровня! (+${hpGain} HP)`, duration: 5000 }
  }));
  
  // Запускаем конфетти!
  triggerConfetti();
}

/**
 * Закрывает модальное окно.
 */
export function close() {
  const overlay = $('#modal-overlay');
  const modal = $('#modal-content');
  if (overlay) overlay.classList.remove('active');
  if (modal) modal.innerHTML = '';
}

/**
 * Получает Hit Die класса.
 * @param {string} className - Название класса (русское).
 * @returns {number}
 */
function getCharacterHitDie(className) {
  const hitDiceMap = {
    'barbarian': 12,
    'fighter': 10,
    'paladin': 10,
    'ranger': 10,
    'bard': 8,
    'cleric': 8,
    'druid': 8,
    'monk': 8,
    'rogue': 8,
    'warlock': 8,
    'sorcerer': 6,
    'wizard': 6
  };
  
  const name = (className || '').toLowerCase();
  
  // Проверяем русские названия
  if (name.includes('варвар')) return 12;
  if (name.includes('воин') || name.includes('fighter')) return 10;
  if (name.includes('паладин') || name.includes('paladin')) return 10;
  if (name.includes('следопыт') || name.includes('ranger')) return 10;
  if (name.includes('бард') || name.includes('bard')) return 8;
  if (name.includes('жрец') || name.includes('cleric')) return 8;
  if (name.includes('друид') || name.includes('druid')) return 8;
  if (name.includes('монах') || name.includes('monk')) return 8;
  if (name.includes('плут') || name.includes('rogue')) return 8;
  if (name.includes('колдун') || name.includes('warlock')) return 8;
  if (name.includes('чародей') || name.includes('sorcerer')) return 6;
  if (name.includes('маг') || name.includes('wizard')) return 6;
  
  return 8; // default
}

/**
 * Получает количество слотов заклинаний 1-го уровня для класса.
 * @param {string} className - Название класса.
 * @param {number} level - Уровень.
 * @returns {number}
 */
function getSpellSlotsForLevel(className, level) {
  const name = (className || '').toLowerCase();
  
  // Классы с заклинаниями получают слоты
  const spellcasterClasses = [
    'bard', 'barbarian', 'cleric', 'druid', 'paladin', 'ranger',
    'sorcerer', 'warlock', 'wizard',
    'бард', 'жрец', 'друид', 'паладин', 'следопыт', 'чародей', 'колдун', 'маг'
  ];
  
  const isSpellcaster = spellcasterClasses.some(c => name.includes(c.toLowerCase()));
  if (!isSpellcaster) return 0;
  
  // Для половины заклинателей (ranger, paladin, bard, sorcerer)
  const halfCasters = ['ranger', 'paladin', 'bard', 'sorcerer', 'следопыт', 'паладин', 'бард', 'чародей'];
  const isHalfCaster = halfCasters.some(c => name.includes(c.toLowerCase()));
  
  // Маги и полные заклинатели
  const fullCasters = ['wizard', 'cleric', 'druid', 'warlock', 'маг', 'жрец', 'друид', 'колдун'];
  const isFullCaster = fullCasters.some(c => name.includes(c.toLowerCase()));
  
  if (isHalfCaster) {
    // Получают слоты только на 2, 3, 5, 6, 7, 9, 10 уровнях персонажа
    const halfCasterLevels = [2, 3, 5, 6, 7, 9, 10, 13, 17, 18, 19];
    if (halfCasterLevels.includes(level)) return 2;
    return 0;
  }
  
  if (isFullCaster) {
    // Получают слоты на 1+ уровне
    const slotTable = { 1: 2, 2: 3, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 };
    return slotTable[level] || 0;
  }
  
  return 0;
}