/* @flow */

import type { Card } from "../types"

import { updateVaultSetupToken } from "./updateVaultSetupToken";


type SaveAction = {|
  type: string,
  createVaultSetupToken: Function,
  onApprove: Function
|}

type VaultPaymenSourceOptions = {|
  action: SaveAction,
  lowScopedAccessToken: string,
  paymentSourceDetails: Card
|}

export async function vaultPaymentSource ({ action, lowScopedAccessToken, paymentSourceDetails }: VaultPaymenSourceOptions) {
  const { createVaultSetupToken, onApprove } = action;

  const { vaultSetupToken } = await createVaultSetupToken();
  await updateVaultSetupToken({ vaultSetupToken, lowScopedAccessToken, paymentSourceDetails });
  await onApprove({ vaultSetupToken });
}