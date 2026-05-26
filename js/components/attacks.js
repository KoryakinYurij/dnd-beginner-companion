/* ==========================================================================
   D&D 5e Помощник Новичка — Attacks Component (Атаки)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$, escapeHtml, formatModifier } from '../utils.js';
import { getModifier, getProficiencyBonus, WEAPONS_DATA } from '../rules/index.js';
import { rollWithMod, roll } from '../dice.js';

/**
 * Рендерит HTML блока атак.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const showHelp = state.showHelp !== false;
  const attacks = character.attacks || [];
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  const abilities = character.abilities || {};
  
  const attacksListHtml = attacks.map((attack, index) => {
    const attackMod = getModifier(abilities[attack.ability || 'STR'] || 10);
    const toHit = attackMod + (attack.proficient ? proficiencyBonus : 0);

    return `
      <div class="attack-row-card" data-index="${index}">
        <div class="attack-row-left-info">
          <span class="attack-row-weapon-name">${escapeHtml(attack.name)}</span>
          <span class="attack-row-weapon-props">${attack.damage || ''} ${attack.damageType || ''}</span>
        </div>
        <div class="attack-row-actions-group">
          <button class="attack-btn-action btn-secondary" data-action="roll-attack" data-index="${index}">
            ${formatModifier(toHit)} атака
          </button>
          <button class="attack-btn-action" data-action="roll-damage" data-index="${index}" title="Бросок урона">
            💥 ${attack.damage || '1d6'}
          </button>
          <button class="attack-btn-action" data-action="delete-attack" data-index="${index}" title="Удалить">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="attacks-list-vertical">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">⚔️ Атаки</h3>
        <button id="btn-add-attack" class="btn-primary" style="font-size: 0.85rem; padding: 6px 12px;">+ Добавить</button>
      </div>
      
      ${attacks.length > 0 ? attacksListHtml : `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
        <p>У вас пока нет атак. Добавьте оружие!</p>
      </div>
      `}
      
      ${showHelp ? `
      <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">Быстрое добавление:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${WEAPONS_DATA.slice(0, 6).map(w => `
            <button class="btn-secondary quick-weapon-btn" data-weapon="${escapeHtml(w.name)}" style="font-size: 0.75rem; padding: 4px 8px;">
              ${w.name}
            </button>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку атак.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Roll attack buttons
  const rollBtns = $$('[data-action="roll-attack"]', container);
  rollBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      rollAttack(index);
    });
  });
  
  // Delete attack buttons
  const deleteBtns = $$('[data-action="delete-attack"]', container);
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteAttack(index);
    });
  });

  // Roll damage buttons
  const damageBtns = $$('[data-action="roll-damage"]', container);
  damageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      rollDamage(index);
    });
  });
  
  // Add attack button
  const addBtn = $('#btn-add-attack', container);
  if (addBtn) {
    addBtn.addEventListener('click', () => showAddAttackModal());
  }
  
  // Quick add weapons
  const quickBtns = $$('.quick-weapon-btn', container);
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const weaponName = btn.dataset.weapon;
      addQuickWeapon(weaponName);
    });
  });
}

/**
 * Бросает атаку.
 * @param {number} index - Индекс атаки в массиве.
 */
function rollAttack(index) {
  const character = getActiveCharacter();
  if (!character) return;
  
  const attack = character.attacks?.[index];
  if (!attack) return;
  
  const abilities = character.abilities || {};
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  const attackMod = getModifier(abilities[attack.ability || 'STR'] || 10);
  const toHit = attackMod + (attack.proficient ? proficiencyBonus : 0);
  
  rollWithMod(20, toHit, attack.name);
}

/**
 * Бросает урон оружия.
 * @param {number} index - Индекс атаки в массиве.
 */
function rollDamage(index) {
  const character = getActiveCharacter();
  if (!character) return;

  const attack = character.attacks?.[index];
  if (!attack) return;

  const abilities = character.abilities || {};
  const attackMod = getModifier(abilities[attack.ability || 'STR'] || 10);

  // Парсим формулу урона, например "1d8" или "2d6+3"
  const damageFormula = attack.damage || '1d6';
  const match = damageFormula.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: `⚠️ Некорректная формула урона: ${damageFormula}` }
    }));
    return;
  }

  const numDice = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const fixedBonus = match[3] ? parseInt(match[3]) : 0;

  // Бросаем кубики
  const rolls = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(roll(sides));
  }

  const diceSum = rolls.reduce((a, b) => a + b, 0);

  // Для фехтовального оружия добавляем модификатор характеристики к урону
  let abilityBonus = 0;
  if (attack.ability === 'DEX') {
    abilityBonus = attackMod;
  }

  const totalDamage = diceSum + fixedBonus + abilityBonus;
  const formulaText = `${numDice}d${sides}${fixedBonus !== 0 ? (fixedBonus >= 0 ? '+' : '') + fixedBonus : ''}${abilityBonus !== 0 ? (abilityBonus >= 0 ? '+' : '') + abilityBonus + ' (характ.)' : ''}`;

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `💥 Урон "${attack.name}": ${formulaText} = [${rolls.join(', ')}] = **${totalDamage}**`, duration: 4000 }
  }));
}

/**
 * Удаляет атаку.
 * @param {number} index - Индекс атаки.
 */
function deleteAttack(index) {
  const character = getActiveCharacter();
  if (!character) return;
  
  const attacks = [...(character.attacks || [])];
  attacks.splice(index, 1);
  
  const updatedChars = getState().characters.map(c => 
    c.id === character.id ? { ...c, attacks } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Показывает модалку для добавления атаки.
 */
function showAddAttackModal() {
  const character = getActiveCharacter();
  if (!character) return;
  
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  const dexMod = getModifier(character.abilities?.DEX || 10);
  const strMod = getModifier(character.abilities?.STR || 10);
  
  const modal = $('#modal-content');
  modal.innerHTML = `
    <div class="add-attack-modal" style="max-width: 500px;">
      <button class="modal-close-btn" id="close-attack-modal">&times;</button>
      <h2>⚔️ Добавить Атаку</h2>
      
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Название:</label>
        <input type="text" id="attack-name" style="width: 100%;" placeholder="Например: Длинный меч">
      </div>
      
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Урон (например 1d8):</label>
        <input type="text" id="attack-damage" style="width: 100%;" placeholder="1d8">
      </div>
      
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div class="form-group" style="flex: 1;">
          <label style="display: block; margin-bottom: 5px;">Характеристика:</label>
          <select id="attack-ability" style="width: 100%;">
            <option value="STR">Сила (${formatModifier(strMod)})</option>
            <option value="DEX" selected>Ловкость (${formatModifier(dexMod)})</option>
          </select>
        </div>
        <div class="form-group" style="flex: 1;">
          <label style="display: block; margin-bottom: 5px;">Владение:</label>
          <select id="attack-proficient" style="width: 100%;">
            <option value="true">Да (+${proficiencyBonus})</option>
            <option value="false">Нет</option>
          </select>
        </div>
      </div>
      
      <button id="btn-confirm-add-attack" class="btn-glow-gold" style="width: 100%;">Добавить</button>
    </div>
  `;
  
  $('#modal-overlay').classList.add('active');
  
  $('#close-attack-modal')?.addEventListener('click', () => {
    $('#modal-overlay').classList.remove('active');
    $('#modal-content').innerHTML = '';
  });
  
  $('#btn-confirm-add-attack')?.addEventListener('click', () => {
    const name = $('#attack-name')?.value?.trim();
    const ability = $('#attack-ability')?.value || 'DEX';
    const proficient = $('#attack-proficient')?.value === 'true';
    const damage = $('#attack-damage')?.value?.trim() || '1d6';
    
    if (name) {
      addAttack({ name, ability, proficient, damage });
      $('#modal-overlay').classList.remove('active');
      $('#modal-content').innerHTML = '';
    }
  });
}

/**
 * Добавляет атаку персонажу.
 * @param {Object} attack - Данные атаки.
 */
function addAttack(attack) {
  const character = getActiveCharacter();
  if (!character) return;
  
  const attacks = [...(character.attacks || []), attack];
  
  const updatedChars = getState().characters.map(c => 
    c.id === character.id ? { ...c, attacks } : c
  );
  setState({ characters: updatedChars });
  
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `⚔️ "${attack.name}" добавлена!` }
  }));
}

/**
 * Быстро добавляет оружие из базы.
 * @param {string} weaponName - Название оружия.
 */
function addQuickWeapon(weaponName) {
  const weapon = WEAPONS_DATA.find(w => w.name === weaponName);
  if (!weapon) return;
  
  const character = getActiveCharacter();
  if (!character) return;
  
  let ability = 'STR';
  if (weapon.properties?.includes('Finesse') || weapon.properties?.includes('Ranged')) {
    ability = 'DEX';
  }
  
  addAttack({
    name: weapon.name,
    ability,
    proficient: true,
    damage: weapon.damage
  });
}
