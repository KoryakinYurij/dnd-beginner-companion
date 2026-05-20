/* ==========================================================================
   D&D 5e Помощник Новичка — База данных Оружия (Weapons Data)
   ========================================================================== */

export const WEAPONS_DATA = [
  {
    name: 'Кинжал',
    nameEn: 'Dagger',
    damage: '1d4',
    damageType: 'колющий',
    properties: ['Легкое', 'Фехтовальное (STR/DEX)', 'Метательное (дистанция 20/60)'],
    weight: 1,
    category: 'simple'
  },
  {
    name: 'Булава',
    nameEn: 'Mace',
    damage: '1d6',
    damageType: 'дробящий',
    properties: [],
    weight: 4,
    category: 'simple'
  },
  {
    name: 'Четвертной посох',
    nameEn: 'Quarterstaff',
    damage: '1d6',
    damageType: 'дробящий',
    properties: ['Универсальное (1d8)'],
    weight: 4,
    category: 'simple'
  },
  {
    name: 'Копье',
    nameEn: 'Spear',
    damage: '1d6',
    damageType: 'колющий',
    properties: ['Универсальное (1d8)', 'Метательное (дистанция 20/60)'],
    weight: 3,
    category: 'simple'
  },
  {
    name: 'Легкий арбалет',
    nameEn: 'Light Crossbow',
    damage: '1d8',
    damageType: 'колющий',
    properties: ['Боеприпасы (дистанция 80/320)', 'Двуручное', 'Перезарядка'],
    weight: 5,
    category: 'simple_ranged'
  },
  {
    name: 'Короткий лук',
    nameEn: 'Shortbow',
    damage: '1d6',
    damageType: 'колющий',
    properties: ['Боеприпасы (дистанция 80/320)', 'Двуручное'],
    weight: 2,
    category: 'simple_ranged'
  },
  {
    name: 'Длинный меч',
    nameEn: 'Longsword',
    damage: '1d8',
    damageType: 'рубящий',
    properties: ['Универсальное (1d10)'],
    weight: 3,
    category: 'martial'
  },
  {
    name: 'Рапира',
    nameEn: 'Rapier',
    damage: '1d8',
    damageType: 'колющий',
    properties: ['Фехтовальное (STR/DEX)'],
    weight: 2,
    category: 'martial'
  },
  {
    name: 'Двуручный меч',
    nameEn: 'Greatsword',
    damage: '2d6',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Двуручное'],
    weight: 6,
    category: 'martial'
  },
  {
    name: 'Секира',
    nameEn: 'Greataxe',
    damage: '1d12',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Двуручное'],
    weight: 7,
    category: 'martial'
  },
  {
    name: 'Алебарда',
    nameEn: 'Halberd',
    damage: '1d10',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Двуручное', 'Досягаемость (+5 футов)'],
    weight: 6,
    category: 'martial'
  },
  {
    name: 'Короткий меч',
    nameEn: 'Shortsword',
    damage: '1d6',
    damageType: 'колющий',
    properties: ['Легкое', 'Фехтовальное (STR/DEX)'],
    weight: 2,
    category: 'martial'
  },
  {
    name: 'Длинный лук',
    nameEn: 'Longbow',
    damage: '1d8',
    damageType: 'колющий',
    properties: ['Боеприпасы (дистанция 150/600)', 'Двуручное', 'Тяжелое'],
    weight: 2,
    category: 'martial_ranged'
  },
  {
    name: 'Ручной арбалет',
    nameEn: 'Hand Crossbow',
    damage: '1d6',
    damageType: 'колющий',
    properties: ['Боеприпасы (дистанция 30/120)', 'Легкое', 'Перезарядка'],
    weight: 3,
    category: 'martial_ranged'
  },
  {
    name: 'Тяжелый арбалет',
    nameEn: 'Heavy Crossbow',
    damage: '1d10',
    damageType: 'колющий',
    properties: ['Боеприпасы (дистанция 100/400)', 'Двуручное', 'Тяжелое', 'Перезарядка'],
    weight: 9,
    category: 'martial_ranged'
  }
];
