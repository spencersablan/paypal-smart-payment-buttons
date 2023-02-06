/* @flow */
/* eslint import/no-namespace: off */
/* eslint no-empty-function: off */
import { describe, beforeEach, afterEach, test, expect, vi } from "vitest";
import { INTENT } from "@paypal/sdk-constants/src";

import * as getPropsStuff from "../props/props";
import * as getLegacyPropsStuff from "../props/legacyProps";

import { getCardProps } from "./props";

describe("getCardProps", () => {
  let getPropsSpy;
  let getLegacyPropsSpy;
  const inputs = {
    facilitatorAccessToken: "some-facilitator-access-token",
    featureFlags: {},
  };

  beforeEach(() => {
    window.xprops = {};
    getPropsSpy = vi.spyOn(getPropsStuff, "getProps");
    getLegacyPropsSpy = vi.spyOn(getLegacyPropsStuff, "getLegacyProps");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("uses getProps and legacy props when no action is present", () => {
    window.xprops = {
      intent: INTENT.TOKENIZE,
    };

    getCardProps(inputs);
    expect(getPropsSpy).toBeCalled();
    expect(getLegacyPropsSpy).toBeCalled();
  });

  describe("Actions", () => {
    const mockAction = {
      type: "SAVE",
      createVaultSetupToken: vi.fn(),
      onApprove: vi.fn(),
    };

    afterEach(() => {
      window.xprops = {};
    });

    test("supports passing of an action prop", () => {
      window.xprops.action = mockAction;
      const result = getCardProps(inputs);
      // $FlowIssue
      expect(result.action.type).toEqual(mockAction.type);
      expect(getPropsSpy).toBeCalled();
    });

    test.each([
      ["onApprove", () => {}, "Do not pass onApprove with an action."],
      ["onCancel", () => {}, "Do not pass onCancel with an action."],
      ["createOrder", () => {}, "Do not pass createOrder with an action."],
      ["intent", "some-intent", "Do not pass intent with an action."],
    ])("errors when %s and an action are provided", (prop, propValue) => {
      window.xprops = {
        action: mockAction,
        [prop]: propValue,
      };

      expect(() => getCardProps(inputs)).toThrow(
        `Do not pass ${prop} with an action.`
      );
    });
  });
});
