import { descendantIds, wouldLoop } from './category-tree';

const rows = [
  { id: 'food', parentCategoryId: null },
  { id: 'veg', parentCategoryId: 'food' },
  { id: 'roots', parentCategoryId: 'veg' },
  { id: 'fish', parentCategoryId: 'food' },
  { id: 'other', parentCategoryId: null },
];

describe('category tree', () => {
  it('lists a category and everything below it', () => {
    expect(descendantIds(rows, 'food').sort()).toEqual(['fish', 'food', 'roots', 'veg']);
    expect(descendantIds(rows, 'veg').sort()).toEqual(['roots', 'veg']);
    expect(descendantIds(rows, 'other')).toEqual(['other']);
  });

  it('does not hang on a broken loop in the data', () => {
    const loop = [
      { id: 'a', parentCategoryId: 'b' },
      { id: 'b', parentCategoryId: 'a' },
    ];
    expect(descendantIds(loop, 'a').sort()).toEqual(['a', 'b']);
  });

  it('refuses to move a category under itself or its own child', () => {
    expect(wouldLoop(rows, 'food', 'roots')).toBe(true);
    expect(wouldLoop(rows, 'veg', 'veg')).toBe(true);
    expect(wouldLoop(rows, 'veg', 'fish')).toBe(false);
    expect(wouldLoop(rows, 'veg', null)).toBe(false);
  });
});
