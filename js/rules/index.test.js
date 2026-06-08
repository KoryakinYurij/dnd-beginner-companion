import {
  calculateDefaultAC,
  getModifier,
  getProficiencyBonus,
  getXPForNextLevel,
  getStartingHP,
  getLevelUpHP
} from './index.js';

describe('calculateDefaultAC', () => {
  describe('Unarmored', () => {
    it('calculates AC correctly without armor and shield', () => {
      expect(calculateDefaultAC(0)).toBe(10);
      expect(calculateDefaultAC(2)).toBe(12);
      expect(calculateDefaultAC(-1)).toBe(9);
    });

    it('adds +2 AC for shield when unarmored', () => {
      expect(calculateDefaultAC(2, '', true)).toBe(14);
      expect(calculateDefaultAC(-1, '', true)).toBe(11);
    });
  });

  describe('Light Armor', () => {
    it('calculates Leather armor correctly (AC 11 + DEX)', () => {
      expect(calculateDefaultAC(3, 'Leather')).toBe(14);
      expect(calculateDefaultAC(-1, 'кожаная')).toBe(10);
    });

    it('calculates Studded Leather correctly (AC 12 + DEX)', () => {
      expect(calculateDefaultAC(4, 'Studded Leather')).toBe(16);
      expect(calculateDefaultAC(0, 'проклёпанная')).toBe(12);
    });

    it('adds shield bonus', () => {
      expect(calculateDefaultAC(3, 'Leather', true)).toBe(16);
    });
  });

  describe('Medium Armor', () => {
    it('calculates Hide armor correctly (AC 12 + DEX, max 2)', () => {
      expect(calculateDefaultAC(1, 'Hide')).toBe(13);
      expect(calculateDefaultAC(4, 'шкуряной')).toBe(14); // Capped at +2
      expect(calculateDefaultAC(-1, 'Hide')).toBe(11); // Negative DEX still applies
    });

    it('calculates Scale Mail correctly (AC 14 + DEX, max 2)', () => {
      expect(calculateDefaultAC(3, 'Scale Mail')).toBe(16);
      expect(calculateDefaultAC(0, 'чешуйчатый')).toBe(14);
    });

    it('calculates Chain Shirt correctly (AC 13 + DEX, max 2)', () => {
      expect(calculateDefaultAC(5, 'Chain Shirt')).toBe(15);
      expect(calculateDefaultAC(2, 'кольчужная рубаха')).toBe(15);
    });

    it('calculates Breastplate correctly (AC 14 + DEX, max 2)', () => {
      expect(calculateDefaultAC(1, 'Breastplate')).toBe(15);
      expect(calculateDefaultAC(5, 'кираса')).toBe(16);
    });

    it('calculates Half Plate correctly (AC 15 + DEX, max 2)', () => {
      expect(calculateDefaultAC(2, 'Half Plate')).toBe(17);
      expect(calculateDefaultAC(5, 'полулаты')).toBe(17);
    });

    it('adds shield bonus', () => {
      expect(calculateDefaultAC(3, 'Half Plate', true)).toBe(19);
    });
  });

  describe('Heavy Armor', () => {
    it('calculates Chain Mail correctly (AC 16, ignores DEX)', () => {
      expect(calculateDefaultAC(5, 'Chain Mail')).toBe(16);
      expect(calculateDefaultAC(-2, 'кольчуга')).toBe(16);
    });

    it('calculates Splint armor correctly (AC 17, ignores DEX)', () => {
      expect(calculateDefaultAC(3, 'Splint')).toBe(17);
      expect(calculateDefaultAC(-1, 'наборный')).toBe(17);
    });

    it('calculates Plate armor correctly (AC 18, ignores DEX)', () => {
      expect(calculateDefaultAC(5, 'Plate')).toBe(18);
      expect(calculateDefaultAC(-5, 'латы')).toBe(18);
    });

    it('adds shield bonus', () => {
      expect(calculateDefaultAC(2, 'Plate', true)).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown armor names by treating as unarmored', () => {
      expect(calculateDefaultAC(2, 'Mithral Unknown Armor')).toBe(12);
    });

    it('handles uppercase and mixed case names', () => {
      expect(calculateDefaultAC(2, 'LEATHER')).toBe(13);
      expect(calculateDefaultAC(2, 'StUdDeD LeAtHeR')).toBe(14);
      expect(calculateDefaultAC(3, 'КоЛЬчУгА')).toBe(16);
    });

    it('handles empty string armor properly', () => {
      expect(calculateDefaultAC(2, '')).toBe(12);
    });

    it('handles undefined armor properly', () => {
      expect(calculateDefaultAC(2)).toBe(12);
    });
  });
});

describe('getModifier', () => {
  it('correctly calculates positive and negative modifiers', () => {
    expect(getModifier(1)).toBe(-5);
    expect(getModifier(8)).toBe(-1);
    expect(getModifier(9)).toBe(-1);
    expect(getModifier(10)).toBe(0);
    expect(getModifier(11)).toBe(0);
    expect(getModifier(12)).toBe(1);
    expect(getModifier(15)).toBe(2);
    expect(getModifier(20)).toBe(5);
    expect(getModifier(30)).toBe(10);
  });
});

describe('getProficiencyBonus', () => {
  it('returns correct proficiency bonus for valid levels', () => {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(4)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(8)).toBe(3);
    expect(getProficiencyBonus(9)).toBe(4);
    expect(getProficiencyBonus(12)).toBe(4);
    expect(getProficiencyBonus(13)).toBe(5);
    expect(getProficiencyBonus(16)).toBe(5);
    expect(getProficiencyBonus(17)).toBe(6);
    expect(getProficiencyBonus(20)).toBe(6);
  });

  it('handles edge cases (out of bounds levels)', () => {
    expect(getProficiencyBonus(0)).toBe(2); // Should clamp to level 1
    expect(getProficiencyBonus(-5)).toBe(2); // Should clamp to level 1
    expect(getProficiencyBonus(25)).toBe(6); // Should clamp to level 20
  });
});

describe('getXPForNextLevel', () => {
  it('returns required XP for valid levels', () => {
    expect(getXPForNextLevel(1)).toBe(300); // Index 1 is level 2 in XP_TABLE
    expect(getXPForNextLevel(2)).toBe(900);
    expect(getXPForNextLevel(19)).toBe(355000); // Index 19 is level 20
  });

  it('returns null for max level or above', () => {
    expect(getXPForNextLevel(20)).toBeNull();
    expect(getXPForNextLevel(25)).toBeNull();
  });
});

describe('getStartingHP', () => {
  it('calculates correct starting HP based on hitDie and CON mod', () => {
    expect(getStartingHP(6, 0)).toBe(6);
    expect(getStartingHP(8, 2)).toBe(10);
    expect(getStartingHP(10, -1)).toBe(9);
    expect(getStartingHP(12, 5)).toBe(17);
  });
});

describe('getLevelUpHP', () => {
  it('calculates average HP correctly', () => {
    // hitDie / 2 + 1 + conMod
    expect(getLevelUpHP(6, 0, true)).toBe(4); // 3 + 1 + 0
    expect(getLevelUpHP(8, 2, true)).toBe(7); // 4 + 1 + 2
    expect(getLevelUpHP(10, -1, true)).toBe(5); // 5 + 1 - 1
    expect(getLevelUpHP(12, 5, true)).toBe(12); // 6 + 1 + 5
  });

  it('calculates random HP correctly', () => {
    // Mock Math.random to always return 0.5 (middle of the die)
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5;
    global.Math = mockMath;

    // hitDie = 8 -> 0.5 * 8 = 4, floor(4) = 4, +1 = 5.
    // 5 + 2 = 7
    expect(getLevelUpHP(8, 2, false)).toBe(7);

    // hitDie = 12 -> 0.5 * 12 = 6, floor(6) = 6, +1 = 7.
    // 7 - 1 = 6
    expect(getLevelUpHP(12, -1, false)).toBe(6);

    // Test minimum 1 enforcement
    mockMath.random = () => 0.01; // lowest roll = 1
    // roll = 1, mod = -5 -> 1 - 5 = -4 -> should be 1
    expect(getLevelUpHP(8, -5, false)).toBe(1);
  });
});

describe('getLevelUpHP defaults', () => {
  it('uses average HP by default', () => {
    // hitDie = 8, conMod = 2 -> expected avg is 4 + 1 + 2 = 7
    expect(getLevelUpHP(8, 2)).toBe(7);
  });
});
