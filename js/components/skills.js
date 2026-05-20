/* ==========================================================================
   D&D 5e Помощник Новичка — Skills Component (Навыки)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$ } from '../utils.js';
import { getModifier, getProficiencyBonus, SKILLS_DATA } from '../rules/index.js';
import { rollWithMod } from '../dice.js';

// Skills grouped by ability
const SKILLS_BY_ABILITY = {
  STR: ['Атлетика'],
  DEX: ['Акробатика', 'Ловкость рук', 'Скрытность'],
  INT: ['Магия', 'История', 'Расследование', 'Природа', 'Религия'],
  WIS: ['Уход за животными', 'Проницательность', 'Медицина', 'Восприятие', 'Выживание'],
  CHA: ['Обман', 'Запугивание', 'Выступление', 'Убеждение']
};

const ABILITY_NAMES = {
  STR: 'Сила', DEX: 'Ловкость', CON: 'Телосложение',
  INT: 'Интеллект', WIS: 'Мудрость', CHA: 'Харизма'
};

/**
 * Рендерит HTML блока навыков.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const showHelp = state.showHelp !== false;
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  const characterSkills = character.skills || [];
  const savingThrows = character.savingThrows || [];
  const abilities = character.abilities || {};
  
  // Build saving throws section
  const savingThrowsHTML = Object.entries(SKILLS_BY_ABILITY).map(([ability, skills]) => {
    const mod = getModifier(abilities[ability] || 10);
    const hasSaveProf = savingThrows.includes(ability);
    const totalMod = hasSaveProf ? mod + proficiencyBonus : mod;
    
    return `
      <div class="skill-row-item" data-ability="${ability}" ${showHelp ? 'title="Бросок спасброска"' : ''}>
        <div class="skill-row-item-left">
          <span class="prof-dot-circle ${hasSaveProf ? 'active' : ''}"></span>
          <span class="skill-row-name-text">${ABILITY_NAMES[ability]}</span>
        </div>
        <span class="skill-row-mod-val">${formatModifier(totalMod)}</span>
      </div>
    `;
  }).join('');
  
  // Build all skills
  const allSkillsHTML = Object.values(SKILLS_BY_ABILITY).flat().map(skillName => {
    const skillData = SKILLS_DATA.find(s => s.name === skillName);
    if (!skillData) return '';
    
    const abilityMod = getModifier(abilities[skillData.ability] || 10);
    const hasProf = characterSkills.includes(skillName);
    const totalMod = hasProf ? abilityMod + proficiencyBonus : abilityMod;
    
    // Get short ability name for display
    const abilityShort = {
      STR: 'СИЛ', DEX: 'ЛОВ', INT: 'ИНТ', WIS: 'МДР', CHA: 'ХАР'
    }[skillData.ability] || '';
    
    return `
      <div class="skill-row-item" data-skill="${skillName}" ${showHelp ? `title="Бросок навыка ${skillName}"` : ''}>
        <div class="skill-row-item-left">
          <span class="prof-dot-circle ${hasProf ? 'active' : ''}"></span>
          <span class="skill-row-name-text">
            ${skillName}
            <span>(${abilityShort})</span>
          </span>
        </div>
        <span class="skill-row-mod-val">${formatModifier(totalMod)}</span>
      </div>
    `;
  }).join('');
  
  // Passive Perception
  const perceptionMod = getModifier(abilities.WIS || 10);
  const hasPerception = characterSkills.includes('Восприятие');
  const passivePerception = 10 + (hasPerception ? perceptionMod + proficiencyBonus : perceptionMod);
  
  return `
    <div class="skills-saving-layout">
      <!-- Saving Throws -->
      <div>
        <h4 class="sheet-card-title" style="margin-bottom: 10px;">🛡️ Спасброски</h4>
        <div class="skills-vertical-list">
          ${savingThrowsHTML}
        </div>
      </div>
      
      <!-- Skills -->
      <div>
        <h4 class="sheet-card-title" style="margin-bottom: 10px;">🎯 Навыки</h4>
        <div class="skills-vertical-list">
          ${allSkillsHTML}
        </div>
        <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-secondary);">👁️ Пассивное Восприятие</span>
          <span style="font-family: var(--font-display); font-weight: 700; color: var(--accent-gold);">${passivePerception}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку навыков.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Saving throws roll
  const saveItems = $$('.skill-row-item[data-ability]', container);
  saveItems.forEach(item => {
    item.addEventListener('click', () => {
      const ability = item.dataset.ability;
      const character = getActiveCharacter();
      if (!character) return;
      
      const mod = getModifier(character.abilities[ability]);
      const proficiencyBonus = getProficiencyBonus(character.level);
      const hasSaveProf = character.savingThrows?.includes(ability);
      const totalMod = hasSaveProf ? mod + proficiencyBonus : mod;
      
      rollWithMod(20, totalMod, `${ABILITY_NAMES[ability]} (Спасбросок)`);
    });
  });
  
  // Skills roll
  const skillItems = $$('.skill-row-item[data-skill]', container);
  skillItems.forEach(item => {
    item.addEventListener('click', () => {
      const skillName = item.dataset.skill;
      const character = getActiveCharacter();
      if (!character) return;
      
      const skillData = SKILLS_DATA.find(s => s.name === skillName);
      if (!skillData) return;
      
      const abilityMod = getModifier(character.abilities[skillData.ability]);
      const proficiencyBonus = getProficiencyBonus(character.level);
      const hasProf = character.skills?.includes(skillName);
      const totalMod = hasProf ? abilityMod + proficiencyBonus : abilityMod;
      
      rollWithMod(20, totalMod, skillName);
    });
  });
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