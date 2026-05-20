/* ==========================================================================
   D&D 5e Помощник Новичка — Spells Component (Заклинания)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$, escapeHtml } from '../utils.js';
import { getModifier, getProficiencyBonus, SPELLS_DATA, CLASSES_DATA } from '../rules/index.js';

/**
 * Рендерит HTML блока заклинаний.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';

  const spells = character.spells || [];
  const spellSlots = character.spellSlots || { 1: { current: 0, max: 0 }, 2: { current: 0, max: 0 }, 3: { current: 0, max: 0 }, 4: { current: 0, max: 0 } };
  const abilities = character.abilities || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
  const level = character.level || 1;

  // Определяем заклинательную характеристику из класса
  const classData = CLASSES_DATA.find(c => c.name === character.class || c.nameEn === character.classEn);
  const isSpellcaster = classData?.spellcasting !== null && classData?.spellcasting !== undefined;
  const spellAbility = classData?.spellcasting?.ability || 'INT';

  // Spell DC и Spell Attack
  const spellMod = getModifier(abilities[spellAbility] || 10);
  const profBonus = getProficiencyBonus(level);
  const spellDC = 8 + spellMod + profBonus;
  const spellAttack = spellMod + profBonus;

  // Проверяем, есть ли слоты для отображения
  const hasSpellSlots = Object.values(spellSlots).some(s => s.max > 0);

  // Check if spellcaster
  if (!isSpellcaster) {
    return `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <h3>✨ Заклинания</h3>
        <div style="padding: 30px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
          <div style="font-size: 2rem; margin-bottom: 10px;">🔇</div>
          <h4 style="color: var(--accent-gold); margin-bottom: 10px;">Ваш класс не использует заклинания</h4>
          <p>Класс "${character.class || 'Неизвестный'}" не обладает магическими способностями.</p>
          <p style="font-size: 0.85rem; margin-top: 10px; color: var(--text-muted);">
            Заклинания доступны: Волшебник, Жрец, Бард, Друид, Следопыт, Паладин, Колдун, Чародей.
          </p>
        </div>
      </div>
    `;
  }

  // Group spells by level
  const spellsByLevel = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  spells.forEach(spell => {
    const spellLevel = spell.level || 0;
    if (spellsByLevel[spellLevel] !== undefined) {
      spellsByLevel[spellLevel].push(spell);
    }
  });

  // Render spell slots
  const spellSlotsHtml = [1, 2, 3, 4].map(lvl => {
    const slot = spellSlots[lvl] || { current: 0, max: 0 };
    if (slot.max === 0) return '';

    const romanNum = ['I', 'II', 'III', 'IV'];
    return `
      <div class="spell-slots-row">
        <div class="spell-slots-header">
          <span>${romanNum[lvl - 1]} круг</span>
          <span>${slot.current}/${slot.max}</span>
        </div>
        <div class="spell-slot-pips">
          ${Array.from({ length: slot.max }, (_, i) => `
            <button class="spell-slot-pip ${i < slot.current ? 'available' : 'spent'}" data-level="${lvl}" data-index="${i}" title="${i < slot.current ? 'Доступна (клик — использовать)' : 'Использована (клик — восстановить)'}">
              ${i < slot.current ? '●' : '○'}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Render spells grouped
  const spellsGroupedHtml = Object.entries(spellsByLevel)
    .filter(([lvl]) => parseInt(lvl) >= 0 && spellsByLevel[parseInt(lvl)].length > 0)
    .map(([lvl, levelSpells]) => {
      const levelNum = parseInt(lvl);
      const levelName = levelNum === 0 ? '✨ Заговоры' : `🔮 ${levelNum} круг`;

      return `
        <div class="spell-level-section">
          <div class="spell-level-section-title">${levelName}</div>
          <div class="spells-rows-list">
            ${levelSpells.map((spell, idx) => {
              const globalIndex = spells.findIndex(s => s === spell);
              return `
                <div class="spell-row-card" data-index="${globalIndex}">
                  <button class="btn-link spell-name-btn" data-action="spell-info" data-index="${globalIndex}">
                    ${escapeHtml(spell.name)}
                  </button>
                  <div style="display: flex; gap: 5px;">
                    <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" data-action="cast-spell" data-index="${globalIndex}">
                      ${spell.level > 0 ? 'Использовать' : 'Сотворить'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

  // Получаем доступные для класса заклинания для добавления
  const classSpells = SPELLS_DATA.filter(sp => {
    const classEn = classData?.nameEn || '';
    return sp.classes.includes(classEn);
  });

  // Группируем по уровню для дропдауна
  const addSpellOptionsHtml = [0, 1, 2, 3].map(lvl => {
    const levelSpells = classSpells.filter(sp => sp.level === lvl);
    if (levelSpells.length === 0) return '';

    const levelLabel = lvl === 0 ? 'Заговоры' : `${lvl} круг`;
    const options = levelSpells.map(sp => {
      const isAdded = spells.some(s => s.name === sp.name);
      return `<option value="${escapeHtml(sp.name)}" ${isAdded ? 'disabled' : ''}>
        ${escapeHtml(sp.name)}${isAdded ? ' (уже добавлено)' : ''}
      </option>`;
    }).join('');

    return `<optgroup label="${levelLabel}">${options}</optgroup>`;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">✨ Заклинания</h3>
      </div>

      <!-- Spell Parameters -->
      <div class="spell-params-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div class="spell-param-box">
          <span class="param-label">Характеристика</span>
          <span class="param-value">${spellAbility}</span>
        </div>
        <div class="spell-param-box">
          <span class="param-label">Модификатор</span>
          <span class="param-value">${formatModifier(spellMod)}</span>
        </div>
        <div class="spell-param-box">
          <span class="param-label">Spell DC</span>
          <span class="param-value" style="color: var(--accent-gold);">${spellDC}</span>
        </div>
        <div class="spell-param-box">
          <span class="param-label">Spell Attack</span>
          <span class="param-value" style="color: var(--accent-gold);">${formatModifier(spellAttack)}</span>
        </div>
      </div>

      <!-- Spell Slots -->
      ${hasSpellSlots ? `
      <div class="spell-slots-grid">
        ${spellSlotsHtml}
      </div>
      ` : ''}

      <!-- Spells List -->
      <div>
        <h4 style="margin-bottom: 10px;">📖 Известные заклинания</h4>
        ${spells.length > 0 ? `
        <div class="spells-list-grouped">
          ${spellsGroupedHtml}
        </div>
        ` : `
        <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
          <p>У вас пока нет заклинаний. Добавьте из списка!</p>
        </div>
        `}
      </div>

      <!-- Add Spell -->
      <div>
        <h4 style="margin-bottom: 10px;">➕ Добавить заклинание</h4>
        <div style="display: flex; gap: 10px;">
          <select id="select-spell-to-add" class="form-select" style="flex: 1;">
            <option value="">— Выберите заклинание для класса ${character.class} —</option>
            ${addSpellOptionsHtml}
          </select>
          <button id="btn-add-spell" class="btn-primary">Добавить</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку заклинаний.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Add spell button
  const addBtn = $('#btn-add-spell', container);
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const select = $('#select-spell-to-add', container);
      const spellName = select?.value?.trim();

      if (!spellName) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { text: '⚠️ Выберите заклинание из списка!', duration: 3000 }
        }));
        return;
      }

      const spell = SPELLS_DATA.find(s => s.name === spellName);
      if (spell) {
        addSpell(spell);
        // Отключаем добавленное заклинание в списке
        const option = select.querySelector(`option[value="${spellName}"]`);
        if (option) {
          option.disabled = true;
          option.textContent = `${spellName} (уже добавлено)`;
        }
        select.value = '';
      }
    });
  }

  // Cast spell buttons
  const castBtns = $$('[data-action="cast-spell"]', container);
  castBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      castSpell(index);
    });
  });

  // Spell info buttons (click on spell name opens modal with details)
  const infoBtns = $$('[data-action="spell-info"]', container);
  infoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const character = getActiveCharacter();
      if (character) {
        const spell = character.spells?.[index];
        if (spell) {
          showSpellDetailModal(spell);
        }
      }
    });
  });

  // Spell slot pips (toggle)
  const pips = $$('.spell-slot-pip', container);
  pips.forEach(pip => {
    pip.addEventListener('click', () => {
      const level = parseInt(pip.dataset.level);
      const index = parseInt(pip.dataset.index);
      toggleSpellSlot(level, index);
    });
  });
}

/**
 * Тратит слот заклинания.
 * @param {number} index - Индекс заклинания.
 */
function castSpell(index) {
  const character = getActiveCharacter();
  if (!character) return;

  const spell = character.spells?.[index];
  if (!spell) return;

  if (spell.level > 0) {
    const spellSlots = character.spellSlots || {};
    const slot = spellSlots[spell.level] || { current: 0, max: 0 };

    if (slot.current <= 0) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { text: `⚠️ Нет слотов ${spell.level} уровня!`, duration: 3000 }
      }));
      return;
    }

    // Используем слот
    const updatedSlots = { ...spellSlots };
    updatedSlots[spell.level] = { ...updatedSlots[spell.level], current: updatedSlots[spell.level].current - 1 };

    const updatedChars = getState().characters.map(c =>
      c.id === character.id ? { ...c, spellSlots: updatedSlots } : c
    );
    setState({ characters: updatedChars });
  }

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `✨ ${spell.name} успешно сотворено!` }
  }));
}

/**
 * Переключает слот заклинания (использовать/восстановить).
 * @param {number} level - Уровень слота.
 * @param {number} index - Индекс в ряду.
 */
function toggleSpellSlot(level, index) {
  const character = getActiveCharacter();
  if (!character) return;

  const spellSlots = { ...character.spellSlots } || {};
  const currentSlot = spellSlots[level] || { current: 0, max: 0 };
  const currentUsed = currentSlot.max - currentSlot.current;

  if (index >= currentUsed) {
    // Использовать слот (уменьшить current) если возможно
    if (currentSlot.current > 0) {
      const updatedChars = getState().characters.map(c =>
        c.id === character.id ? {
          ...c,
          spellSlots: {
            ...c.spellSlots,
            [level]: { ...c.spellSlots[level], current: c.spellSlots[level].current - 1 }
          }
        } : c
      );
      setState({ characters: updatedChars });

      const romanNum = ['I', 'II', 'III', 'IV'];
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { text: `🔮 Ячейка ${romanNum[level - 1]} круга использована!` }
      }));
    }
  } else {
    // Восстановить слот (увеличить current)
    const updatedChars = getState().characters.map(c =>
      c.id === character.id ? {
        ...c,
        spellSlots: {
          ...c.spellSlots,
          [level]: { ...c.spellSlots[level], current: c.spellSlots[level].current + 1 }
        }
      } : c
    );
    setState({ characters: updatedChars });

    const romanNum = ['I', 'II', 'III', 'IV'];
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: `✨ Ячейка ${romanNum[level - 1]} круга восстановлена!` }
    }));
  }
}

/**
 * Показывает модалку с деталями заклинания.
 * @param {Object} spell - Данные заклинания.
 */
function showSpellDetailModal(spell) {
  const modal = $('#modal-content');

  modal.innerHTML = `
    <div style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <button class="modal-close-btn" id="close-spell-detail">&times;</button>

      <div class="spell-detail-header" style="margin-bottom: 20px;">
        <h2 style="margin-bottom: 10px;">${escapeHtml(spell.name)}</h2>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <span style="background: var(--accent-gold); color: var(--bg-primary); padding: 3px 10px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 700;">
            ${spell.level === 0 ? 'Заговор' : `${spell.level} круг`}
          </span>
          ${spell.school ? `<span style="background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: var(--radius-sm); font-size: 0.85rem;">${escapeHtml(spell.school)}</span>` : ''}
        </div>
      </div>

      ${spell.castingTime || spell.range || spell.duration ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        ${spell.castingTime ? `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px;">⏱️ Время создания</div>
          <div>${escapeHtml(spell.castingTime)}</div>
        </div>
        ` : ''}
        ${spell.range ? `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px;">🎯 Дистанция</div>
          <div>${escapeHtml(spell.range)}</div>
        </div>
        ` : ''}
        ${spell.duration ? `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px;">⏳ Длительность</div>
          <div>${escapeHtml(spell.duration)}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${spell.description ? `
      <div style="margin-bottom: 20px;">
        <h4 style="margin-bottom: 10px;">Описание</h4>
        <p style="line-height: 1.6;">${escapeHtml(spell.description)}</p>
      </div>
      ` : ''}

      ${spell.classes ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">📚 Доступно классам:</div>
        <div style="font-size: 0.9rem;">${spell.classes.join(', ')}</div>
      </div>
      ` : ''}

      ${spell.level > 0 ? `
      <div style="background: rgba(229,186,83,0.1); border: 1px solid var(--accent-gold); padding: 10px; border-radius: var(--radius-md); margin-bottom: 20px;">
        <span style="font-size: 0.85rem;">Для сотворения требуется ячейка ${spell.level} круга</span>
      </div>
      ` : ''}

      <button id="btn-close-detail" class="btn-secondary" style="width: 100%;">Закрыть</button>
    </div>
  `;

  $('#modal-overlay').classList.add('active');

  // Close handlers
  const closeModal = () => {
    $('#modal-overlay').classList.remove('active');
    $('#modal-content').innerHTML = '';
  };

  $('#close-spell-detail')?.addEventListener('click', closeModal);
  $('#btn-close-detail')?.addEventListener('click', closeModal);
}

/**
 * Удаляет заклинание.
 * @param {number} index - Индекс заклинания.
 */
function deleteSpell(index) {
  const character = getActiveCharacter();
  if (!character) return;

  const spells = [...(character.spells || [])];
  const spellName = spells[index]?.name || 'Заклинание';
  spells.splice(index, 1);

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, spells } : c
  );
  setState({ characters: updatedChars });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `🗑️ "${spellName}" удалено!` }
  }));
}

/**
 * Добавляет заклинание персонажу.
 * @param {Object} spell - Данные заклинания.
 */
function addSpell(spell) {
  const character = getActiveCharacter();
  if (!character) return;

  const spells = [...(character.spells || []), { ...spell }];

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, spells } : c
  );
  setState({ characters: updatedChars });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `📖 "${spell.name}" добавлено в книгу заклинаний!` }
  }));
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