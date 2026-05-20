/* ==========================================================================
   D&D 5e Помощник Новичка — Inventory Component (Инвентарь)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$, escapeHtml } from '../utils.js';

/**
 * Рендерит HTML блока инвентаря.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';

  const inventory = character.inventory || [];
  const coins = character.coins || { gp: 0, sp: 0, cp: 0 };

  // Получаем значение Силы для расчёта переносимого веса
  const strScore = character.abilities?.STR || 10;
  const encumbranceThreshold = strScore * 15; // Порог перегрузки по D&D 5e
  const heavilyEncumberedThreshold = strScore * 30; // Сильная перегрузка (x3 Strength)

  // Вычисляем общий вес
  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0);

  // ПРОВЕРКА ПЕРЕГРУЗКИ: если вес > STR * 15, показываем предупреждение
  const isEncumbered = totalWeight > encumbranceThreshold;
  const isHeavilyEncumbered = totalWeight > heavilyEncumberedThreshold;

  // Генерируем HTML предупреждения о перегрузке
  let encumbranceWarningHtml = '';
  if (isHeavilyEncumbered) {
    encumbranceWarningHtml = `
      <div style="background: rgba(220, 53, 69, 0.2); border: 1px solid var(--accent-red); border-radius: var(--radius-md); padding: 10px 15px; margin-top: 10px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--accent-red);">Перегрузка!</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Скорость снижена на 20 футов. Все проверки Силы с помехой.</div>
        </div>
      </div>
    `;
  } else if (isEncumbered) {
    encumbranceWarningHtml = `
      <div style="background: rgba(255, 193, 7, 0.15); border: 1px solid var(--accent-gold); border-radius: var(--radius-md); padding: 10px 15px; margin-top: 10px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--accent-gold);">Вес превышен!</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Скорость снижена на 10 футов.</div>
        </div>
      </div>
    `;
  }

  // HTML списка предметов — с поддержкой inline-редактирования
  const inventoryListHtml = inventory.length > 0 ? inventory.map((item, index) => `
    <tr class="inventory-item-row" data-index="${index}">
      <td class="item-name-cell" data-index="${index}">${escapeHtml(item.name || 'Без названия')}</td>
      <td style="text-align: center;">
        <input type="number" class="item-quantity-input" data-index="${index}" value="${item.quantity || 1}" min="0" style="width: 50px; text-align: center;">
      </td>
      <td style="text-align: right;">${(item.weight || 0) * (item.quantity || 1)} фт</td>
      <td style="text-align: center;">
        <button class="btn-danger" style="padding: 2px 6px; font-size: 0.75rem;" data-action="delete-item" data-index="${index}">×</button>
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="4" style="text-align: center; color: var(--text-muted);">Инвентарь пуст</td>
    </tr>
  `;

  return `
    <div class="inventory-tab-inner">
      <!-- Money Section -->
      <div>
        <h3 style="margin-bottom: 15px;">💰 Монеты</h3>
        <div class="coins-row-grid">
          <div class="coin-item-box">
            <input type="number" value="${coins.gp}" min="0" data-coin="gp">
            <span class="coin-icon">🪙</span>
            <span class="coin-lbl-gp">Золотые (ЗМ/gp)</span>
          </div>
          <div class="coin-item-box">
            <input type="number" value="${coins.sp}" min="0" data-coin="sp">
            <span class="coin-icon">🥈</span>
            <span class="coin-lbl-sp">Серебряные (СМ/sp)</span>
          </div>
          <div class="coin-item-box">
            <input type="number" value="${coins.cp}" min="0" data-coin="cp">
            <span class="coin-icon">🪙</span>
            <span class="coin-lbl-cp">Медные (ММ/cp)</span>
          </div>
        </div>
        <button id="btn-convert-coins" class="btn-secondary" style="margin-top: 10px; width: 100%;">💱 Конвертировать (10:1)</button>
      </div>

      <!-- Inventory List -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">🎒 Инвентарь</h3>
          <button id="btn-add-item" class="btn-primary" style="font-size: 0.85rem; padding: 6px 12px;">+ Добавить предмет</button>
        </div>

        <table class="inventory-items-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Кол-во</th>
              <th>Вес</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${inventoryListHtml}
          </tbody>
        </table>

        <!-- Общий вес с предупреждением о перегрузке -->
        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Общий вес:</span>
            <span style="font-weight: 700;">${totalWeight.toFixed(1)} фт</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; font-size: 0.85rem; color: var(--text-muted);">
            <span>Лимит (СИЛ × 15):</span>
            <span>${encumbranceThreshold} фт</span>
          </div>
        </div>

        <!-- ПРЕДУПРЕЖДЕНИЕ О ПЕРЕГРУЗКЕ - отображается только если вес превышает лимит -->
        ${encumbranceWarningHtml}
      </div>
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку инвентаря.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Coin inputs
  const coinInputs = $$('[data-coin]', container);
  coinInputs.forEach(input => {
    input.addEventListener('change', () => {
      const coin = input.dataset.coin;
      const value = parseInt(input.value) || 0;
      updateCoins(coin, value);
    });
  });

  // Convert coins button
  const convertBtn = $('#btn-convert-coins', container);
  if (convertBtn) {
    convertBtn.addEventListener('click', () => convertCoins());
  }

  // Add item button
  const addBtn = $('#btn-add-item', container);
  if (addBtn) {
    addBtn.addEventListener('click', () => showAddItemModal());
  }

  // Delete item buttons
  const deleteBtns = $$('[data-action="delete-item"]', container);
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteItem(index);
    });
  });

  // Inline editing: dblclick on item name creates input
  const nameCells = $$('.item-name-cell', container);
  nameCells.forEach(cell => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('dblclick', () => {
      const index = parseInt(cell.dataset.index);
      const character = getActiveCharacter();
      if (!character) return;

      const item = character.inventory?.[index];
      if (!item) return;

      // Create input for inline editing
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inline-edit-input';
      input.value = item.name || '';
      input.style.cssText = 'width: 100%; padding: 2px 4px; font-size: inherit; background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--accent-gold); border-radius: var(--radius-sm);';
      input.maxLength = 60;

      // Replace cell content with input
      const originalText = cell.textContent;
      cell.textContent = '';
      cell.appendChild(input);
      input.focus();
      input.select();

      // Save on blur or Enter
      const saveEdit = () => {
        const newName = input.value.trim();
        if (newName && newName !== item.name) {
          updateItemName(index, newName);
        } else {
          cell.textContent = originalText;
        }
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          cell.textContent = originalText;
        }
      });
    });
  });

  // Inline editing: change quantity input
  const quantityInputs = $$('.item-quantity-input', container);
  quantityInputs.forEach(input => {
    input.addEventListener('change', () => {
      const index = parseInt(input.dataset.index);
      const newQuantity = Math.max(0, parseInt(input.value) || 0);
      updateItemQuantity(index, newQuantity);
    });
  });
}

/**
 * Обновляет монеты.
 * @param {string} coin - Тип монеты.
 * @param {number} value - Новое значение.
 */
function updateCoins(coin, value) {
  const character = getActiveCharacter();
  if (!character) return;

  const coins = { ...character.coins, [coin]: Math.max(0, value) };

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, coins } : c
  );
  setState({ characters: updatedChars });
}

/**
 * Конвертирует монеты (10:1).
 */
function convertCoins() {
  const character = getActiveCharacter();
  if (!character) return;

  const coins = { ...character.coins };

  // CP to SP
  if (coins.cp >= 10) {
    const convert = Math.floor(coins.cp / 10);
    coins.sp += convert;
    coins.cp -= convert * 10;
  }

  // SP to GP
  if (coins.sp >= 10) {
    const convert = Math.floor(coins.sp / 10);
    coins.gp += convert;
    coins.sp -= convert * 10;
  }

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, coins } : c
  );
  setState({ characters: updatedChars });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: '💱 Монеты конвертированы!' }
  }));
}

/**
 * Удаляет предмет.
 * @param {number} index - Индекс.
 */
function deleteItem(index) {
  const character = getActiveCharacter();
  if (!character) return;

  const inventory = [...(character.inventory || [])];
  const itemName = inventory[index]?.name || 'Предмет';
  inventory.splice(index, 1);

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, inventory } : c
  );
  setState({ characters: updatedChars });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `🗑️ "${itemName}" удалён!` }
  }));
}

/**
 * Обновляет название предмета (inline редактирование).
 * @param {number} index - Индекс.
 * @param {string} newName - Новое название.
 */
function updateItemName(index, newName) {
  const character = getActiveCharacter();
  if (!character) return;

  const inventory = [...(character.inventory || [])];
  if (inventory[index]) {
    inventory[index] = { ...inventory[index], name: newName };

    const updatedChars = getState().characters.map(c =>
      c.id === character.id ? { ...c, inventory } : c
    );
    setState({ characters: updatedChars });
  }
}

/**
 * Обновляет количество предмета (inline редактирование).
 * @param {number} index - Индекс.
 * @param {number} newQuantity - Новое количество.
 */
function updateItemQuantity(index, newQuantity) {
  const character = getActiveCharacter();
  if (!character) return;

  const inventory = [...(character.inventory || [])];
  if (inventory[index]) {
    inventory[index] = { ...inventory[index], quantity: newQuantity };

    const updatedChars = getState().characters.map(c =>
      c.id === character.id ? { ...c, inventory } : c
    );
    setState({ characters: updatedChars });
  }
}

/**
 * Показывает модалку добавления предмета.
 */
function showAddItemModal() {
  const modal = $('#modal-content');
  modal.innerHTML = `
    <div style="max-width: 500px;">
      <button class="modal-close-btn" id="close-item-modal">&times;</button>
      <h2>📦 Добавить Предмет</h2>

      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Название:</label>
        <input type="text" id="item-name" style="width: 100%;" placeholder="Название предмета">
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div class="form-group" style="flex: 1;">
          <label style="display: block; margin-bottom: 5px;">Количество:</label>
          <input type="number" id="item-quantity" value="1" min="1" style="width: 100%;">
        </div>
        <div class="form-group" style="flex: 1;">
          <label style="display: block; margin-bottom: 5px;">Вес (фунт):</label>
          <input type="number" id="item-weight" value="1" min="0" step="0.1" style="width: 100%;">
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Заметка (опционально):</label>
        <input type="text" id="item-note" style="width: 100%;" placeholder="Краткое описание...">
      </div>

      <button id="btn-confirm-item" class="btn-glow-gold" style="width: 100%;">Добавить</button>
    </div>
  `;

  $('#modal-overlay').classList.add('active');

  $('#close-item-modal')?.addEventListener('click', () => {
    $('#modal-overlay').classList.remove('active');
    $('#modal-content').innerHTML = '';
  });

  $('#btn-confirm-item')?.addEventListener('click', () => {
    const name = $('#item-name')?.value?.trim();
    const quantity = parseInt($('#item-quantity')?.value) || 1;
    const weight = parseFloat($('#item-weight')?.value) || 0;
    const note = $('#item-note')?.value?.trim() || '';

    if (name) {
      addItem({ name, quantity, weight, note });
      $('#modal-overlay').classList.remove('active');
      $('#modal-content').innerHTML = '';
    }
  });
}

/**
 * Добавляет предмет.
 * @param {Object} item - Данные предмета.
 */
function addItem(item) {
  const character = getActiveCharacter();
  if (!character) return;

  const inventory = [...(character.inventory || []), item];

  const updatedChars = getState().characters.map(c =>
    c.id === character.id ? { ...c, inventory } : c
  );
  setState({ characters: updatedChars });

  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: `📦 "${item.name}" добавлен в инвентарь!` }
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