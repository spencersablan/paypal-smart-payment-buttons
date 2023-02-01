import { describe, it, expect, vi } from 'vitest';
import { hasCardFields } from '../../../src/card/interface';

import { getCardFrames } from '../../../src/card/interface/getCardFrames';

vi.mock('../../../src/card/interface/getCardFrames', () => ({
  getCardFrames: vi.fn(() => ({
    cardFrame: {},
  })),
}));

describe('card/interface/hasCardFields', () => {
  it('returns true if we have cardFrame', () => {
    expect(hasCardFields()).toBe(true);
  });

  it('returns true if we have number, cvv and expiry', () => {
    getCardFrames.mockReturnValueOnce({
      cardNumberFrame: {},
      cardCVVFrame: {},
      cardExpiryFrame: {},
    });

    expect(hasCardFields()).toBe(true);
  });

  it('returns false when there is no card frame', () => {
    getCardFrames.mockReturnValueOnce({});

    expect(hasCardFields()).toBe(false);
  })
});