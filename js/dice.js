/* ==========================================================================
   D&D 5e Помощник Новичка — Движок бросков кубиков (Dice Rolling Engine)
   ========================================================================== */

import { setState, getState } from './state.js';
import { $, formatModifier } from './utils.js';

// Аудио-контекст для Web Audio API
let audioCtx = null;
let soundEnabled = true;

/**
 * Инициализирует аудио-контекст по первому клику пользователя (требование браузеров)
 */
export function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API не поддерживается в этом браузере.', e);
  }
}

/**
 * Переключает активность звука
 * @param {boolean} [enabled] - Задать значение принудительно
 * @returns {boolean} - Текущее состояние звука
 */
export function toggleSound(enabled) {
  soundEnabled = enabled !== undefined ? enabled : !soundEnabled;
  return soundEnabled;
}

/**
 * Генерирует синтезированный звук катящихся кубиков через белый шум и фильтры.
 * Полностью автономно, не требует аудиофайлов!
 */
export function playDiceSound() {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') {
    // Пытаемся возобновить, если приостановлено
    audioCtx?.resume();
    if (!audioCtx || audioCtx.state === 'suspended') return;
  }

  const duration = 0.45; // Длительность звука в секундах
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  // Заполняем буфер белым шумом
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Создаем источник звука
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;

  // Создаем полосовой фильтр (Bandpass), чтобы шум звучал как глухой стук дерева/пластика
  const filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.value = 1100; // Частота стука кубика
  filterNode.Q.value = 3.0; // Ширина полосы пропускания

  // Создаем узел управления громкостью (огибающую)
  const gainNode = audioCtx.createGain();
  
  // Рисуем огибающую звука (резкий старт, быстрое угасание с парой мелких "отскоков")
  const now = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  // Первый удар
  gainNode.gain.linearRampToValueAtTime(0.35, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
  // Второй отскок
  gainNode.gain.linearRampToValueAtTime(0.18, now + 0.14);
  gainNode.gain.exponentialRampToValueAtTime(0.04, now + 0.25);
  // Третий отскок
  gainNode.gain.linearRampToValueAtTime(0.08, now + 0.27);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Соединяем узлы
  noiseNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Запускаем воспроизведение
  noiseNode.start(now);
  noiseNode.stop(now + duration);
}

/* ==========================================================================
   Логика математических расчётов бросков
   ========================================================================== */

/**
 * Базовый бросок случайного числа от 1 до sides.
 * @param {number} sides - Количество граней кубика (4, 6, 8, 10, 12, 20, 100).
 * @returns {number}
 */
export function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Выполняет бросок 4d6 и отбрасывает наименьший результат (для создания персонажа).
 * @returns {Object} - { rolls: [d1, d2, d3, d4], droppedIndex: number, total: number }
 */
export function roll4d6DropLowest() {
  playDiceSound();
  const rolls = [roll(6), roll(6), roll(6), roll(6)];
  
  // Находим индекс минимального значения
  let minVal = 7;
  let minIdx = -1;
  for (let i = 0; i < 4; i++) {
    if (rolls[i] < minVal) {
      minVal = rolls[i];
      minIdx = i;
    }
  }
  
  // Считаем сумму без минимального
  const total = rolls.reduce((sum, val, idx) => {
    return idx === minIdx ? sum : sum + val;
  }, 0);

  return {
    rolls,
    droppedIndex: minIdx,
    total
  };
}

/**
 * Бросок нескольких костей одного типа с модификатором (например, 2d6 + 3).
 * @param {number} count - Количество костей.
 * @param {number} sides - Количество граней.
 * @param {number} modifier - Модификатор.
 * @returns {Object} - { rolls: [], total: number }
 */
export function rollMultiple(count, sides, modifier = 0) {
  playDiceSound();
  const rolls = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const val = roll(sides);
    rolls.push(val);
    sum += val;
  }
  return {
    rolls,
    total: sum + modifier
  };
}

/**
 * Бросок d20 с модификатором и выводом в лог и тосты.
 * @param {number} sides - Обычно 20 для проверок.
 * @param {number} modifier - Прибавляемый модификатор.
 * @param {string} label - Название броска (например, "Атлетика" или "Спасбросок Воли").
 * @param {Object} [options] - Дополнительные параметры (advantage: 'adv'|'dis'|null, etc.).
 */
export function rollWithMod(sides, modifier = 0, label = 'Бросок', options = {}) {
  playDiceSound();
  
  const adv = options.advantage || null; // 'adv' (преимущество), 'dis' (помеха)
  
  let roll1 = roll(sides);
  let roll2 = adv ? roll(sides) : null;
  
  let finalDieResult = roll1;
  let advantageText = '';
  
  if (adv === 'adv') {
    finalDieResult = Math.max(roll1, roll2);
    advantageText = ` (с Преимуществом: броски [${roll1}, ${roll2}])`;
  } else if (adv === 'dis') {
    finalDieResult = Math.min(roll1, roll2);
    advantageText = ` (с Помехой: броски [${roll1}, ${roll2}])`;
  }
  
  const total = finalDieResult + modifier;
  const isCrit = sides === 20 && finalDieResult === 20;
  const isCritFail = sides === 20 && finalDieResult === 1;
  
  const formula = `${sides === 20 ? 'd20' : 'd' + sides} ${formatModifier(modifier)}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const rollResult = {
    id: Math.random().toString(36).substring(2, 9),
    label,
    sides,
    dieResult: finalDieResult,
    modifier,
    total,
    isCrit,
    isCritFail,
    formula,
    timestamp,
    advantageText
  };

  // Сохраняем бросок в глобальный лог состояния
  const currentLog = getState().rollLog || [];
  const updatedLog = [rollResult, ...currentLog].slice(0, 50); // храним последние 50
  setState({ rollLog: updatedLog });

  // Показываем Toast с анимацией
  showRollToast(rollResult);

  // Тактильная вибрация на телефонах (при критах сильнее)
  if (navigator.vibrate) {
    if (isCrit) navigator.vibrate([100, 50, 100]);
    else if (isCritFail) navigator.vibrate(200);
    else navigator.vibrate(30);
  }

  return rollResult;
}

/**
 * Создаёт красивое всплывающее уведомление (Toast) с результатом броска.
 * @param {Object} rollData - Данные броска.
 */
function showRollToast(rollData) {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  if (rollData.isCrit) toast.classList.add('crit');
  if (rollData.isCritFail) toast.classList.add('crit-fail');

  let critBadge = '';
  if (rollData.isCrit) critBadge = '🌟 КРИТ! ';
  if (rollData.isCritFail) critBadge = '💀 ПРОВАЛ! ';

  toast.innerHTML = `
    <div class="toast-left">
      <div class="toast-title" style="font-weight: 700; color: var(--accent-gold);">${rollData.label}</div>
      <div class="toast-formula" style="font-size: 0.8rem; color: var(--text-secondary);">
        Бросок: ${rollData.dieResult} ${formatModifier(rollData.modifier)}${rollData.advantageText}
      </div>
    </div>
    <div class="toast-right" style="text-align: right; margin-left: 20px;">
      <div class="toast-result" style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 900; color: ${rollData.isCrit ? 'var(--accent-gold)' : rollData.isCritFail ? 'var(--accent-red)' : 'var(--text-primary)'}">
        ${critBadge}${rollData.total}
      </div>
    </div>
  `;

  container.appendChild(toast);

  // Запуск анимации исчезновения через 4 секунды
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4500);
}
