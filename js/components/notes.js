/* ==========================================================================
   D&D 5e Помощник Новичка — Notes Component (Заметки)
   ========================================================================== */

import { getActiveCharacter, getState, setState } from '../state.js';
import { $, $$ } from '../utils.js';

/**
 * Рендерит HTML блока заметок.
 * @param {Object} character - Данные персонажа.
 * @param {Object} state - Глобальное состояние.
 * @returns {string} - HTML разметка.
 */
export function render(character, state) {
  if (!character) return '';
  
  const notes = character.notes || {
    session: '',
    npcs: '',
    quests: '',
    loot: ''
  };
  
  return `
    <div class="notes-tab-wrapper">
      <h3 style="margin-bottom: 15px;">📝 Заметки</h3>
      
      <div class="notes-text-area" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.85rem;">📖 Дневник сессии</label>
        <textarea id="notes-session" rows="4" placeholder="Записывайте важные события..." style="width: 100%; min-height: 80px;">${notes.session || ''}</textarea>
      </div>
      
      <div class="notes-text-area" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.85rem;">👥 NPC</label>
        <textarea id="notes-npcs" rows="3" placeholder="Важные персонажи..." style="width: 100%; min-height: 60px;">${notes.npcs || ''}</textarea>
      </div>
      
      <div class="notes-text-area" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.85rem;">🗺️ Квесты</label>
        <textarea id="notes-quests" rows="3" placeholder="Текущие задания..." style="width: 100%; min-height: 60px;">${notes.quests || ''}</textarea>
      </div>
      
      <div class="notes-text-area" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.85rem;">💎 Добыча</label>
        <textarea id="notes-loot" rows="2" placeholder="Награды и предметы..." style="width: 100%; min-height: 50px;">${notes.loot || ''}</textarea>
      </div>
      
      <button id="btn-save-notes" class="btn-glow-gold" style="width: 100%;">💾 Сохранить</button>
    </div>
  `;
}

/**
 * Привязывает обработчики к блоку заметок.
 * @param {HTMLElement} container - Контейнер компонента.
 */
export function bind(container) {
  // Save button
  const saveBtn = $('#btn-save-notes', container);
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveNotes());
  }
  
  // Auto-save on blur
  const textareas = $$('textarea', container);
  textareas.forEach(ta => {
    ta.addEventListener('blur', () => saveNotes());
  });
}

/**
 * Сохраняет заметки.
 */
function saveNotes() {
  const character = getActiveCharacter();
  if (!character) return;
  
  const session = $('#notes-session')?.value || '';
  const npcs = $('#notes-npcs')?.value || '';
  const quests = $('#notes-quests')?.value || '';
  const loot = $('#notes-loot')?.value || '';
  
  const notes = { session, npcs, quests, loot };
  
  const updatedChars = getState().characters.map(c => 
    c.id === character.id ? { ...c, notes } : c
  );
  setState({ characters: updatedChars });
  
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: { text: '💾 Заметки сохранены!' }
  }));
}