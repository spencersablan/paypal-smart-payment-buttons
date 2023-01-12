/* eslint-disable flowtype/require-exact-type */
/* @flow */

import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";
import { INTENT } from "@paypal/sdk-constants";
import {
  getAllFramesInWindow,
  isSameDomain
} from "@krakenjs/cross-domain-utils/src";
import { uniqueID } from "@krakenjs/belter/src";

import { FRAME_NAME } from "../constants";
import { tokenizeCard, confirmOrderAPI } from "../api";
import { getLogger } from "../lib";
import type { FeatureFlags } from "../types";

import { getCardProps } from "./props";
import type { Card, ExtraFields, CardFieldsState, FieldsState } from "./types";
import { type CardExports, type ExportsOptions } from "./lib";
import { parsedCardType, kebabToCamelCase } from "./lib/card-utils";
import { CARD_ERRORS } from "./constants";

function getExportsByFrameName<T>(
  name: $Values<typeof FRAME_NAME>
): ?CardExports<T> {
  try {
    for (const win of getAllFramesInWindow(window)) {
      if (
        isSameDomain(win) &&
        // $FlowFixMe
        win.exports &&
        win.exports.name === name
      ) {
        return win.exports;
      }
    }
  } catch (err) {
    // pass
  }
}
/* This is a deadlock situation where CardExports<T> returned by getExportsByFrameName has to be a 'Maybe Type' (https://flow.org/en/docs/types/maybe/) for cardFrame, cardNameFrame and cardPostalCode whereas mandatory for the rest of the Frames.
 So adding a flowIgnore to pass the typecheck failures*/

// $FlowIgnore
function getCardFrames(): {
  cardFrame: ?ExportsOptions,
  cardNumberFrame: ExportsOptions,
  cardCVVFrame: ExportsOptions,
  cardExpiryFrame: ExportsOptions,
  cardNameFrame?: ?ExportsOptions,
  cardPostalFrame?: ?ExportsOptions
} {
  const cardFrame = getExportsByFrameName(FRAME_NAME.CARD_FIELD);
  const cardNumberFrame = getExportsByFrameName(FRAME_NAME.CARD_NUMBER_FIELD);
  const cardCVVFrame = getExportsByFrameName(FRAME_NAME.CARD_CVV_FIELD);
  const cardExpiryFrame = getExportsByFrameName(FRAME_NAME.CARD_EXPIRY_FIELD);
  const cardNameFrame = getExportsByFrameName(FRAME_NAME.CARD_NAME_FIELD);
  const cardPostalFrame = getExportsByFrameName(FRAME_NAME.CARD_POSTAL_FIELD);

 
  return {
    cardFrame,
     // $FlowIgnore
    cardNumberFrame,
     // $FlowIgnore
    cardCVVFrame,
     // $FlowIgnore
    cardExpiryFrame,
    cardNameFrame,
    cardPostalFrame
  };
}

export function isEmpty(value: string): boolean {
  if (value.length === 0) {
    return true;
  }
  return false;
}

export function getCardFieldState(): CardFieldsState {
  const {
    cardNameFrame,
    cardNumberFrame,
    cardCVVFrame,
    cardExpiryFrame,
    cardPostalFrame
  } = getCardFrames();
  const optionalFields = {};

  // Optional frames: the idea is to keep the optional frames separate and add the field
  // state as needed
  const cardFrameFields = [cardNameFrame, cardPostalFrame];
  cardFrameFields.forEach(cardFrame => {
    if (cardFrame) {
      optionalFields[kebabToCamelCase(cardFrame.name)] = {
        isEmpty: isEmpty(cardFrame?.getFieldValue()),
        isValid: cardFrame?.isFieldValid(),
        isPotentiallyValid: cardFrame.isFieldPotentiallyValid(),
        isFocused: cardFrame.isFieldFocused()
      };
    }
  });

  const cardFieldsState = {
    cards: parsedCardType(cardNumberFrame.getPotentialCardTypes()),
    fields: {
      ...optionalFields,
      cardNumberField: {
        isEmpty: isEmpty(cardNumberFrame.getFieldValue()),
        isValid: cardNumberFrame.isFieldValid(),
        isPotentiallyValid: cardNumberFrame.isFieldPotentiallyValid(),
        isFocused: cardNumberFrame.isFieldFocused()
      },
      cardExpiryField: {
        isEmpty: isEmpty(cardExpiryFrame.getFieldValue()),
        isValid: cardExpiryFrame.isFieldValid(),
        isPotentiallyValid: cardExpiryFrame.isFieldPotentiallyValid(),
        isFocused: cardExpiryFrame.isFieldFocused()
      },
      cardCvvField: {
        isEmpty: isEmpty(cardCVVFrame.getFieldValue()),
        isValid: cardCVVFrame.isFieldValid(),
        isPotentiallyValid: cardCVVFrame.isFieldPotentiallyValid(),
        isFocused: cardCVVFrame.isFieldFocused()
      }
    }
  };
  return cardFieldsState;
}

export function hasCardFields(): boolean {
  const {
    cardFrame,
    cardNumberFrame,
    cardCVVFrame,
    cardExpiryFrame,
  } = getCardFrames();

  if (cardFrame || (cardNumberFrame && cardCVVFrame && cardExpiryFrame)) {
    return true;
  }

  return false;
}

export function getCardFields(): ?Card {
  const cardFrame = getExportsByFrameName(FRAME_NAME.CARD_FIELD);

  if (cardFrame && cardFrame.isFieldValid()) {
    return cardFrame.getFieldValue();
  }

  const {
    cardNumberFrame,
    cardCVVFrame,
    cardExpiryFrame,
    cardNameFrame,
    cardPostalFrame
  } = getCardFrames();

  if (
    cardNumberFrame &&
    cardNumberFrame.isFieldValid() &&
    cardCVVFrame &&
    cardCVVFrame.isFieldValid() &&
    cardExpiryFrame &&
    cardExpiryFrame.isFieldValid() &&
    // cardNameFrame and cardPostalFrame are optional fields so we only want to check the validity if they are rendered.
    (cardNameFrame ? cardNameFrame.isFieldValid() : true) &&
    (cardPostalFrame ? cardPostalFrame.isFieldValid() : true)
  ) {
    return {
      number: cardNumberFrame.getFieldValue(),
      cvv: cardCVVFrame.getFieldValue(),
      expiry: cardExpiryFrame.getFieldValue(),
      name: cardNameFrame?.getFieldValue() || "",
      postalCode: cardPostalFrame?.getFieldValue() || ""
    };
  }

  throw new Error(`Card fields not available to submit`);
}

export function emitGqlErrors(errorsMap: Object): void {
  const {
    cardFrame,
    cardNumberFrame,
    cardExpiryFrame,
    cardCVVFrame
  } = getCardFrames();

  const { number, expiry, security_code } = errorsMap;

  if (cardFrame) {
    let cardFieldError = { field: "", errors: [] };

    if (number) {
      cardFieldError = { field: "number", errors: number };
    }

    if (expiry) {
      cardFieldError = { field: "expiry", errors: expiry };
    }

    if (security_code) {
      cardFieldError = { field: "cvv", errors: security_code };
    }

    cardFrame.setGqlErrors(cardFieldError);
  }

  if (cardNumberFrame && number) {
    cardNumberFrame.setGqlErrors({ field: "number", errors: number });
  }

  if (cardExpiryFrame && expiry) {
    cardExpiryFrame.setGqlErrors({ field: "expiry", errors: expiry });
  }

  if (cardCVVFrame && security_code) {
    cardCVVFrame.setGqlErrors({ field: "cvv", errors: security_code });
  }
}

export function resetGQLErrors(): void {
  const {
    cardFrame,
    cardNumberFrame,
    cardExpiryFrame,
    cardCVVFrame
  } = getCardFrames();

  if (cardFrame) {
    cardFrame.resetGQLErrors();
  }

  if (cardNumberFrame) {
    cardNumberFrame.resetGQLErrors();
  }

  if (cardExpiryFrame) {
    cardExpiryFrame.resetGQLErrors();
  }

  if (cardCVVFrame) {
    cardCVVFrame.resetGQLErrors();
  }
}

type SubmitCardFieldsOptions = {|
  facilitatorAccessToken: string,
  featureFlags: FeatureFlags,
  extraFields?: {|
    billingAddress?: string
  |}
|};

type CardValues = {|
  number: ?string,
  expiry?: ?string,
  security_code?: ?string,
  postalCode?: ?string,
  name?: ?string,
  ...ExtraFields
|};

// Reformat MM/YYYY to YYYY-MM
export function reformatExpiry(expiry: ?string): ?string {
  if (typeof expiry === "string") {
    const [month, year] = expiry.split("/");
    return `${year}-${month}`;
  }
}

export function submitCardFields({
  facilitatorAccessToken,
  extraFields,
  featureFlags
}: SubmitCardFieldsOptions): ZalgoPromise<void> {
  // TODO: For next ticket, take these card props and act on them based on action flow or not
  // const { intent, createOrder, onApprove, onError } = getCardProps({
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
      return;
    }

    const restart = () => {
      throw new Error(`Restart not implemented for card fields flow`);
    };

    if (cardProps.intent === INTENT.TOKENIZE) {
      return tokenizeCard({ card }).then(({ paymentMethodToken }) => {
        // $FlowFixMe
        return cardProps.onApprove({ paymentMethodToken }, { restart });
      });
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

export const getFieldErrors = (fields : FieldsState ) : [$Values<typeof CARD_ERRORS>] | [] => {
  const errors = [];
  Object.keys(fields).forEach(field => {
    if(fields[field] && !fields[field].isValid){
      switch(field) {
        case kebabToCamelCase(FRAME_NAME.CARD_NAME_FIELD):
          errors.push(CARD_ERRORS.INVALID_NAME)
          break;
        case kebabToCamelCase(FRAME_NAME.CARD_NUMBER_FIELD):
          errors.push(CARD_ERRORS.INVALID_NUMBER)
          break;
        case kebabToCamelCase(FRAME_NAME.CARD_EXPIRY_FIELD):
          errors.push(CARD_ERRORS.INVALID_EXPIRY)
          break;
        case kebabToCamelCase(FRAME_NAME.CARD_CVV_FIELD):
          errors.push(CARD_ERRORS.INVALID_CVV)
          break;
        case kebabToCamelCase(FRAME_NAME.CARD_POSTAL_FIELD):
          errors.push(CARD_ERRORS.INVALID_POSTAL)
          break;
        default:
          // noop
      }
    }
  })
  return errors;
}
/* eslint-enable flowtype/require-exact-type */
