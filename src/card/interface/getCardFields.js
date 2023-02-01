/* @flow */

import { FRAME_NAME } from '../../constants';
import type { Card } from '../types';

import { getExportsByFrameName } from './getExportsByFrameName';
import { getCardFrames } from './getCardFrames';

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