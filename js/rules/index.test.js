import { calculateDefaultAC } from './index.js';

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
