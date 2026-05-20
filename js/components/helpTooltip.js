/* ==========================================================================
   D&D 5e Помощник Новичка — Help Tooltip Component (Контекстные подсказки)
   ========================================================================== */

/**
 * Рендерит иконку справки (?) с tooltip.
 * @param {string} tooltipId - Уникальный ID для tooltip (используется в data-tooltip).
 * @param {string} text - Текст подсказки на русском языке.
 * @returns {string} - HTML разметка иконки.
 */
export function renderHelpIcon(tooltipId, text) {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  return `<span class="help-icon" data-tooltip="${tooltipId}" title="${escapedText}">?</span>`;
}

/**
 * Инициализирует глобальный обработчик тултипов.
 * Включает/выключает подсказки на основе state.showHelp.
 */
export function bind(container) {
  const helpIcons = container.querySelectorAll('.help-icon');
  
  helpIcons.forEach(icon => {
    // Hover показывает tooltip
    icon.addEventListener('mouseenter', (e) => {
      const tooltipId = e.target.dataset.tooltip;
      if (!tooltipId) return;
      
      // Найти соответствующий tooltip
      const tooltip = container.querySelector(`[data-tooltip-content="${tooltipId}"]`);
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';
      }
    });
    
    icon.addEventListener('mouseleave', (e) => {
      const tooltipId = e.target.dataset.tooltip;
      if (!tooltipId) return;
      
      const tooltip = container.querySelector(`[data-tooltip-content="${tooltipId}"]`);
      if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.style.opacity = '0';
      }
    });
  });
}