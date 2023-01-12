/* @flow */

import { INTENT, FUNDING } from '@paypal/sdk-constants/src';

import { getLegacyProps } from "./legacyProps"

describe('legacyProps', () => {
  it('should return list of legacy props', () => {
    const expectedProps = {
      createBillingAgreement: expect.any(Function),
      createSubscription: expect.any(Function),
      createOrder: expect.any(Function),
      onApprove: expect.any(Function),
      onComplete: expect.any(Function),
      onCancel: expect.any(Function),
      onShippingChange: expect.any(Function),
      onShippingAddressChange: expect.any(Function),
      onShippingOptionsChange: expect.any(Function),
      onAuth: expect.any(Function),
    }
    const inputs = {
      paymentSource: FUNDING.CARD,
      partnerAttributionID: "a-partner-attribution-id",
      merchantID: ["totes-a-merchant-id"],
      clientID: "client-id-is-me",
      facilitatorAccessToken: "facilitator-access-token",
      currency: "USD",
      enableOrdersApprovalSmartWallet: false, // uhh is this correct?
      smartWalletOrderID: "some-smart-wallet-id",
      intent: INTENT.CAPTURE,
      branded: false,
      vault: false,
      clientAccessToken: "some access token",
      featureFlags: {},
      createBillingAgreement: jest.fn(),
      createSubscription: jest.fn(),
      createOrder: jest.fn(),
      onError: jest.fn(),
      onApprove: jest.fn(),
      onComplete: jest.fn(),
      onCancel: jest.fn(),
      onShippingChange: jest.fn(),
      onShippingAddressChange: jest.fn(),
      onShippingOptionsChange: jest.fn(),
    }
    
    const result = getLegacyProps(inputs)
    expect(result).toEqual(expectedProps)
  })
})