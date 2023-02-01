import { describe, it, expect, beforeEach, vi } from "vitest";

import { getCardFields, hasCardFields, submitCardFields } from "../../../src/card/interface";

import { getCardProps } from "../../../src/card/props";
import { resetGQLErrors } from "../../../src/card/interface/gql";
import { vaultPaymentSource } from "../../../src/card/interface/vaultPaymentSource";
import { INTENT } from "@paypal/sdk-constants";
import { confirmOrderAPI, tokenizeCard } from "../../../src/api";

vi.mock('../../../src/card/props', () => {
  return {
    getCardProps: vi.fn(() => ({

    })),
  };
});

vi.mock('../../../src/card/interface/hasCardFields', () => {
  return {
    hasCardFields: vi.fn(() => true)
  }
})

const mockGetCardFieldsReturn = {
  name: 'John Doe',
  number: '4111111111111111',
  cvv: '123',
  expiry: '01/24',
  postal: '91210'
};

vi.mock('../../../src/card/interface/getCardFields', () => {
  return {
    getCardFields: vi.fn(() => mockGetCardFieldsReturn)
  }
});

vi.mock('../../../src/card/interface/gql', () => ({
  resetGQLErrors: vi.fn(),
}));

vi.mock('../../../src/card/interface/vaultPaymentSource', () => ({
  vaultPaymentSource: vi.fn(),
}));

const mockInfo = vi.fn();

vi.mock('../../../src/lib', () => ({
  getLogger: () => ({
    info: mockInfo
  }),
}));

vi.mock('../../../src/api', () => ({
  tokenizeCard: vi.fn(() => Promise.resolve({ paymentMethodToken: 'test-payment-method-token' })),
  confirmOrderAPI: vi.fn(() => Promise.resolve({ id: 'test-order-id' })),
}))

describe('card/interface/submitCardFields', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // calls getCardProps
  it('should get cardprops', async () => {
    const options = {
      facilitatorAccessToken: 'test-access-token',
      featureFlags: { 'test': true }
    };

    await submitCardFields(options);

    expect.assertions(2);
    expect(getCardProps).toHaveBeenCalledOnce();
    expect(getCardProps).toHaveBeenCalledWith(options);
  });

  // calls resetGQLErrors
  it('should reset GQL errors', async () => {
    const options = {
      facilitatorAccessToken: 'test-access-token',
    }

    await submitCardFields(options);

    expect.assertions(1);
    expect(resetGQLErrors).toHaveBeenCalledOnce();
  });

  it('should throw an error if we do not have card fields', async () => {
    hasCardFields.mockReturnValueOnce(false);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    }

    expect.assertions(1);
    await expect(() => submitCardFields(options)).rejects.toThrowError('Card fields not available to submit');
  });

  it('should throw an error if we do not have a card', async () => {
    getCardFields.mockReturnValueOnce(null);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    }

    expect.assertions(1);
    await expect(() => submitCardFields(options)).rejects.toThrowError('Card not available to submit');
  })

  it('should use the provided save action', async () => {
    const onCreateVaultSetupToken = vi.fn();
    const onApprove = vi.fn();

    const mockGetCardPropsReturn = {
      action: {
        type: 'save',
        onApprove,
        onCreateVaultSetupToken,
      }
    };
    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    expect.assertions(2);
    await submitCardFields(options);

    expect(vaultPaymentSource).toHaveBeenCalledOnce();
    expect(vaultPaymentSource).toHaveBeenCalledWith({
      action: mockGetCardPropsReturn.action,
      lowScopedAccessToken: 'test-access-token',
      paymentSourceDetails: mockGetCardFieldsReturn
    });
  });

  it('should throw an error when given an unsupported action', async () => {
    const mockGetCardPropsReturn = {
      action: {
        type: 'testing',
      }
    };

    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    expect.assertions(3);
    await expect(() => submitCardFields(options)).rejects.toThrowError('Action of type testing is not supported by Card Fields')
    expect(mockInfo).toHaveBeenCalledOnce();
    expect(mockInfo).toHaveBeenCalledWith('card_fields_unsupported_action')
  });

  it('should log and throw any error that occurs when handling a save action', async () => {
    vaultPaymentSource.mockImplementationOnce(() => {
      throw new Error('testing')
    });

    const onCreateVaultSetupToken = vi.fn();
    const onApprove = vi.fn();

    const mockGetCardPropsReturn = {
      action: {
        type: 'save',
        onApprove,
        onCreateVaultSetupToken,
      }
    };
    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    expect.assertions(3);
    await expect(() => submitCardFields(options)).rejects.toThrow('testing')
    expect(mockInfo).toHaveBeenCalledOnce();
    expect(mockInfo).toHaveBeenCalledWith('card_fields_vault_payment_source_failed')
  });

  it('should tokenize', async () => {
    const mockGetCardPropsReturn = {
      intent: INTENT.TOKENIZE,
      onApprove: vi.fn(),
    };
    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);

    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    await submitCardFields(options);

    expect.assertions(4);
    expect(tokenizeCard).toHaveBeenCalledOnce();
    expect(tokenizeCard).toHaveBeenCalledWith({ card: mockGetCardFieldsReturn });
    expect(mockGetCardPropsReturn.onApprove).toHaveBeenCalledOnce();
    expect(mockGetCardPropsReturn.onApprove).toHaveBeenCalledWith(
      { paymentMethodToken: 'test-payment-method-token' },
      { restart: expect.any(Function) }
    )
  });

  it.each(['CAPTURE', 'AUTHORIZE'])('should %s', async (mode) => {
    const mockGetCardPropsReturn = {
      intent: INTENT[mode],
      createOrder: vi.fn(() => Promise.resolve('test-order-id')),
      onApprove: vi.fn()
    };

    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);
    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    expect.assertions(5);
    await submitCardFields(options);
    expect(mockGetCardPropsReturn.createOrder).toHaveBeenCalledOnce();
    expect(confirmOrderAPI).toHaveBeenCalledOnce();
    expect(confirmOrderAPI).toHaveBeenCalledWith(
      'test-order-id',
      {
        payment_source: {
          card: {
            expiry: "24-01",
            name: "John Doe",
            number: "4111111111111111",
            "security_code": "123",
          }
        }
      },
      {
        facilitatorAccessToken: 'test-access-token',
        partnerAttributionID: ''
      }
    );
    expect(mockGetCardPropsReturn.onApprove).toHaveBeenCalledOnce();
    expect(mockGetCardPropsReturn.onApprove).toHaveBeenCalledWith({
      payerID: expect.any(String),
      buyerAccessToken: expect.any(String),
      id: 'test-order-id'
    },
    {
      restart: expect.any(Function)
    }
    );
  });

  it('should catch any errors from confirmOrderAPI', async () => {
    confirmOrderAPI.mockImplementationOnce(() => {
      throw new Error('confirm order api failure test');
    });
    const mockGetCardPropsReturn = {
      intent: INTENT.CAPTURE,
      createOrder: vi.fn(() => Promise.resolve('test-order-id')),
      onApprove: vi.fn()
    };

    getCardProps.mockReturnValueOnce(mockGetCardPropsReturn);
    const options = {
      facilitatorAccessToken: 'test-access-token',
    };

    expect.assertions(1);
    await expect(() => submitCardFields(options)).rejects.toThrow('confirm order api failure test');
  });
});