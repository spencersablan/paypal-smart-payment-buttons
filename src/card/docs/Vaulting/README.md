# Vaulting with HCF

## Outline of Vaulting Flow
1. Calling `POST /create-order` creates the order specifying the card as payment method, and indicates vaulting for the specified customer.
2. The order is successfully created and the `orderId` is returned along with vaulting details such as the `id` of the vaulted payment method.
3. The returned `orderId` is passed along to the `POST /capture` call and processing continues as usual.

## Script tag modifications
Include `vault=true` in the script tag to include vaulting options in the SDK. For example:

```html
<script src="https://www.paypal.com/sdk/js?client-id=<YOUR_CLIENT_ID>&components=card-fields&<OTHER_PARAMETERS>&vault=true" />
```

## Modifications to `createOrder`
In order to vault the card, the request body of the `POST create-order` call must include the `customerId` and the instruction to vault the payment method. For example:
```json
{
  payment_source: {
    card: {
      attributes: {
        customer: {
          id: "vwxj123",
        },
        vault: {
          store_in_vault: "ON_SUCCESS"
        },
      },
    },
  },
}
```

Depending on the type of card being used, several different responses may be returned to indicate the vaulting status. Generally, if vaulting occurred successfully, you will see the `details.payment_source.card.attributes.vault` field populated with an `id` field. This is the id of the vaulted payment method that can be stored and used to retrieve the vaulted payment method for subsequent transactions. Example response:
```json
{
  details: {
    payment_source: {
      card: {
        attributes: {
          vault: {
            customer : {
              id: "vwxj123"
            },
            id: "7dyps8w",
            status: "VAULTED"
          }
        },
        brand: "VISA",
        expiry: "2024-11",
        last_digits: "1111",
      },
    },
  },
}
```

### Card Specific Requirements

#### Visa

#### MasterCard
Vaulting with MasterCard uses an asynchronous process. Instead of a vault `id` being returned, a `setupToken` is returned. More details TBD.

#### American Express
Vaulting with American Express requires an additional field `partner` to be added to the `POST /create-order` payload with a value of `true`. More details TBD.

### Example of vaulting modifications:
In this example you can see the `createOrder` callback defining a payload to include a customer id and the vault command, and then included in the `fetch()` call.
```js
const cardField = paypal.CardFields({
            style: styleObject,
            createOrder: function (data, actions) {
              const customerId = "vwxj123"
              const payload = {
                payment_source: {
                  card: {
                    attributes: {
                      customer: {
                        id: customerId,
                      }
                      vault: {
                        store_in_vault: "ON_SUCCESS",
                      },
                    },
                  },
                };
              };
              return fetch("/api/paypal/order/create/", {
                method: "post",
                payload,
                })
                .then((res) => {
                    return res.json();
                })
                .then((orderData) => {
                    return orderData.id;
                });
            },
            onApprove: function (data, actions) {
                const { orderID } = data;
                return fetch(`/api/paypal/orders/${orderID}/capture/`, {
                method: "post",
                })
                .then((res) => {
                    return res.json();
                })
                .then((orderData) => {
                    // Redirect to success page
                });
            },
            inputEvents: {
                onChange: function (data) {
                    // Handle a change event in any of the fields
                },
                onFocus: function(data) {
                    // Handle a focus event in any of the fields
                },
                onBlur: function(data) {
                    // Handle a blur event in any of the fields
                },
                onInputSubmitRequest: function(data) {
                    // Handle an attempt to submit the entire card form
                    // when a buyer hits the enter key (or mobile equivalent)
                    // while focusing any of the fields
                }
            },
        });
```