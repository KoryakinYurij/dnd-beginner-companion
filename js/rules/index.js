/* ==========================================================================
   D&D 5e Помощник Новичка — Единая база Правил (Rules Index)
   ========================================================================== */

import { CLASSES_DATA } from './classes.js';
import { RACES_DATA } from './races.js';
import { SPELLS_DATA } from './spells.js';
import { WEAPONS_DATA } from './weapons.js';
import { BACKGROUNDS_DATA } from './backgrounds.js';
import { CONDITIONS_DATA } from './conditions.js';

export {
  CLASSES_DATA,
  RACES_DATA,
  SPELLS_DATA,
  WEAPONS_DATA,
  BACKGROUNDS_DATA,
  CONDITIONS_DATA
};

// Таблица опыта и Бонуса мастерства (PHB p. 15)
export const XP_TABLE = [
  { level: 1,  xp: 0,       profBonus: 2 },
  { level: 2,  xp: 300,     profBonus: 2 },
  { level: 3,  xp: 900,     profBonus: 2 },
  { level: 4,  xp: 2700,    profBonus: 2 },
  { level: 5,  xp: 6500,    profBonus: 3 },
  { level: 6,  xp: 14000,   profBonus: 3 },
  { level: 7,  xp: 23000,   profBonus: 3 },
  { level: 8,  xp: 34000,   profBonus: 3 },
  { level: 9,  xp: 48000,   profBonus: 4 },
  { level: 10, xp: 64000,   profBonus: 4 },
  { level: 11, xp: 85000,   profBonus: 4 },
  { level: 12, xp: 100000,  profBonus: 4 },
  { level: 13, xp: 120000,  profBonus: 5 },
  { level: 14, xp: 140000,  profBonus: 5 },
  { level: 15, xp: 165000,  profBonus: 5 },
  { level: 16, xp: 195000,  profBonus: 5 },
  { level: 17, xp: 225000,  profBonus: 6 },
  { level: 18, xp: 265000,  profBonus: 6 },
  { level: 19, xp: 305000,  profBonus: 6 },
  { level: 20, xp: 355000,  profBonus: 6 }
];

// Список всех 18 навыков D&D 5e с их ассоциированными характеристиками и описанием
export const SKILLS_DATA = [
  { name: 'Атлетика', nameEn: 'Athletics', ability: 'STR', desc: 'Прыжки, лазание по стенам, плавание в бурной воде, удерживание веса.' },
  
  { name: 'Акробатика', nameEn: 'Acrobatics', ability: 'DEX', desc: 'Удержание равновесия на узких поверхностях, кульбиты, уклонение от захватов.' },
  { name: 'Ловкость рук', nameEn: 'Sleight of Hand', desc: 'Кражи из карманов, фокусы, развязывание узлов, скрытое передавание предметов.' },
  { name: 'Скрытность', nameEn: 'Stealth', desc: 'Бесшумное передвижение, прятанье от патрулей, незаметный проход в тени.' },
  
  { name: 'Магия', nameEn: 'Arcana', ability: 'INT', desc: 'Знание заклинаний, магических артефактов, планов существования и существ вроде големов.' },
  { name: 'История', nameEn: 'History', ability: 'INT', desc: 'Знание исторических событий, великих правителей, древних войн, легендарных руин.' },
  { name: 'Расследование', nameEn: 'Investigation', ability: 'INT', desc: 'Поиск скрытых механизмов, анализ улик, расшифровка тайных шифров.' },
  { name: 'Природа', nameEn: 'Nature', ability: 'INT', desc: 'Знание лечебных трав, повадок диких животных, погодных явлений и географии.' },
  { name: 'Религия', nameEn: 'Religion', ability: 'INT', desc: 'Знание религиозных обрядов, божеств, иерархий храмов и священных текстов.' },
  
  { name: 'Уход за животными', nameEn: 'Animal Handling', ability: 'WIS', desc: 'Приручение диких зверей, успокоение испуганного скакуна, управление повозкой.' },
  { name: 'Проницательность', nameEn: 'Insight', ability: 'WIS', desc: 'Определение лжи по мимике и жестам, чтение скрытых мотивов людей.' },
  { name: 'Медицина', nameEn: 'Medicine', ability: 'WIS', desc: 'Стабилизация умирающих, перевязка ран, диагностика болезней и ядов.' },
  { name: 'Восприятие', nameEn: 'Perception', ability: 'WIS', desc: 'Внимание к звукам, мелким деталям в комнате, обнаружение скрытых ловушек и засад.' },
  { name: 'Выживание', nameEn: 'Survival', ability: 'WIS', desc: 'Ориентирование в лесу, разведение костра, поиск следов и съедобных ягод.' },
  
  { name: 'Обман', nameEn: 'Deception', ability: 'CHA', desc: 'Ложь, маскировка под другого человека, блеф в карточных играх.' },
  { name: 'Запугивание', nameEn: 'Intimidation', ability: 'CHA', desc: 'Физические угрозы, психологическое давление с целью получить информацию.' },
  { name: 'Выступление', nameEn: 'Performance', ability: 'CHA', desc: 'Пение, игра на лютне, танцы, театральное мастерство, привлечение толпы.' },
  { name: 'Убеждение', nameEn: 'Persuasion', ability: 'CHA', desc: 'Дипломатия, аргументированный спор, призыв к здравому смыслу или чести.' }
];

/**
 * Рассчитывает модификатор характеристики по ее значению.
 * Формула: floor((Score - 10) / 2)
 * @param {number} score - Значение характеристики (3-30).
 * @returns {number}
 */
export function getModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Возвращает Бонус Мастерства для уровня.
 * @param {number} level - Уровень персонажа (1-20).
 * @returns {number}
 */
export function getProficiencyBonus(level) {
  const levelIdx = Math.max(1, Math.min(20, level)) - 1;
  return XP_TABLE[levelIdx].profBonus;
}

/**
 * Возвращает необходимое количество XP для следующего уровня.
 * @param {number} level - Текущий уровень (1-20).
 * @returns {number|null} - Null если уровень максимальный (20).
 */
export function getXPForNextLevel(level) {
  if (level >= 20) return null;
  return XP_TABLE[level].xp;
}

/**
 * Рассчитывает максимальное здоровье (HP) на 1-м уровне.
 * @param {number} hitDie - Грань кости хитов класса (6, 8, 10, 12).
 * @param {number} conMod - Модификатор Телосложения (CON).
 * @returns {number}
 */
export function getStartingHP(hitDie, conMod) {
  return hitDie + conMod;
}

/**
 * Вычисляет прирост здоровья при повышении уровня.
 * @param {number} hitDie - Грань кости хитов.
 * @param {number} conMod - Модификатор Телосложения.
 * @param {boolean} [useAverage=true] - Брать среднее значение или случайное (бросок).
 * @returns {number}
 */
export function getLevelUpHP(hitDie, conMod, useAverage = true) {
  if (useAverage) {
    const avg = Math.floor(hitDie / 2) + 1;
    return avg + conMod;
  } else {
    // Случайный бросок кости хитов (минимум 1)
    const roll = Math.floor(Math.random() * hitDie) + 1;
    return Math.max(1, roll + conMod);
  }
}

/**
 * Автоматический расчет Класса Брони (AC) по надетой экипировке и ловкости.
 * @param {number} dexMod - Модификатор Ловкости (DEX).
 * @param {string} armorName - Название надетого доспеха.
 * @param {boolean} hasShield - Есть ли в руках щит (+2 AC).
 * @returns {number}
 */
export function calculateDefaultAC(dexMod, armorName = '', hasShield = false) {
  let baseAC = 10 + dexMod;
  
  if (armorName) {
    const name = armorName.toLowerCase();
    
    // Легкие доспехи: Броня + DEX
    if (name.includes('проклёпан') || name.includes('studded')) {
      baseAC = 12 + dexMod;
    } else if (name.includes('кожан') || name.includes('leather')) {
      baseAC = 11 + dexMod;
    }
    
    // Средние доспехи: Броня + DEX (макс +2)
    else if (name.includes('шкурян') || name.includes('hide')) {
      baseAC = 12 + Math.min(2, dexMod);
    } else if (name.includes('чешуйчат') || name.includes('scale')) {
      baseAC = 14 + Math.min(2, dexMod);
    } else if (name.includes('кольчужн') || name.includes('chain shirt')) {
      baseAC = 13 + Math.min(2, dexMod);
    } else if (name.includes('кираса') || name.includes('breastplate')) {
      baseAC = 14 + Math.min(2, dexMod);
    } else if (name.includes('полулат') || name.includes('half plate')) {
      baseAC = 15 + Math.min(2, dexMod);
    }
    
    // Тяжелые доспехи: Фиксированное значение брони (DEX не учитывается)
    else if (name.includes('кольчуга') || name.includes('chain mail')) {
      baseAC = 16;
    } else if (name.includes('наборн') || name.includes('splint')) {
      baseAC = 17;
    } else if (name.includes('лат') || name.includes('plate')) {
      baseAC = 18;
    }
  }
  
  // Добавляем щит (+2 AC)
  if (hasShield) {
    baseAC += 2;
  }
  
  return baseAC;
}
