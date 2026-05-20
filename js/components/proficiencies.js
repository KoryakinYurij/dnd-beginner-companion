/* ==========================================================================
   D&D 5e Помощник Новичка — Компонент: Владения Персонажа (Proficiencies)
   ========================================================================== */

import { CLASSES_DATA, RACES_DATA, BACKGROUNDS_DATA } from '../rules/index.js';
import { getActiveCharacter } from '../state.js';

/**
 * Собирает все владения персонажа из разных источников.
 * @param {Object} character - Данные персонажа.
 * @returns {Object} Объект с владениями по категориям.
 */
function collectProficiencies(character) {
  const proficiencies = {
    armor: [],
    weapons: [],
    tools: [],
    languages: []
  };

  // Владения из класса
  const classData = CLASSES_DATA.find(c => c.name === character.class);
  if (classData) {
    if (classData.armorProficiencies) {
      proficiencies.armor.push(...classData.armorProficiencies);
    }
    if (classData.weaponProficiencies) {
      proficiencies.weapons.push(...classData.weaponProficiencies);
    }
    if (classData.toolProficiencies && classData.toolProficiencies.length > 0) {
      proficiencies.tools.push(...classData.toolProficiencies);
    }
  }

  // Владения из расы
  const raceData = RACES_DATA.find(r => r.name === character.race);
  if (raceData) {
    if (raceData.languages) {
      proficiencies.languages.push(...raceData.languages);
    }
    // Расовые трейты могут включать дополнительные владения
    if (raceData.traits) {
      raceData.traits.forEach(trait => {
        // Оружейная тренировка дворфов/эльфов
        if (trait.nameEn === 'Dwarf Weapon Training' || trait.nameEn === 'Elf Weapon Training') {
          // Эти трейты уже учтены в базовых данных, просто пропускаем
        }
        if (trait.nameEn === 'Dwarven Armor Training') {
          if (!proficiencies.armor.includes('Легкие доспехи')) {
            proficiencies.armor.push('Легкие доспехи');
          }
          if (!proficiencies.armor.includes('Средние доспехи')) {
            proficiencies.armor.push('Средние доспехи');
          }
        }
      });
    }
  }

  // Владения из предыстории
  const bgData = BACKGROUNDS_DATA.find(b => b.name === character.background);
  if (bgData) {
    if (bgData.toolProficiencies && bgData.toolProficiencies.length > 0) {
      proficiencies.tools.push(...bgData.toolProficiencies);
    }
    if (bgData.languages && bgData.languages.length > 0) {
      proficiencies.languages.push(...bgData.languages);
    }
  }

  // Убираем дубликаты
  Object.keys(proficiencies).forEach(key => {
    proficiencies[key] = [...new Set(proficiencies[key])];
  });

  return proficiencies;
}

/**
 * Рендерит HTML-разметку компонента Proficiencies.
 * @returns {string} HTML-строка.
 */
export function render() {
  const character = getActiveCharacter();
  if (!character) {
    return '<div class="sheet-card"><div class="sheet-card-title">Владения</div><p style="color: var(--text-muted)">Выберите персонажа для просмотра владений.</p></div>';
  }

  const profs = collectProficiencies(character);

  // Цветовые классы для категорий
  const categoryColors = {
    armor: 'chip-gold',
    weapons: 'chip-red',
    tools: 'chip-blue',
    languages: 'chip-green'
  };

  // Иконки для категорий
  const categoryIcons = {
    armor: '🛡️',
    weapons: '⚔️',
    tools: '🔧',
    languages: '💬'
  };

  // Названия категорий
  const categoryNames = {
    armor: 'Броня',
    weapons: 'Оружие',
    tools: 'Инструменты',
    languages: 'Языки'
  };

  const categoriesHtml = Object.keys(profs).map(category => {
    const items = profs[category];
    const chipsHtml = items.length > 0
      ? items.map(item => `<span class="prof-chip-item">${item}</span>`).join('')
      : '<span class="prof-empty-text">—</span>';

    return `
      <div class="prof-box-category">
        <div class="prof-box-category-title">
          <span class="prof-cat-icon">${categoryIcons[category]}</span>
          ${categoryNames[category]}
        </div>
        <div class="prof-chips-wrapper">
          ${chipsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="sheet-card proficiencies-card">
      <div class="sheet-card-title">
        <span>Владения</span>
      </div>
      <div class="proficiencies-list-grid">
        ${categoriesHtml}
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики событий к DOM-элементам (если требуются).
 * @param {HTMLElement} container - Родительский контейнер.
 */
export function bind(container) {
  // На данный момент статический компонент, обработчики не требуются.
  // Метод оставлен для консистентности интерфейса.
}