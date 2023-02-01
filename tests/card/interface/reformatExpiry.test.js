import { describe, it, expect } from "vitest";

import { reformatExpiry } from "../../../src/card/interface";

describe('reformatExpiry', () => {
  it('reformats a date from MM/YYYY to YYYY-MM', () => {
    const date = "02/2025"

    expect(reformatExpiry(date)).toStrictEqual('2025-02')
  });
});