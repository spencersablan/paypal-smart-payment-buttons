# Vaulting with HCF

## Outline of Vaulting Flow
1. Calling `POST /checkout/orders` creates the order specifying the card as payment method, and indicates vaulting for the specified customer.
2. The order is successfully created and the `orderId` is returned along with vaulting details such as the `id` of the vaulted payment method.
3. The returned `orderId` is passed along to the `POST /checkout/capture` call and processing continues as usual.

## Modifications to `createOrder`
In order to vault the card, the request body of the `POST /checkout/orders` call must include the `customerId` and the instruction to vault the payment method. For example:
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

Depending on the type of card being used, several different responses may be returned to indicate the vaulting status. Generally, if vaulting occurred successfully, you will see the `payment_source.card.attributes.vault` field populated with an `id` field. This is the id of the vaulted payment method that can be stored and used to retrieve the vaulted payment method for subsequent transactions. Example response:
```json
{
  "id": "5O190127TN364715T",
  "status": "COMPLETED",
  "payment_source": {
    "card": {
      "last_digits": "1111",
      "brand": "VISA",
      "attributes": {
        "vault": {
          "id": "7dyps8w",
          "status": "VAULTED",
          "customer": {
            "id": "wxj1234"
          },
          "links": [
            {
              "href": "https://api-m.paypal.com/v3/vault/payment-tokens/7dyps8w",
              "rel": "self",
              "method": "GET"
            },
            {
              "href": "https://api-m.paypal.com/v3/vault/payment-tokens/7dyps8w",
              "rel": "delete",
              "method": "DELETE"
            },
            {
              "href": "https://api-m.paypal.com/v2/checkout/orders/5O190127TN364715T",
              "rel": "up",
              "method": "GET"
            }
          ]
        }
      }
    }
  },
```

### Card Specific Requirements

#### Visa

#### MasterCard
Vaulting with MasterCard uses an asynchronous process. Instead of a vault `id` being returned, a `setup_token` is returned. More details TBD.

#### American Express
Vaulting with American Express requires the merchant to be subscribed to their OptBlue feature.

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