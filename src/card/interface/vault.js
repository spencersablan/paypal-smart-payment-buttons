/* @flow */

import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import { updateVaultSetupToken, type PaymentSource } from "../../api/vault";

type SaveAction = {|
  type: string,
  createVaultSetupToken: Function,
  onApprove: Function,
|};

type VaultPaymenSourceOptions = {|
  action: SaveAction,
  facilitatorAccessToken: string,
  paymentSource: PaymentSource,
|};

const vaultPaymentSource = ({
  action,
  facilitatorAccessToken,
  paymentSource,
}: VaultPaymenSourceOptions): ZalgoPromise<void> => {
  const { createVaultSetupToken, onApprove } = action;

  // happy path for now
  // need to add error cases with fpti events for each .then
  return createVaultSetupToken().then((vaultSetupToken) => {
    return updateVaultSetupToken({
      vaultSetupToken,
      facilitatorAccessToken,
      paymentSource,
      partnerAttributionID: ''
    }).then(() => {
      return onApprove({ vaultSetupToken });
    });
  });
};

export const vault = {
  create: vaultPaymentSource,
};
