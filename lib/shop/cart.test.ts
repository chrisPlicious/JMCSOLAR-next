import { describe, it, expect } from 'vitest';
import {
  clampQty,
  addLine,
  updateLineQty,
  removeLine,
  cartSubtotalCentavos,
  cartTotalQuantity,
} from './cart';
import { lineKey, type CartLine, type CartLineInput } from '@/components/shop/CartContext';

function makeInput(over: Partial<CartLineInput> = {}): CartLineInput {
  return {
    shopItemId: 'item1',
    variantId: null,
    name: 'Solar Light',
    variantLabel: null,
    sku: 'SL-1',
    slug: 'solar-light',
    unitPriceCentavos: 50000,
    imageUrl: null,
    maxStock: 10,
    ...over,
  };
}

function makeLine(over: Partial<CartLine> = {}): CartLine {
  return { ...makeInput(over), quantity: over.quantity ?? 1 };
}

describe('clampQty', () => {
  it('returns the quantity unchanged when within [1, maxStock]', () => {
    expect(clampQty(3, 10)).toBe(3);
  });

  it('caps the quantity at maxStock when over', () => {
    expect(clampQty(15, 10)).toBe(10);
  });

  it('returns 0 when the quantity is below 1', () => {
    expect(clampQty(0, 10)).toBe(0);
    expect(clampQty(-5, 10)).toBe(0);
  });

  it('returns 0 for a non-finite quantity', () => {
    expect(clampQty(NaN, 10)).toBe(0);
    expect(clampQty(Infinity, 10)).toBe(0);
  });

  it('returns 0 when maxStock is 0', () => {
    expect(clampQty(3, 0)).toBe(0);
  });

  it('floors a decimal quantity', () => {
    expect(clampQty(3.9, 10)).toBe(3);
  });

  it('floors a decimal maxStock', () => {
    expect(clampQty(10, 4.9)).toBe(4);
  });
});

describe('addLine', () => {
  it('appends a new line with the clamped quantity', () => {
    const result = addLine([], makeInput(), 2);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  it('defaults the quantity to 1', () => {
    const result = addLine([], makeInput());
    expect(result[0].quantity).toBe(1);
  });

  it('clamps a new line to maxStock', () => {
    const result = addLine([], makeInput({ maxStock: 5 }), 99);
    expect(result[0].quantity).toBe(5);
  });

  it('merges (sums) quantity onto the same item + variant', () => {
    const start = [makeLine({ quantity: 2 })];
    const result = addLine(start, makeInput(), 3);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it('clamps the merged quantity to maxStock', () => {
    const start = [makeLine({ quantity: 8, maxStock: 10 })];
    const result = addLine(start, makeInput({ maxStock: 10 }), 5);
    expect(result[0].quantity).toBe(10);
  });

  it('treats a different variant of the same item as a separate line', () => {
    const start = [makeLine({ variantId: 'a', quantity: 1 })];
    const result = addLine(start, makeInput({ variantId: 'b' }), 1);
    expect(result).toHaveLength(2);
  });

  it('is a no-op when the quantity clamps to 0 for a new line', () => {
    const start: CartLine[] = [];
    const result = addLine(start, makeInput(), 0);
    expect(result).toBe(start);
  });

  it('is a no-op when a merge would clamp below 1 (negative quantity)', () => {
    const start = [makeLine({ quantity: 1 })];
    const result = addLine(start, makeInput(), -1);
    expect(result).toBe(start);
  });
});

describe('updateLineQty', () => {
  it('sets the quantity, clamped to maxStock', () => {
    const start = [makeLine({ quantity: 1, maxStock: 10 })];
    const result = updateLineQty(start, 'item1', null, 4);
    expect(result[0].quantity).toBe(4);
  });

  it('caps the quantity at maxStock', () => {
    const start = [makeLine({ quantity: 1, maxStock: 5 })];
    const result = updateLineQty(start, 'item1', null, 99);
    expect(result[0].quantity).toBe(5);
  });

  it('removes the line when the quantity is 0 or below', () => {
    const start = [makeLine({ quantity: 3 })];
    expect(updateLineQty(start, 'item1', null, 0)).toHaveLength(0);
  });

  it('leaves the list unchanged for an unknown line', () => {
    const start = [makeLine({ quantity: 3 })];
    const result = updateLineQty(start, 'other', null, 2);
    expect(result).toBe(start);
  });
});

describe('removeLine', () => {
  it('removes only the matching item + variant line', () => {
    const start = [
      makeLine({ shopItemId: 'a', variantId: null }),
      makeLine({ shopItemId: 'b', variantId: null }),
    ];
    const result = removeLine(start, 'a', null);
    expect(result).toHaveLength(1);
    expect(result[0].shopItemId).toBe('b');
  });

  it('does not collide a simple item with a variant of the same product', () => {
    const start = [
      makeLine({ shopItemId: 'a', variantId: null }),
      makeLine({ shopItemId: 'a', variantId: 'v1' }),
    ];
    const result = removeLine(start, 'a', null);
    expect(result).toHaveLength(1);
    expect(result[0].variantId).toBe('v1');
  });
});

describe('cartSubtotalCentavos', () => {
  it('returns 0 for an empty cart', () => {
    expect(cartSubtotalCentavos([])).toBe(0);
  });

  it('sums unit price × quantity across lines (in centavos)', () => {
    const items = [
      makeLine({ unitPriceCentavos: 50000, quantity: 2 }),
      makeLine({ shopItemId: 'b', unitPriceCentavos: 12345, quantity: 3 }),
    ];
    expect(cartSubtotalCentavos(items)).toBe(50000 * 2 + 12345 * 3);
  });
});

describe('cartTotalQuantity', () => {
  it('returns 0 for an empty cart', () => {
    expect(cartTotalQuantity([])).toBe(0);
  });

  it('sums quantities across lines', () => {
    const items = [
      makeLine({ quantity: 2 }),
      makeLine({ shopItemId: 'b', quantity: 5 }),
    ];
    expect(cartTotalQuantity(items)).toBe(7);
  });
});

describe('lineKey', () => {
  it('distinguishes a simple item (null variant) from a variant of the same product', () => {
    expect(lineKey('item1', null)).not.toBe(lineKey('item1', 'v1'));
  });

  it('produces the same key for the same item + variant', () => {
    expect(lineKey('item1', 'v1')).toBe(lineKey('item1', 'v1'));
  });
});
