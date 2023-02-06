/* @flow */
import { describe, beforeEach, vi, test, expect } from "vitest";

import { vault } from "../../../src/card/interface/vault";
import { updateVaultSetupToken } from "../../../src/api/vault";

vi.mock("../../../src/api/vault", () => ({
  // eslint-disable-next-line compat/compat, promise/no-native, no-restricted-globals
  updateVaultSetupToken: vi.fn(() => Promise.resolve()),
}));

const createSaveAction = (options = {}) => ({
  type: "save",
  createVaultSetupToken: vi.fn().mockResolvedValue("vault-setup-token"),
  onApprove: vi.fn(),
  ...options,
});

describe("vault", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    // coming back to this test and more once we implement more un-happy paths
    // test.skip("it should handle failure from createVaultSetupToken callback", () => {});

    test("should call the provided functions", async () => {
      const options = {
        action: createSaveAction(),
        facilitatorAccessToken: "access-token",
        paymentSource: {
          card: {
            billing_address: {
              postal_code: undefined,
            },
            expiry: "01/24",
            name: "John Doe",
            number: "4111111111111111",
            security_code: "123",
          },
        },
      };

      // $FlowIssue
      await vault.create(options);

      expect.assertions(3);

      expect(options.action.createVaultSetupToken).toHaveBeenCalled();
      expect(updateVaultSetupToken).toHaveBeenCalledWith({
        vaultSetupToken: "vault-setup-token",
        facilitatorAccessToken: "access-token",
        partnerAttributionID: "",
        paymentSource: {
          card: {
            billing_address: {
              postal_code: undefined,
            },
            expiry: "01/24",
            name: "John Doe",
            number: "4111111111111111",
            security_code: "123",
          },
        },
      });
      expect(options.action.onApprove).toHaveBeenCalledWith({
        vaultSetupToken: "vault-setup-token",
      });
    });
  });
});
