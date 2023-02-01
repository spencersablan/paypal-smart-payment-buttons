/* @flow */

import { request } from "@krakenjs/belter/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import type { Card } from "../types";

type UpdateVaultSetupTokenOptions = {|
  vaultSetupToken: string,
  lowScopedAccessToken: string,
  paymentSourceDetails: Card
|}

export function updateVaultSetupToken({
  vaultSetupToken,
  lowScopedAccessToken,
  paymentSourceDetails,
}: UpdateVaultSetupTokenOptions): ZalgoPromise<string> {
  return request({
    method: 'post',
    url: `/v3/vault/setup-tokens/${vaultSetupToken}/update`,
    headers: {
      'Authorization': `Basic ${lowScopedAccessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      /* $FlowIgnore[incompatible-call] schema doesn't allow for nested objects */
      'payment_source': {
        'card': {
          ...paymentSourceDetails,
        }
      }
    },
  }).then(({ body }) => {
    if (!body || !body.status === 'APPROVED') {
      throw new Error('request was not approved')
    }

    return vaultSetupToken;
  });
}
