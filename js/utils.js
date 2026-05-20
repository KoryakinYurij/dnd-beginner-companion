/* ==========================================================================
   D&D 5e Помощник Новичка — Вспомогательные функции (Utilities)
   ========================================================================== */

/**
 * Выбор одного элемента из DOM.
 * @param {string} selector - CSS селектор.
 * @param {HTMLElement} [parent=document] - Родительский элемент.
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Выбор списка элементов из DOM.
 * @param {string} selector - CSS селектор.
 * @param {HTMLElement} [parent=document] - Родительский элемент.
 * @returns {NodeList}
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Форматирует число как модификатор D&D (например, +3, 0, -1).
 * @param {number} n - Число.
 * @returns {string}
 */
export function formatModifier(n) {
  if (n > 0) return `+${n}`;
  if (n === 0) return '0';
  return `${n}`; // знак минус уже есть в отрицательном числе
}

/**
 * Функция дебаунса для задержки вызовов (например, автосохранение).
 * @param {Function} fn - Функция.
 * @param {number} ms - Время задержки в миллисекундах.
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Генерирует короткий уникальный ID.
 * @returns {string}
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Ограничивает число в пределах минимума и максимума.
 * @param {number} val - Значение.
 * @param {number} min - Минимум.
 * @param {number} max - Максимум.
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Защищает строку от XSS атак при выводе в HTML.
 * @param {string} str - Строка.
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Форматирует числа с разделителями тысяч для читаемости (например, 14000 -> 14 000).
 * @param {number} n - Число.
 * @returns {string}
 */
export function formatXP(n) {
  if (n === null || n === undefined) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
