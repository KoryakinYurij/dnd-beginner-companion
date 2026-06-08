/* ==========================================================================
   D&D 5e Помощник Новичка — Мастер создания персонажа (Character Wizard)
   ========================================================================== */

import { RACES_DATA, CLASSES_DATA, BACKGROUNDS_DATA, getModifier, getStartingHP, calculateDefaultAC, SKILLS_DATA, SPELLS_DATA, WEAPONS_DATA } from '../rules/index.js';
import { setState, saveCharacter, getState } from '../state.js';
import { $, $$, escapeHtml, generateId } from '../utils.js';
import { roll4d6DropLowest, playDiceSound } from '../dice.js';

// Стоимость характеристик в Point Buy
const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

/**
 * Рендерит разметку мастера создания персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(state) {
  const wizard = state.wizardData;
  if (!wizard) return '';

  const currentStep = wizard.step || 1;

  // Рендерим заголовок и степпер прогресса
  let stepperHtml = '';
  const steps = [
    { num: 1, label: 'Личность' },
    { num: 2, label: 'Класс' },
    { num: 3, label: 'Характеристики' },
    { num: 4, label: 'Навыки' },
    { num: 5, label: 'Итог' }
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  stepperHtml = `
    <div class="wizard-progress-bar">
      <div class="wizard-progress-fill" style="width: ${progressPercent}%;"></div>
      ${steps.map(s => {
        let cls = 'wizard-step-node';
        if (s.num === currentStep) cls += ' active';
        else if (s.num < currentStep) cls += ' completed';
        return `
          <div class="${cls}" data-step="${s.num}">
            ${s.num < currentStep ? '✓' : s.num}
            <span class="wizard-step-label">${s.label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Описание текущего шага и хелп-онбординг
  let stepTitle = '';
  let stepHelp = '';
  let stepContent = '';

  switch (currentStep) {
    case 1:
      stepTitle = 'Шаг 1: Личность и Раса';
      stepHelp = 'Выберите имя вашего искателя приключений, его расу и предысторию. Раса дает уникальные бонусы к характеристикам и расовые черты (например, зрение в темноте). Предыстория отражает жизнь героя до приключений и дает готовые навыки.';
      stepContent = renderStep1(wizard);
      break;
    case 2:
      stepTitle = 'Шаг 2: Класс';
      stepHelp = 'Класс — это призвание вашего героя. Он определяет его боевые способности, кость хитов (здоровье), спасброски и начальное снаряжение. Воин, Жрец и Плут помечены звездочкой ⭐ — они идеально подходят для новичков.';
      stepContent = renderStep2(wizard);
      break;
    case 3:
      stepTitle = 'Шаг 3: Характеристики (Ability Scores)';
      stepHelp = 'Характеристики определяют врожденные способности вашего героя. Вы можете распределить Стандартный Набор (15, 14, 13, 12, 10, 8), купить очки (Point Buy) или бросить кубики d6 (Roll 4d6 drop lowest). К этим значениям прибавляются расовые бонусы!';
      stepContent = renderStep3(wizard);
      break;
    case 4:
      stepTitle = 'Шаг 4: Навыки и Владения';
      stepHelp = 'Навыки отражают узкую специализацию вашего персонажа. Отметьте навыки, в которых вы хотите владеть (добавляется ваш Бонус Мастерства). Навыки, полученные от предыстории на Шаге 1, уже выбраны и заблокированы.';
      stepContent = renderStep4(wizard);
      break;
    case 5:
      stepTitle = 'Шаг 5: Итоговый обзор';
      stepHelp = 'Проверьте все параметры вашего персонажа. Если все верно, нажмите кнопку «Создать Персонажа!», и начнется ваше легендарное приключение!';
      stepContent = renderStep5(wizard);
      break;
  }

  const showHelp = state.showHelp;

  return `
    <div class="wizard-layout">
      <div class="wizard-header-wrapper">
        <div class="wizard-title-row">
          <h2>${stepTitle}</h2>
          <button id="btn-wizard-cancel" class="btn-danger">❌ Выйти в меню</button>
        </div>
        ${stepperHtml}
        ${showHelp ? `
          <div class="card help-onboarding-panel" style="margin-top: 1.5rem; border-left: 4px solid var(--accent-gold); background: rgba(229,186,83,0.03);">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="font-size: 1.3rem;">💡</span>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${stepHelp}</p>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="wizard-step-content">
        ${stepContent}
      </div>
      
      <div class="wizard-footer">
        <button id="btn-wizard-prev" class="btn-secondary" ${currentStep === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>⬅️ Назад</button>
        <button id="btn-wizard-next" class="btn-glow-gold" ${!canGoNext(wizard) ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
          ${currentStep === 5 ? '⚔️ Создать Персонажа!' : 'Далее ➡️'}
        </button>
      </div>
    </div>
  `;
}

// Рендер Шага 1: Личность и Раса
function renderStep1(wizard) {
  const racesHtml = RACES_DATA.map(r => {
    const isSelected = wizard.race === r.name;
    const bonusText = Object.entries(r.abilityBonuses).map(([stat, val]) => `${stat} +${val}`).join(', ');
    return `
      <div class="selection-card race-card ${isSelected ? 'selected' : ''}" data-race="${r.name}">
        <div class="selection-card-header">
          <div class="selection-card-icon">${r.icon}</div>
          <div class="selection-card-title">
            <h4>${r.name}</h4>
            <p>${r.nameEn}</p>
          </div>
        </div>
        <div class="selection-card-badge">${bonusText}</div>
        <div class="selection-card-desc">${r.description}</div>
        <div style="margin-top: auto; font-size: 0.75rem; color: var(--accent-gold);">
          <strong>Трейты:</strong> ${r.traits.map(t => t.name).join(', ')}
        </div>
      </div>
    `;
  }).join('');

  const bgHtml = BACKGROUNDS_DATA.map(b => {
    const isSelected = wizard.background === b.name;
    return `
      <div class="selection-card bg-card ${isSelected ? 'selected' : ''}" data-bg="${b.name}">
        <div class="selection-card-header">
          <div class="selection-card-icon">📜</div>
          <div class="selection-card-title">
            <h4>${b.name}</h4>
            <p>${b.nameEn}</p>
          </div>
        </div>
        <div class="selection-card-desc">${b.description}</div>
        <div style="margin-top: auto; font-size: 0.75rem; color: var(--accent-green);">
          <strong>Навыки:</strong> ${b.skillProficiencies.join(', ')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="form-group-custom">
          <label for="wizard-name">Имя Героя</label>
          <input type="text" id="wizard-name" value="${escapeHtml(wizard.name)}" placeholder="Введите имя вашего героя..." maxlength="30">
        </div>
        <div class="form-group-custom">
          <label for="wizard-gender">Пол</label>
          <select id="wizard-gender">
            <option value="Мужской" ${wizard.gender === 'Мужской' ? 'selected' : ''}>Мужской 👨</option>
            <option value="Женский" ${wizard.gender === 'Женский' ? 'selected' : ''}>Женский 👩</option>
            <option value="Андрогинный" ${wizard.gender === 'Андрогинный' ? 'selected' : ''}>Другой 🎭</option>
          </select>
        </div>
      </div>

      <div>
        <h3 class="section-title-parchment" style="font-size: 1.3rem;">1. Выберите Расу</h3>
        <div class="cards-selection-grid">
          ${racesHtml}
        </div>
      </div>

      <div>
        <h3 class="section-title-parchment" style="font-size: 1.3rem;">2. Выберите Предысторию</h3>
        <div class="cards-selection-grid">
          ${bgHtml}
        </div>
      </div>
    </div>
  `;
}

// Рендер Шага 2: Класс
function renderStep2(wizard) {
  const classesHtml = CLASSES_DATA.map(c => {
    const isSelected = wizard.class === c.name;
    // Рекомендуемые классы
    const isRecommended = ['Воин', 'Жрец', 'Плут'].includes(c.name);
    return `
      <div class="selection-card class-card ${isSelected ? 'selected' : ''}" data-class="${c.name}">
        <div class="selection-card-header">
          <div class="selection-card-icon">${c.icon || '⚔️'}</div>
          <div class="selection-card-title">
            <h4>${c.name}</h4>
            <p>${c.nameEn}</p>
          </div>
        </div>
        ${isRecommended ? `<div class="selection-card-badge">⭐ Новичкам</div>` : ''}
        <div class="selection-card-desc">${c.description}</div>
        <div style="margin-top: auto; font-size: 0.75rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
          <div><strong>Кость хитов:</strong> d${c.hitDie}</div>
          <div><strong>Спасброски:</strong> ${c.savingThrows.join(', ')}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div>
      <h3 class="section-title-parchment" style="font-size: 1.3rem;">Выберите Класс</h3>
      <div class="cards-selection-grid">
        ${classesHtml}
      </div>
    </div>
  `;
}

// Рендер Шага 3: Характеристики
function renderStep3(wizard) {
  const race = RACES_DATA.find(r => r.name === wizard.race);
  const bonuses = race ? race.abilityBonuses : {};

  // Генерация HTML способов выбора
  const method = wizard.statsMethod || 'array';
  const methods = [
    { id: 'array', label: 'Стандартный набор (Array)' },
    { id: 'point', label: 'Покупка очков (Point Buy)' },
    { id: 'roll', label: 'Броски кубиков (Roll)' }
  ];

  const methodTabs = `
    <div class="stat-generation-choice">
      ${methods.map(m => {
        const active = m.id === method;
        return `<button class="${active ? 'btn-primary' : 'btn-secondary'} btn-method-tab" data-method="${m.id}">${m.label}</button>`;
      }).join('')}
    </div>
  `;

  // Рендерим левую сетку присвоения
  const statsList = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const statsLabels = { STR: 'Сила (STR)', DEX: 'Ловкость (DEX)', CON: 'Телосложение (CON)', INT: 'Интеллект (INT)', WIS: 'Мудрость (WIS)', CHA: 'Харизма (CHA)' };

  let leftPanel = '';
  if (method === 'array' || method === 'roll') {
    leftPanel = `
      <div class="stat-assignment-grid">
        ${statsList.map(s => {
          const val = wizard.assignedStats[s];
          const bonus = bonuses[s] || 0;
          const total = val ? val + bonus : '';
          const mod = total !== '' ? getModifier(total) : '';
          const modText = mod !== '' ? (mod >= 0 ? `+${mod}` : `${mod}`) : '';
          
          return `
            <div class="stat-assignment-row">
              <div>
                <div class="stat-assignment-label">${statsLabels[s]}</div>
                <div class="stat-assignment-racial-bonus">${bonus > 0 ? `Расовый бонус: +${bonus}` : '&nbsp;'}</div>
              </div>
              <div class="stat-assignment-value-box">
                <div class="stat-assignment-value placeholder-val" data-stat="${s}">${val || '?'}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); width: 35px; text-align: center;">
                  ${bonus > 0 && val ? `(${val}+${bonus})` : ''}
                </div>
                <div class="stat-assignment-value" style="color: var(--accent-green); width: 45px; text-align: right;">
                  ${total ? `${total} [${modText}]` : ''}
                </div>
                ${val ? `<button class="btn-icon btn-reset-stat" data-stat="${s}" style="width: 28px; height: 28px; font-size: 0.75rem;">✕</button>` : `<span style="width:28px;"></span>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (method === 'point') {
    leftPanel = `
      <div class="stat-assignment-grid">
        ${statsList.map(s => {
          const score = wizard.pointBuy[s] || 8;
          const bonus = bonuses[s] || 0;
          const total = score + bonus;
          const mod = getModifier(total);
          const modText = mod >= 0 ? `+${mod}` : `${mod}`;
          const currentCost = POINT_BUY_COSTS[score];
          
          return `
            <div class="stat-assignment-row">
              <div>
                <div class="stat-assignment-label">${statsLabels[s]}</div>
                <div class="stat-assignment-racial-bonus">${bonus > 0 ? `Расовый бонус: +${bonus}` : '&nbsp;'}</div>
              </div>
              <div class="stat-assignment-value-box">
                <button class="btn-icon btn-pointbuy-dec" data-stat="${s}" style="width: 28px; height: 28px; font-size: 0.8rem;" ${score <= 8 ? 'disabled' : ''}>-</button>
                <div class="stat-assignment-value" style="width:30px;">${score}</div>
                <button class="btn-icon btn-pointbuy-inc" data-stat="${s}" style="width: 28px; height: 28px; font-size: 0.8rem;" ${score >= 15 || wizard.pointBuyRemaining < getPointIncrementCost(score) ? 'disabled' : ''}>+</button>
                <div style="font-size: 0.8rem; color: var(--text-muted); width: 45px; text-align: center;">
                  (Цена: ${currentCost})
                </div>
                <div class="stat-assignment-value" style="color: var(--accent-green); width: 45px; text-align: right;">
                  ${total} [${modText}]
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Правая панель пула
  let rightPanel = '';
  if (method === 'array') {
    rightPanel = `
      <div class="stat-pool-box">
        <h4 class="stat-pool-title">Пул значений</h4>
        <p style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-bottom: 12px;">Кликните на значение, затем выберите свободную характеристику слева.</p>
        <div class="stat-pool-values">
          ${wizard.statPool.map((val, idx) => {
            const isAssigned = Object.values(wizard.assignedStats).includes(val);
            // Если дублируются значения (например 10 и 10), нам нужно посчитать сколько раз оно назначено
            const assignedCount = Object.values(wizard.assignedStats).filter(v => v === val).length;
            const poolCount = wizard.statPool.filter(v => v === val).length;
            const isUsed = assignedCount >= poolCount;

            return `
              <div class="stat-pool-chip ${isUsed ? 'used' : ''} btn-pool-chip" data-val="${val}" data-idx="${idx}">
                ${val}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (method === 'point') {
    rightPanel = `
      <div class="stat-pool-box" style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
        <h4 class="stat-pool-title">Покупка Характеристик</h4>
        <div style="font-size: 2.8rem; font-family: var(--font-display); color: var(--accent-gold); font-weight: 900; margin: 15px 0;">
          ${wizard.pointBuyRemaining}
        </div>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">Осталось очков из 27</p>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 15px; line-height: 1.4;">
          Все характеристики начинают с 8.<br>
          Максимальное значение — 15.<br>
          Стоимость: 9-13 (по 1 очку за шаг), 14-15 (по 2 очка за шаг).
        </p>
      </div>
    `;
  } else if (method === 'roll') {
    const rolledCount = wizard.rolledStats.length;
    const allRolled = rolledCount >= 6;

    let rollPanelContent = '';
    if (!allRolled) {
      rollPanelContent = `
        <button id="btn-wizard-roll" class="btn-glow-gold" style="padding: 12px 24px; font-size: 1.1rem; width: 100%;">
          🎲 Бросить 4d6 (${rolledCount + 1}-й бросок)
        </button>
        <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-top: 10px;">Мы бросим 4 кубика d6 и сложим 3 наибольших значения.</p>
      `;
    } else {
      rollPanelContent = `
        <div style="display: flex; gap: 10px; width: 100%;">
          <button id="btn-wizard-reroll" class="btn-secondary" style="flex:1;">🔄 Перебросить всё</button>
        </div>
      `;
    }

    rightPanel = `
      <div class="stat-pool-box" style="display: flex; flex-direction: column; gap: 15px;">
        <h4 class="stat-pool-title">Броски Характеристик</h4>
        
        <div class="roll-engine-wizard-wrapper">
          <div class="roll-wizard-result-box" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; min-height: 50px;">
            ${wizard.rolledStats.map((val, idx) => {
              const assignedCount = Object.values(wizard.assignedStats).filter(v => v === val).length;
              const poolCount = wizard.rolledStats.filter(v => v === val).length;
              const isUsed = assignedCount >= poolCount;
              return `
                <div class="stat-pool-chip ${isUsed ? 'used' : ''} btn-pool-chip" data-val="${val}" data-idx="${idx}">
                  ${val}
                </div>
              `;
            }).join('')}
            ${Array.from({ length: 6 - rolledCount }).map(() => `
              <div class="stat-pool-chip" style="opacity: 0.15; border-style: dashed; border-color: var(--text-muted);">?</div>
            `).join('')}
          </div>
          
          ${rollPanelContent}
        </div>
      </div>
    `;
  }

  return `
    <div>
      ${methodTabs}
      <div class="ability-assigner-layout">
        ${leftPanel}
        ${rightPanel}
      </div>
    </div>
  `;
}

// Помощник: возвращает стоимость повышения характеристики на +1 в Point Buy
function getPointIncrementCost(currentScore) {
  if (currentScore < 13) return 1;
  return 2; // повышение с 13 до 14 и с 14 до 15 стоит 2 очка
}

// Рендер Шага 4: Навыки
function renderStep4(wizard) {
  const race = RACES_DATA.find(r => r.name === wizard.race);
  const cls = CLASSES_DATA.find(c => c.name === wizard.class);
  const bg = BACKGROUNDS_DATA.find(b => b.name === wizard.background);

  if (!cls) return '<p>Сначала выберите класс на Шаге 2!</p>';

  // Получаем список навыков от предыстории
  const bgSkills = bg ? bg.skillProficiencies : [];
  
  // Получаем количество доступных выборов навыков класса
  const picksAllowed = cls.numSkillPicks || 2;
  const currentPicks = wizard.skills.filter(s => !bgSkills.includes(s)).length;

  return `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: var(--radius-md);">
        <div>
          <h4>Выбор навыков класса ${cls.name}</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Выберите навыки из списка доступных для вашего класса.</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 1.8rem; font-family: var(--font-display); color: ${currentPicks === picksAllowed ? 'var(--accent-green)' : 'var(--accent-gold)'}; font-weight: 700;">
            ${currentPicks} / ${picksAllowed}
          </span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">выбрано навыков класса</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        ${SKILLS_DATA.map(s => {
          const isFromBg = bgSkills.includes(s.name);
          const isSelected = wizard.skills.includes(s.name);
          const isAllowedByClass = cls.skillChoices.includes(s.name);

          let checkboxState = '';
          let badgeText = '';
          let labelStyle = '';

          if (isFromBg) {
            checkboxState = 'checked disabled';
            badgeText = '<span style="font-size: 0.7rem; background: rgba(6,214,160,0.15); color: var(--accent-green); padding: 2px 6px; border-radius: var(--radius-sm); font-weight:700;">ОТ ПРЕДЫСТОРИИ</span>';
            labelStyle = 'color: var(--text-primary); cursor: not-allowed;';
          } else if (!isAllowedByClass) {
            checkboxState = 'disabled style="opacity: 0.35;"';
            labelStyle = 'color: var(--text-muted); cursor: not-allowed; opacity: 0.5;';
          } else {
            checkboxState = isSelected ? 'checked' : '';
            if (currentPicks >= picksAllowed && !isSelected) {
              checkboxState = 'disabled';
              labelStyle = 'color: var(--text-muted); opacity: 0.7;';
            }
          }

          return `
            <label class="selection-card" style="flex-direction: row; align-items: center; gap: 15px; padding: 12px 16px; ${labelStyle}">
              <input type="checkbox" class="wizard-skill-checkbox" data-skill="${s.name}" ${checkboxState} style="width: 20px; height: 20px; accent-color: var(--accent-gold);">
              <div style="flex-grow: 1;">
                <div style="font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                  ${s.name} <span style="font-size:0.75rem; color: var(--text-muted);">(${s.ability})</span>
                  ${badgeText}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${s.desc}</div>
              </div>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Рендер Шага 5: Итог
function renderStep5(wizard) {
  const race = RACES_DATA.find(r => r.name === wizard.race);
  const cls = CLASSES_DATA.find(c => c.name === wizard.class);
  const bg = BACKGROUNDS_DATA.find(b => b.name === wizard.background);

  const bonuses = race ? race.abilityBonuses : {};

  // Расчет финальных характеристик
  const finalStats = {};
  const method = wizard.statsMethod || 'array';

  ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(s => {
    const base = method === 'point' ? (wizard.pointBuy[s] || 8) : (wizard.assignedStats[s] || 10);
    const bonus = bonuses[s] || 0;
    finalStats[s] = base + bonus;
  });

  const conMod = getModifier(finalStats.CON);
  const dexMod = getModifier(finalStats.DEX);

  // Хиты и Броня
  const maxHP = getStartingHP(cls.hitDie, conMod);
  
  // Авторасчет AC по дефолтной экипировке класса
  let defaultArmor = '';
  if (cls.name === 'Воин' || cls.name === 'Паладин') defaultArmor = 'кольчуга';
  else if (cls.name === 'Жрец') defaultArmor = 'чешуйчатый';
  else if (cls.name === 'Плут' || cls.name === 'Следопыт' || cls.name === 'Бард') defaultArmor = 'кожаный';
  
  const hasShield = cls.name === 'Воин' || cls.name === 'Жрец' || cls.name === 'Паладин';
  const defaultAC = calculateDefaultAC(dexMod, defaultArmor, hasShield);

  return `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding: 20px; display: flex; align-items: center; gap: 20px; background: rgba(229,186,83,0.03); border-color: var(--border-color-active);">
          <div style="font-size: 3rem; background: rgba(0,0,0,0.2); width: 80px; height: 80px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            ${cls.icon || '⚔️'}
          </div>
          <div>
            <h3 style="font-size: 1.5rem; color: var(--accent-gold);">${escapeHtml(wizard.name)}</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">
              ${wizard.gender} • ${wizard.race} • ${wizard.class} 1 уровня
            </p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;"> Предыстория: ${wizard.background} </p>
          </div>
        </div>

        <div class="card" style="padding: 20px;">
          <h4 class="section-title-parchment" style="font-size: 1.1rem; margin-bottom: 15px;">Характеристики</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
            ${Object.entries(finalStats).map(([s, val]) => {
              const mod = getModifier(val);
              return `
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-md);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight:700;">${s}</div>
                  <div style="font-size: 1.5rem; font-family: var(--font-display); font-weight:900; color: var(--accent-gold); margin: 2px 0;">${val}</div>
                  <div style="font-size: 0.85rem; font-weight:600; color: ${mod >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${mod >= 0 ? `+${mod}` : `${mod}`}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="card" style="padding: 15px 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Здоровье (HP)</div>
            <div style="font-size: 2.2rem; font-family: var(--font-display); font-weight: 900; color: var(--accent-red); margin-top: 5px;">${maxHP}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Кость хитов d${cls.hitDie}</div>
          </div>
          <div class="card" style="padding: 15px 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Класс Доспеха (AC)</div>
            <div style="font-size: 2.2rem; font-family: var(--font-display); font-weight: 900; color: var(--accent-gold); margin-top: 5px;">${defaultAC}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Стартовый комплект</div>
          </div>
        </div>

        <div class="card" style="padding: 20px; flex-grow: 1;">
          <h4 class="section-title-parchment" style="font-size: 1.1rem; margin-bottom: 12px;">Выбранные навыки</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${wizard.skills.map(s => `
              <span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary); padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 500;">
                ✓ ${s}
              </span>
            `).join('')}
          </div>

          <h4 class="section-title-parchment" style="font-size: 1.1rem; margin-top: 20px; margin-bottom: 12px;">Стартовое снаряжение</h4>
          <ul style="font-size: 0.85rem; color: var(--text-secondary); padding-left: 20px; line-height: 1.5;">
            ${cls.startingEquipment.map(eq => `<li>${eq}</li>`).join('')}
            ${bg ? bg.equipment.map(eq => `<li>${eq}</li>`).join('') : ''}
          </ul>
        </div>
      </div>
    </div>
  `;
}

// Проверка: можно ли переходить на следующий шаг
function canGoNext(wizard) {
  const currentStep = wizard.step || 1;

  if (currentStep === 1) {
    return wizard.name.trim().length > 0 && wizard.race !== null && wizard.background !== null;
  }
  if (currentStep === 2) {
    return wizard.class !== null;
  }
  if (currentStep === 3) {
    const method = wizard.statsMethod || 'array';
    if (method === 'point') {
      return wizard.pointBuyRemaining === 0;
    }
    // Для array и roll нужно, чтобы все 6 характеристик были назначены
    return Object.values(wizard.assignedStats).every(v => v !== null);
  }
  if (currentStep === 4) {
    const cls = CLASSES_DATA.find(c => c.name === wizard.class);
    const bg = BACKGROUNDS_DATA.find(b => b.name === wizard.background);
    if (!cls) return false;
    const bgSkills = bg ? bg.skillProficiencies : [];
    const picksAllowed = cls.numSkillPicks || 2;
    const currentPicks = wizard.skills.filter(s => !bgSkills.includes(s)).length;
    return currentPicks === picksAllowed;
  }
  return true;
}

/**
 * Привязывает обработчики событий к элементам мастера создания.
 * @param {HTMLElement} container - Контейнер мастера.
 */
export function bind(container) {
  const wizard = getState().wizardData;
  if (!wizard) return;

  const currentStep = wizard.step || 1;

  // Кнопка Назад
  const btnPrev = $('#btn-wizard-prev', container);
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) {
        updateStep(currentStep - 1);
      }
    });
  }

  // Кнопка Далее / Создать
  const btnNext = $('#btn-wizard-next', container);
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentStep < 5) {
        updateStep(currentStep + 1);
      } else {
        finalizeCharacter();
      }
    });
  }

  // Кнопка Отмены (выход в меню)
  const btnCancel = $('#btn-wizard-cancel', container);
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите прервать создание героя? Все введенные данные будут потеряны.')) {
        setState({ wizardData: null, currentScreen: 'home' });
      }
    });
  }

  // Степпер клики
  const stepNodes = $$( '.wizard-step-node', container);
  stepNodes.forEach(node => {
    node.addEventListener('click', () => {
      const targetStep = parseInt(node.dataset.step);
      // Разрешаем перемещаться только назад или на один вперед если валидно
      if (targetStep < currentStep) {
        updateStep(targetStep);
      } else if (targetStep === currentStep + 1 && canGoNext(wizard)) {
        updateStep(targetStep);
      }
    });
  });

  // Логика под-шагов
  if (currentStep === 1) {
    // Ввод имени
    const inputName = $('#wizard-name', container);
    if (inputName) {
      inputName.addEventListener('input', (e) => {
        const val = e.target.value;
        const currentWizard = getState().wizardData;
        currentWizard.name = val;
        // Обновляем состояние без триггера полного рендера (избегаем потери фокуса при вводе)
        // Но пересчитаем кнопку "Далее"
        const nextBtn = $('#btn-wizard-next', container);
        if (nextBtn) {
          const isValid = canGoNext(currentWizard);
          nextBtn.disabled = !isValid;
          nextBtn.style.opacity = isValid ? '1' : '0.6';
          nextBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
        }
        // Запишем в стейт по-тихому
        getState().wizardData.name = val;
      });
      // При смене фокуса окончательно засинкаем стейт
      inputName.addEventListener('blur', (e) => {
        const currentWizard = getState().wizardData;
        currentWizard.name = e.target.value;
        setState({ wizardData: currentWizard });
      });
    }

    // Выбор пола
    const selectGender = $('#wizard-gender', container);
    if (selectGender) {
      selectGender.addEventListener('change', (e) => {
        const currentWizard = getState().wizardData;
        currentWizard.gender = e.target.value;
        setState({ wizardData: currentWizard });
      });
    }

    // Клик по расе
    const raceCards = $$( '.race-card', container);
    raceCards.forEach(card => {
      card.addEventListener('click', () => {
        const raceName = card.dataset.race;
        const currentWizard = getState().wizardData;
        
        // Меняем расу
        currentWizard.race = raceName;
        
        // Сбрасываем выбранные характеристики, так как расовые бонусы поменялись
        currentWizard.assignedStats = { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null };
        currentWizard.rolledStats = [];
        currentWizard.rollsDone = false;
        currentWizard.pointBuy = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
        currentWizard.pointBuyRemaining = 27;
        
        setState({ wizardData: currentWizard });
      });
    });

    // Клик по предыстории
    const bgCards = $$( '.bg-card', container);
    bgCards.forEach(card => {
      card.addEventListener('click', () => {
        const bgName = card.dataset.bg;
        const currentWizard = getState().wizardData;
        
        currentWizard.background = bgName;

        // Автоматически синхронизируем навыки предыстории
        const bg = BACKGROUNDS_DATA.find(b => b.name === bgName);
        if (bg) {
          // Удаляем старые навыки предыстории и добавляем новые
          const oldBgSkills = BACKGROUNDS_DATA.flatMap(b => b.skillProficiencies);
          const currentPicks = currentWizard.skills.filter(s => !oldBgSkills.includes(s));
          currentWizard.skills = [...bg.skillProficiencies, ...currentPicks];
        }

        setState({ wizardData: currentWizard });
      });
    });
  }

  if (currentStep === 2) {
    // Клик по классу
    const classCards = $$( '.class-card', container);
    classCards.forEach(card => {
      card.addEventListener('click', () => {
        const className = card.dataset.class;
        const currentWizard = getState().wizardData;
        
        currentWizard.class = className;

        // При смене класса сбросим выбранные характеристики и навыки
        currentWizard.assignedStats = { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null };
        currentWizard.rolledStats = [];
        currentWizard.rollsDone = false;
        currentWizard.pointBuy = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
        currentWizard.pointBuyRemaining = 27;
        
        // Пересоберем навыки с учетом предыстории
        const bg = BACKGROUNDS_DATA.find(b => b.name === currentWizard.background);
        currentWizard.skills = bg ? [...bg.skillProficiencies] : [];

        setState({ wizardData: currentWizard });
      });
    });
  }

  if (currentStep === 3) {
    // Смена метода распределения
    const methodTabs = $$( '.btn-method-tab', container);
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const method = tab.dataset.method;
        const currentWizard = getState().wizardData;
        
        currentWizard.statsMethod = method;
        // Сброс
        currentWizard.assignedStats = { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null };
        currentWizard.rolledStats = [];
        currentWizard.rollsDone = false;
        currentWizard.pointBuy = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
        currentWizard.pointBuyRemaining = 27;

        setState({ wizardData: currentWizard });
      });
    });

    const method = wizard.statsMethod || 'array';

    if (method === 'array' || method === 'roll') {
      let activeValue = null;
      let activeNode = null;

      // Клик по чипу из пула
      const poolChips = $$( '.btn-pool-chip', container);
      poolChips.forEach(chip => {
        chip.addEventListener('click', () => {
          if (chip.classList.contains('used')) return;

          // Подсвечиваем выбранный чип
          poolChips.forEach(c => c.style.borderColor = 'var(--accent-gold-dark)');
          chip.style.borderColor = 'var(--accent-green)';
          
          activeValue = parseInt(chip.dataset.val);
          activeNode = chip;
        });
      });

      // Клик по строке характеристики для назначения
      const statRows = $$( '.placeholder-val', container);
      statRows.forEach(row => {
        row.addEventListener('click', () => {
          if (!activeValue) {
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { text: '👉 Сначала выберите значение в пуле справа!' }
            }));
            return;
          }

          const stat = row.dataset.stat;
          const currentWizard = getState().wizardData;

          // Проверяем, не назначена ли уже эта характеристика
          if (currentWizard.assignedStats[stat]) {
            // Если назначена, сначала нужно сбросить
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { text: '⚠️ Сначала сбросьте старое значение характеристики!' }
            }));
            return;
          }

          // Назначаем
          currentWizard.assignedStats[stat] = activeValue;
          activeValue = null;
          activeNode = null;

          setState({ wizardData: currentWizard });
        });
      });

      // Кнопки сброса характеристик
      const resetBtns = $$( '.btn-reset-stat', container);
      resetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const stat = btn.dataset.stat;
          const currentWizard = getState().wizardData;
          currentWizard.assignedStats[stat] = null;
          setState({ wizardData: currentWizard });
        });
      });

      // Логика бросков в Roll методе
      const btnRoll = $('#btn-wizard-roll', container);
      if (btnRoll) {
        btnRoll.addEventListener('click', () => {
          const currentWizard = getState().wizardData;
          if (currentWizard.rolledStats.length < 6) {
            const rollRes = roll4d6DropLowest();
            currentWizard.rolledStats.push(rollRes.total);
            
            // Красивый toast с формулой броска
            const formulaText = `Бросок: [${rollRes.rolls.join(', ')}] (убрали ${rollRes.rolls[rollRes.droppedIndex]})`;
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { text: `🎲 Бросок ${currentWizard.rolledStats.length}: ${rollRes.total}! (${formulaText})` }
            }));

            if (currentWizard.rolledStats.length === 6) {
              currentWizard.rollsDone = true;
            }
            setState({ wizardData: currentWizard });
          }
        });
      }

      const btnReroll = $('#btn-wizard-reroll', container);
      if (btnReroll) {
        btnReroll.addEventListener('click', () => {
          if (confirm('Вы действительно хотите перебросить ВСЕ характеристики? Текущие значения сбросятся.')) {
            const currentWizard = getState().wizardData;
            currentWizard.rolledStats = [];
            currentWizard.rollsDone = false;
            currentWizard.assignedStats = { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null };
            setState({ wizardData: currentWizard });
          }
        });
      }
    } else if (method === 'point') {
      // Point buy инкремент/декремент
      const decBtns = $$( '.btn-pointbuy-dec', container);
      decBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const stat = btn.dataset.stat;
          const currentWizard = getState().wizardData;
          const score = currentWizard.pointBuy[stat] || 8;
          if (score > 8) {
            const costOfCurrent = POINT_BUY_COSTS[score];
            const costOfPrev = POINT_BUY_COSTS[score - 1];
            const costDiff = costOfCurrent - costOfPrev;

            currentWizard.pointBuy[stat] = score - 1;
            currentWizard.pointBuyRemaining += costDiff;

            setState({ wizardData: currentWizard });
          }
        });
      });

      const incBtns = $$( '.btn-pointbuy-inc', container);
      incBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const stat = btn.dataset.stat;
          const currentWizard = getState().wizardData;
          const score = currentWizard.pointBuy[stat] || 8;
          if (score < 15) {
            const nextScore = score + 1;
            const costOfCurrent = POINT_BUY_COSTS[score];
            const costOfNext = POINT_BUY_COSTS[nextScore];
            const costDiff = costOfNext - costOfCurrent;

            if (currentWizard.pointBuyRemaining >= costDiff) {
              currentWizard.pointBuy[stat] = nextScore;
              currentWizard.pointBuyRemaining -= costDiff;
              setState({ wizardData: currentWizard });
            }
          }
        });
      });
    }
  }

  if (currentStep === 4) {
    // Клик по чекбоксам навыков
    const checkboxes = $$( '.wizard-skill-checkbox', container);
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const skillName = cb.dataset.skill;
        const currentWizard = getState().wizardData;
        
        if (cb.checked) {
          if (!currentWizard.skills.includes(skillName)) {
            currentWizard.skills.push(skillName);
          }
        } else {
          currentWizard.skills = currentWizard.skills.filter(s => s !== skillName);
        }

        setState({ wizardData: currentWizard });
      });
    });
  }
}

// Изменение текущего шага мастера
function updateStep(newStep) {
  const wizard = getState().wizardData;
  wizard.step = newStep;
  setState({ wizardData: wizard });
}

// Завершение создания персонажа и сохранение в базу
function finalizeCharacter() {
  const wizard = getState().wizardData;
  if (!wizard) return;

  const race = RACES_DATA.find(r => r.name === wizard.race);
  const cls = CLASSES_DATA.find(c => c.name === wizard.class);
  const bg = BACKGROUNDS_DATA.find(b => b.name === wizard.background);

  const bonuses = race ? race.abilityBonuses : {};

  // Финальные характеристики
  const finalStats = {};
  const method = wizard.statsMethod || 'array';

  ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(s => {
    const base = method === 'point' ? (wizard.pointBuy[s] || 8) : (wizard.assignedStats[s] || 10);
    const bonus = bonuses[s] || 0;
    finalStats[s] = base + bonus;
  });

  const conMod = getModifier(finalStats.CON);
  const dexMod = getModifier(finalStats.DEX);

  // HP и AC
  const maxHP = getStartingHP(cls.hitDie, conMod);
  
  let defaultArmor = 'Обычная одежда';
  if (cls.name === 'Воин' || cls.name === 'Паладин') defaultArmor = 'Кольчуга (Chain Mail)';
  else if (cls.name === 'Жрец') defaultArmor = 'Чешуйчатый доспех (Scale Mail)';
  else if (cls.name === 'Плут' || cls.name === 'Следопыт' || cls.name === 'Бард') defaultArmor = 'Кожаный доспех (Leather)';
  
  const hasShield = cls.name === 'Воин' || cls.name === 'Жрец' || cls.name === 'Паладин';
  const defaultAC = calculateDefaultAC(dexMod, defaultArmor, hasShield);

  // Спасброски от класса
  const savingThrows = cls.savingThrows || [];

  // Владения от класса и предыстории
  const profs = {
    armor: [...(cls.armorProficiencies || [])],
    weapons: [...(cls.weaponProficiencies || [])],
    tools: [...(cls.toolProficiencies || []), ...(bg ? bg.toolProficiencies : [])],
    languages: [...(race ? race.languages : []), ...(bg ? bg.languages : [])]
  };

  // Стартовые атаки: сопоставляем стартовое оружие с базой WEAPONS_DATA
  const startAttacks = [];
  cls.startingEquipment.forEach(eq => {
    const eqLower = eq.toLowerCase();
    const w = WEAPONS_DATA.find(item => eqLower.includes(item.name.toLowerCase()) || eqLower.includes(item.nameEn.toLowerCase()));
    if (w) {
      startAttacks.push({
        name: w.name,
        nameEn: w.nameEn,
        damage: w.damage,
        damageType: w.damageType,
        properties: w.properties,
        weight: w.weight,
        category: w.category
      });
    }
  });

  // Стартовый инвентарь
  const startInventory = [];
  cls.startingEquipment.forEach(eq => {
    startInventory.push({ name: eq, count: 1, weight: 1, note: 'Классовый стартовый набор' });
  });
  if (bg) {
    bg.equipment.forEach(eq => {
      startInventory.push({ name: eq, count: 1, weight: 1, note: 'Предыстория' });
    });
  }

  // Заклинания: если класс использует магию, добавляем начальные заклинания
  const startSpells = [];
  const startSpellSlots = {
    1: { current: 0, max: 0 },
    2: { current: 0, max: 0 },
    3: { current: 0, max: 0 },
    4: { current: 0, max: 0 }
  };

  if (cls.spellcasting) {
    // Находим заговоры и заклинания 1 круга для этого класса
    const classSpells = SPELLS_DATA.filter(sp => sp.classes.includes(cls.nameEn));
    
    // Добавим 2 заговора и 2 заклинания 1 уровня по умолчанию для новичков
    const cantrips = classSpells.filter(sp => sp.level === 0).slice(0, 2);
    const lv1Spells = classSpells.filter(sp => sp.level === 1).slice(0, 2);

    cantrips.forEach(sp => startSpells.push(sp));
    lv1Spells.forEach(sp => startSpells.push(sp));

    // Устанавливаем ячейки заклинаний 1 круга
    startSpellSlots[1] = { current: 2, max: 2 };
  }

  // Создаем объект персонажа
  const newChar = {
    id: generateId(),
    name: wizard.name.trim(),
    gender: wizard.gender,
    portrait: wizard.portrait || cls.icon || '⚔️',
    race: wizard.race,
    raceEn: race ? race.nameEn : '',
    class: wizard.class,
    classEn: cls ? cls.nameEn : '',
    background: wizard.background,
    backgroundEn: bg ? bg.nameEn : '',
    level: 1,
    xp: 0,
    isMilestone: true,
    inspiration: false,
    abilities: finalStats,
    skills: wizard.skills,
    savingThrows: savingThrows,
    hp: {
      current: maxHP,
      max: maxHP,
      temp: 0
    },
    acOverride: null,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    proficiencies: profs,
    spells: startSpells,
    spellSlots: startSpellSlots,
    inventory: startInventory,
    coins: {
      gp: bg && bg.name === 'Благородный' ? 25 : 10,
      sp: 0,
      cp: 0
    },
    notes: {
      session: `**Мое приключение началось!**\n\nЯ — ${wizard.name.trim()}, ${race ? race.name : ''} ${cls ? cls.name : ''}.\nМоя цель — прославить свое имя!`,
      npcs: '',
      quests: '1. Найти приключения.\n2. Победить дракона.',
      loot: ''
    },
    attacks: startAttacks
  };

  // Сохраняем в базу данных и переключаем экран
  saveCharacter(newChar);
  

  // Звук кубиков в честь победы
  playDiceSound();

  // Меняем состояние
  setState({
    activeCharacterId: newChar.id,
    wizardData: null,
    currentScreen: 'sheet'
  });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `🎉 Персонаж ${newChar.name} успешно создан!` }
  }));
}
