import { describe, it, expect } from "vitest";

import { isEmpty } from "../../../src/card/interface";

describe("isEmpty", () => {
  it('returns true if the string is empty', () => {
    const string = ''

    expect(isEmpty(string)).toStrictEqual(true)
  })
  it('returns false if the string is not empty', () => {
    const string = 'foo'

    expect(isEmpty(string)).toStrictEqual(false)
  })
});