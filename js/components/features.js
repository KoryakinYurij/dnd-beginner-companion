/* ==========================================================================
   D&D 5e Помощник Новичка — Компонент: Черты Персонажа (Features)
   ========================================================================== */

import { CLASSES_DATA, RACES_DATA, BACKGROUNDS_DATA } from '../rules/index.js';
import { getActiveCharacter } from '../state.js';
import { $, $$ } from '../utils.js';

/**
 * Собирает все фичи персонажа из разных источников.
 * @param {Object} character - Данные персонажа.
 * @returns {Array} Массив объектов фич.
 */
function collectAllFeatures(character) {
  const features = [];
  const level = character.level || 1;

  // Фичи класса (от 1 до текущего уровня)
  const classData = CLASSES_DATA.find(c => c.name === character.class);
  if (classData && classData.features) {
    for (let lvl = 1; lvl <= 20; lvl++) {
      const lvlFeatures = classData.features[lvl];
      if (lvlFeatures) {
        lvlFeatures.forEach(feature => {
          features.push({
            name: feature.name,
            nameEn: feature.nameEn,
            source: 'Класс',
            sourceKey: 'class',
            desc: feature.desc,
            level: lvl,
            locked: lvl > level
          });
        });
      }
    }
  }

  // Фичи расы
  const raceData = RACES_DATA.find(r => r.name === character.race);
  if (raceData && raceData.traits) {
    raceData.traits.forEach(trait => {
      features.push({
        name: trait.name,
        nameEn: trait.nameEn,
        source: 'Раса',
        sourceKey: 'race',
        desc: trait.desc,
        level: null,
        locked: false
      });
    });
  }

  // Фичи предыстории
  const bgData = BACKGROUNDS_DATA.find(b => b.name === character.background);
  if (bgData) {
    features.push({
      name: bgData.feature,
      nameEn: bgData.feature,
      source: 'Предыстория',
      sourceKey: 'background',
      desc: bgData.featureDesc,
      level: null,
      locked: false
    });
  }

  return features;
}

/**
 * Рендерит HTML-разметку компонента Features.
 * @returns {string} HTML-строка.
 */
export function render() {
  const character = getActiveCharacter();
  if (!character) {
    return '<div class="sheet-card"><div class="sheet-card-title">Черты персонажа</div><p style="color: var(--text-muted)">Выберите персонажа для просмотра черт.</p></div>';
  }

  const allFeatures = collectAllFeatures(character);
  const level = character.level || 1;

  // Сортируем: сначала доступные (разблокированные), потом заблокированные
  // Внутри групп сортируем по уровню
  allFeatures.sort((a, b) => {
    if (a.locked !== b.locked) return a.locked ? 1 : -1;
    if (a.level !== b.level) return (a.level || 0) - (b.level || 0);
    return a.source.localeCompare(b.source);
  });

  const featuresListHtml = allFeatures.map(feature => {
    const lockedClass = feature.locked ? 'feature-locked' : '';
    const lockedBadge = feature.locked
      ? `<span class="feature-level-badge">Уровень ${feature.level}</span>`
      : '';

    return `
      <div class="feature-accordion-item ${lockedClass}" data-feature-source="${feature.sourceKey}" data-level="${feature.level || ''}">
        <div class="feature-accordion-header" data-accordion-toggle>
          <div class="feature-header-left">
            <span class="feature-source-badge badge-${feature.sourceKey}">${feature.source}</span>
            <span class="feature-name">${feature.name}</span>
          </div>
          <div class="feature-header-right">
            ${lockedBadge}
            <span class="accordion-arrow">▼</span>
          </div>
        </div>
        <div class="feature-accordion-desc" data-accordion-content>
          <p class="feature-original-name">${feature.nameEn}</p>
          ${feature.locked ? `<p class="feature-locked-msg"><em>Откроется на уровне ${feature.level}</em></p>` : ''}
          <p class="feature-description">${feature.desc}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="sheet-card features-card">
      <div class="sheet-card-title">
        <span>Черты персонажа</span>
        <div class="features-filter-tabs">
          <button class="filter-btn active" data-filter="all">Все</button>
          <button class="filter-btn" data-filter="class">Класс</button>
          <button class="filter-btn" data-filter="race">Раса</button>
          <button class="filter-btn" data-filter="background">Предыстория</button>
        </div>
      </div>
      <div class="features-accordion-list" data-features-container>
        ${featuresListHtml}
      </div>
      ${allFeatures.length === 0 ? '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Черты не найдены.</p>' : ''}
    </div>
  `;
}

/**
 * Привязывает обработчики событий к DOM-элементам.
 * @param {HTMLElement} container - Родительский контейнер.
 */
export function bind(container) {
  const $container = container || document;

  // Обработчик аккордеона
  $$('[data-accordion-toggle]', $container).forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.feature-accordion-item');
      if (item.classList.contains('feature-locked')) return;

      const content = item.querySelector('[data-accordion-content]');
      const isActive = item.querySelector('.feature-accordion-header.active');

      // Закрываем все остальные
      $$('.feature-accordion-item', $container).forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.querySelector('.feature-accordion-header')?.classList.remove('active');
          const otherContent = otherItem.querySelector('[data-accordion-content]');
          if (otherContent) otherContent.classList.remove('active');
        }
      });

      // Переключаем текущий
      header.classList.toggle('active');
      content.classList.toggle('active');
    });
  });

  // Обработчик фильтра
  $$('.filter-btn', $container).forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Обновляем активную кнопку
      $$('.filter-btn', $container).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Фильтруем фичи
      $$('.feature-accordion-item', $container).forEach(item => {
        if (filter === 'all') {
          item.style.display = '';
        } else {
          const source = item.dataset.featureSource;
          item.style.display = source === filter ? '' : 'none';
        }
      });
    });
  });
}