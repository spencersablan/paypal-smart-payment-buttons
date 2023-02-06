/* @flow */

import { type ZalgoPromise } from "@krakenjs/zalgo-promise/src";

export type XCreateVaultSetupTokenDataType = {||};

export type XCreateVaultSetupToken = (
  ?XCreateVaultSetupTokenDataType
) => ZalgoPromise<string>;

export type CreateVaultSetupToken = XCreateVaultSetupToken;

export const getCreateVaultSetupToken =
  ({
    createVaultSetupToken,
  }: {|
    createVaultSetupToken: XCreateVaultSetupToken,
  |}): () => ZalgoPromise<string> =>
  () =>
    createVaultSetupToken(
      // $FlowIssue empty object
      {}
    ).then((vaultSetupToken) => {
      if (!vaultSetupToken || typeof vaultSetupToken !== "string") {
        throw new Error(
          `Expected a vault setup token to be passed to createVaultSetupToken`
        );
      }

      return vaultSetupToken;
    });
