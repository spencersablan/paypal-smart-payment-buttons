/* @flow */

import { INTENT } from "@paypal/sdk-constants"
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src"
import { uniqueID } from "@krakenjs/belter"

import { getCardProps } from "../props"
import { confirmOrderAPI } from "../../api"
import { getLogger } from "../../lib"
import type { ExtraFields } from "../types"
import type { FeatureFlags } from "../../types"

import { resetGQLErrors } from "./gql"
import { hasCardFields } from "./hasCardFields"
import { getCardFields } from "./getCardFields"
import { vault } from "./vault"
import { reformatExpiry } from "./reformatExpiry"

type CardValues = {|
  number: ?string,
  expiry?: ?string,
  security_code?: ?string,
  postalCode?: ?string,
  name?: ?string,
  ...ExtraFields
|};

type SubmitCardFieldsOptions = {|
  facilitatorAccessToken: string,
  featureFlags: FeatureFlags,
  extraFields?: {|
    billingAddress?: string
  |}
|};

export function submitCardFields({
  facilitatorAccessToken,
  extraFields,
  featureFlags
}: SubmitCardFieldsOptions): ZalgoPromise<void> {
  const cardProps = getCardProps({
    facilitatorAccessToken,
    featureFlags,
  });

  resetGQLErrors();

  return ZalgoPromise.try(() => {
    if (!hasCardFields()) {
      throw new Error(`Card fields not available to submit`);
    }

    const card = getCardFields();

    if (!card) {
      throw new Error('Card not available to submit')
    }

    const restart = () => {
      throw new Error(`Restart not implemented for card fields flow`);
    };

    if (cardProps.action !== undefined) {
      switch(cardProps.action.type) {
        case 'save': {
            return vault.create({
              action: cardProps.action,
              facilitatorAccessToken,
              paymentSource: {
                card: {
                  // $FlowIssue
                  name: card.name,
                  // $FlowIssue
                  number: card.number,
                  // $FlowIssue
                  expiry: card.expiry,
                  // $FlowIssue
                  security_code: card.cvv,
                  billing_address: {
                  // $FlowIssue
                    postal_code: card.postalCode
                  }
                }
              },
            })
        }
        default: {
          throw new Error(`Action of type ${cardProps.action.type} is not supported by Card Fields`)
        }
      }
    }

    if (cardProps.intent === INTENT.CAPTURE || cardProps.intent === INTENT.AUTHORIZE) {
      // $FlowFixMe
      return cardProps.createOrder()
        .then(orderID => {
          const cardObject: CardValues = {
            name: card.name,
            number: card.number,
            expiry: reformatExpiry(card.expiry),
            security_code: card.cvv,
            ...extraFields
          };

          if (card.name) {
            cardObject.name = card.name;
          }

          // eslint-disable-next-line flowtype/no-weak-types
          const data: any = {
            payment_source: {
              card: cardObject
            }
          };
          return confirmOrderAPI(orderID, data, {
            facilitatorAccessToken,
            partnerAttributionID: ""
          }).catch(error => {
            getLogger().info("card_fields_payment_failed");
            if (cardProps.onError) {
              cardProps.onError(error);
            }
            throw error;
          });
        })
        .then(orderData => {
          // $FlowFixMe
          return cardProps.onApprove(
            { payerID: uniqueID(), buyerAccessToken: uniqueID(), ...orderData },
            { restart }
          );
        });
    }
  });
}
