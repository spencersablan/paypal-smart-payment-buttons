/* @flow */
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import { HEADERS, PREFER } from "../constants";
import { VAULT_SETUP_TOKENS_API_URL } from "../config";

import { callRestAPI } from "./api";

export type PaymentSourceCardDetails = {|
  number: string,
  expiry: string,

  name?: string,
  security_code?: string,
  type?: "CREDIT" | "DEBIT" | "PREPAID" | "STORE" | "UNKNOWN",
  brand?: string,
  billing_address?: $Shape<{|
    address_line_1: string,
    address_line_2: string,
    admin_area_1: string,
    admin_area_2: string,
    postal_code: string,
    country_code: string,
  |}>,
  verification_method?: "string",
  experience_context?: Object,
|};

export type PaymentSourceCard = {|
  card: PaymentSourceCardDetails,
|};

export type PaymentSourcePayPalDetails = $Shape<{|
  billing_agreement_id: string,
  description: string,
  usage_pattern: string,
  shipping: Object,
  permit_multiple_payment_tokens: boolean,
  usage_type: string,
  customer_type: string,
  experience_context: Object,
|}>;

export type PaymentSourcePayPal = {|
  paypal: PaymentSourcePayPal,
|};

export type PaymentSource = PaymentSourceCard | PaymentSourcePayPal;

type VaultBasicOptions = {|
  vaultSetupToken: string,
  facilitatorAccessToken: string,
  partnerAttributionID: ?string,
|};

type VaultUpdateOptions = {|
  ...VaultBasicOptions,
  paymentSource: PaymentSource,
|};

type VaultSetupTokenResponse = {|
  id: string,
  customer: {|
    id: string,
  |},
  status:
    | "APPROVED"
    | "CREATED"
    | "PAYER_ACTION_REQUIRED"
    | "TOKENIZED"
    | "VAULTED",
  payment_source: Object,
  links: $ReadOnlyArray<{|
    href: string,
    rel: "approve" | "confirm" | "self",
    method: "GET" | "POST",
  |}>,
|};

export const getVaultSetupToken = ({
  vaultSetupToken,
  facilitatorAccessToken,
  partnerAttributionID,
}: VaultBasicOptions): ZalgoPromise<VaultSetupTokenResponse> =>
  callRestAPI<void, VaultSetupTokenResponse>({
    accessToken: facilitatorAccessToken,
    url: `${VAULT_SETUP_TOKENS_API_URL}/${vaultSetupToken}`,
    eventName: "v3_vault_setup_tokens_get",
    headers: {
      ...(partnerAttributionID
        ? { [HEADERS.PARTNER_ATTRIBUTION_ID]: partnerAttributionID }
        : undefined),
      [HEADERS.PREFER]: PREFER.REPRESENTATION,
    },
  });

export const updateVaultSetupToken = ({
  vaultSetupToken,
  facilitatorAccessToken,
  partnerAttributionID,
  paymentSource,
}: VaultUpdateOptions): ZalgoPromise<VaultSetupTokenResponse> =>
  callRestAPI<{| payment_source: PaymentSource |}, VaultSetupTokenResponse>({
    accessToken: facilitatorAccessToken,
    method: "post",
    url: `${VAULT_SETUP_TOKENS_API_URL}/${vaultSetupToken}/update`,
    headers: {
      ...(partnerAttributionID
        ? { [HEADERS.PARTNER_ATTRIBUTION_ID]: partnerAttributionID }
        : undefined),
      [HEADERS.PREFER]: PREFER.REPRESENTATION,
    },
    data: {
      payment_source: paymentSource,
    },
  });
