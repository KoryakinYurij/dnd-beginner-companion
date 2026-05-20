/* ==========================================================================
   D&D 5e Помощник Новичка — Менеджер Состояния (State Manager)
   ========================================================================== */

import { generateId, debounce } from './utils.js';

// Дефолтная структура персонажа для справки и валидации
export const DEFAULT_CHARACTER = {
  id: '',
  name: 'Безымянный Герой',
  gender: 'Мужской',
  portrait: '⚔️',
  race: '',
  raceEn: '',
  class: '',
  classEn: '',
  background: '',
  backgroundEn: '',
  level: 1,
  xp: 0,
  isMilestone: true,
  inspiration: false,
  
  // Характеристики
  abilities: {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10
  },
  
  // Навыки (массив строк - названий навыков на русском, которыми владеет персонаж)
  skills: [],
  savingThrows: [], // Владение спасбросками (задаётся классом)
  
  // Боевые параметры
  hp: {
    current: 10,
    max: 10,
    temp: 0
  },
  acOverride: null, // Ручное переопределение AC
  deathSaves: {
    successes: 0,
    failures: 0
  },
  
  // Состояния (Conditions) - массив активных названий
  conditions: [],
  
  // Владения
  proficiencies: {
    armor: [],
    weapons: [],
    tools: [],
    languages: []
  },
  
  // Заклинания
  spells: [], // список объектов { name, level, school, etc. }
  spellSlots: {
    1: { current: 0, max: 0 },
    2: { current: 0, max: 0 },
    3: { current: 0, max: 0 },
    4: { current: 0, max: 0 }
  },
  
  // Инвентарь и Деньги
  inventory: [],
  coins: {
    gp: 10, // Золотые
    sp: 0,  // Серебряные
    cp: 0   // Медные
  },
  
  // Заметки
  notes: {
    session: 'Ваш дневник приключений. Записывайте сюда всё важное!\n\n**Важные квесты:**\n- Выжить на первой сессии.\n- Найти таверну.',
    npcs: '',
    quests: '',
    loot: ''
  },
  
  // Оружие и атаки
  attacks: [] // список оружия/атак
};

// Реактивное состояние
let state = {
  characters: [],
  activeCharacterId: null,
  currentScreen: 'home',
  wizardData: {}, // Временный сборщик при создании
  rollLog: [],
  activeTab: 'attacks',
  showHelp: true // глобальный переключатель тултипов
};

// Хранилище подписчиков
const subscribers = {};

/**
 * Подписка на изменение определённого ключа в состоянии.
 * @param {string} key - Ключ состояния (например, 'characters', 'activeCharacterId').
 * @param {Function} callback - Функция обратного вызова.
 */
export function subscribe(key, callback) {
  if (!subscribers[key]) {
    subscribers[key] = [];
    console.log('[subscribe] created new subscriber list for:', key);
  }
  subscribers[key].push(callback);
  console.log('[subscribe] registered for:', key, 'total:', subscribers[key].length);
}

/**
 * Изменение состояния. Вызывает только подписчиков затронутых ключей.
 * @param {Object} patch - Объект изменений.
 */
export function setState(patch) {
  const affectedKeys = [];
  
  // Обновляем состояние и выявляем затронутые ключи
  Object.keys(patch).forEach(key => {
    if (JSON.stringify(state[key]) !== JSON.stringify(patch[key])) {
      state[key] = patch[key];
      affectedKeys.push(key);
    }
  });
  
  // DEBUG: логируем что изменилось
  console.log('[setState] changed:', affectedKeys);
  
  // Запуск подписчиков для изменённых ключей
  affectedKeys.forEach(key => {
    if (subscribers[key]) {
      console.log('[setState] calling subscribers for:', key, 'count:', subscribers[key].length);
      subscribers[key].forEach(callback => callback(state[key], state));
    }
  });

  // Если изменились персонажи или активный, делаем автосохранение
  if (affectedKeys.includes('characters') || affectedKeys.includes('activeCharacterId') || affectedKeys.includes('showHelp')) {
    debouncedSave();
  }
}

/**
 * Получить копию текущего состояния.
 * @returns {Object}
 */
export function getState() {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Получить активного персонажа.
 * @returns {Object|null}
 */
export function getActiveCharacter() {
  if (!state.activeCharacterId) return null;
  return state.characters.find(c => c.id === state.activeCharacterId) || null;
}

/**
 * Добавить или обновить персонажа в базе.
 * @param {Object} characterData - Данные персонажа.
 */
export function saveCharacter(characterData) {
  const chars = [...state.characters];
  const index = chars.findIndex(c => c.id === characterData.id);
  
  if (index !== -1) {
    chars[index] = { ...DEFAULT_CHARACTER, ...chars[index], ...characterData };
  } else {
    characterData.id = characterData.id || generateId();
    chars.push({ ...DEFAULT_CHARACTER, ...characterData });
  }
  
  setState({ characters: chars });
}

/**
 * Удалить персонажа по ID.
 * @param {string} id - ID персонажа.
 */
export function deleteCharacter(id) {
  const chars = state.characters.filter(c => c.id !== id);
  const patch = { characters: chars };
  
  if (state.activeCharacterId === id) {
    patch.activeCharacterId = null;
    patch.currentScreen = 'home';
  }
  
  setState(patch);
}

/* ==========================================================================
   LocalStorage и Импорт/Экспорт
   ========================================================================== */

const STORAGE_KEY = 'dnd_companion_characters';
const SETTINGS_KEY = 'dnd_companion_settings';

/**
 * Сохранить состояние в LocalStorage
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      activeCharacterId: state.activeCharacterId,
      showHelp: state.showHelp
    }));
  } catch (error) {
    console.error('Ошибка сохранения в LocalStorage:', error);
    // Вызов кастомного события для отображения тоста об ошибке переполнения
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { text: '⚠️ Память браузера переполнена! Экспортируйте персонажей в файл.', duration: 5000 }
    }));
  }
}

// Задержка сохранения во избежание фризов при частых изменениях
const debouncedSave = debounce(saveToStorage, 300);

/**
 * Загрузить состояние из LocalStorage при запуске
 */
export function loadFromStorage() {
  try {
    const storedChars = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    
    const patch = {};
    
    if (storedChars) {
      patch.characters = JSON.parse(storedChars);
    }
    
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      patch.activeCharacterId = settings.activeCharacterId;
      patch.showHelp = settings.showHelp !== undefined ? settings.showHelp : true;
    }
    
    setState(patch);
  } catch (error) {
    console.error('Ошибка чтения из LocalStorage:', error);
  }
}

/**
 * Экспортирует персонажа в JSON файл для скачивания.
 * @param {string} id - ID персонажа.
 */
export function exportCharacter(id) {
  const char = state.characters.find(c => c.id === id);
  if (!char) return;
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  
  const sanitizedName = char.name.replace(/[^a-z0-9а-яё]/gi, '_').toLowerCase();
  downloadAnchor.setAttribute("download", `dnd_char_${sanitizedName}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Импортирует персонажа из загруженного JSON файла.
 * @param {File} file - Загруженный файл.
 * @returns {Promise<boolean>}
 */
export function importCharacter(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Минимальная валидация схемы
        if (!importedData.name || !importedData.race || !importedData.class) {
          throw new Error('Некорректный файл персонажа. Отсутствуют обязательные поля.');
        }
        
        // Генерируем новый ID, чтобы не затереть существующего, если импортируют копию
        importedData.id = generateId();
        
        // Объединяем со схемой по умолчанию
        const char = { ...DEFAULT_CHARACTER, ...importedData };
        
        const chars = [...state.characters, char];
        setState({ characters: chars });
        resolve(true);
      } catch (error) {
        console.error('Ошибка импорта персонажа:', error);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
