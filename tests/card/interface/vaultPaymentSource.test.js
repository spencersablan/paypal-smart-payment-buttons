import { describe, beforeEach, vi, it, expect } from "vitest";

import { vaultPaymentSource } from "../../../src/card/interface";
import { updateVaultSetupToken } from "../../../src/card/interface";

vi.mock('../../../src/card/interface/updateVaultSetupToken', () => ({
  updateVaultSetupToken: vi.fn(() => Promise.resolve()),
}));

describe("vaultPaymentSource", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call the provided functions", async () => {
    const options = {
      action: {
        type: 'save',
        createVaultSetupToken: vi.fn(() => Promise.resolve({ vaultSetupToken: 'vault-setup-token' })),
        onApprove: vi.fn()
      },
      lowScopedAccessToken: 'access-token',
      paymentSourceDetails: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '01/29',
        name: 'John Doe',
        postalCode: '91210'
      }
    };

    await vaultPaymentSource(options)

    expect.assertions(4);

    expect(options.action.createVaultSetupToken).toHaveBeenCalledOnce();
    expect(updateVaultSetupToken).toHaveBeenCalledOnce();
    expect(updateVaultSetupToken).toHaveBeenCalledWith({
      vaultSetupToken: 'vault-setup-token',
      lowScopedAccessToken: 'access-token',
      paymentSourceDetails: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '01/29',
        name: 'John Doe',
        postalCode: '91210'
      }
    })
    expect(options.action.onApprove).toHaveBeenCalledOnce();
  });
});