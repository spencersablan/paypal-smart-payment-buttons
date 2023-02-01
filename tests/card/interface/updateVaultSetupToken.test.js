/* @flow */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZalgoPromise } from '@krakenjs/zalgo-promise/src';
import { request } from '@krakenjs/belter/src';

import { updateVaultSetupToken } from '../../../src/card/interface';

vi.mock('@krakenjs/belter/src', async () => {
  const actual = await vi.importActual('@krakenjs/belter/src');
  return {
    ...actual,
    request: vi.fn(() => ZalgoPromise.resolve({
      body: {
        status: 'APPROVED'
      }
    })),
  }
});

describe("updateVaultSetupToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call request with the correct", async () => {
    const options = {
      vaultSetupToken: 'vault-setup-token',
      lowScopedAccessToken: 'access-token',
      paymentSourceDetails: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '01/29',
        name: 'John Doe',
        postalCode: '91210'
      }
    };

    await updateVaultSetupToken(options);

    expect.assertions(2);

    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith({
      method: 'post',
      url: `/v3/vault/setup-tokens/${options.vaultSetupToken}/update`,
      headers: {
        'Authorization': `Basic ${options.lowScopedAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        'payment_source': {
          'card': {
            ...options.paymentSourceDetails,
          }
        }
      }
    });
  });
});
