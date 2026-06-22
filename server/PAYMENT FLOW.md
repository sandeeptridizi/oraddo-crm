# PhonePe Payment Flow — Raw Interaction

This documents the raw PhonePe Standard Checkout v2 (OAuth) interaction only.
No organization / business logic is described here — just the S2S calls to
PhonePe and the browser redirect.

Base host comes from `PHONEPE_BASE_URL`
(e.g. `https://api-preprod.phonepe.com/apis/pg-sandbox`).

| Env var                     | Used as                            |
| --------------------------- | ---------------------------------- |
| `PHONEPE_MERCHANT_ID`       | OAuth `client_id`                  |
| `PHONEPE_SALT_KEY`          | OAuth `client_secret`              |
| `PHONEPE_CLIENT_VERSION`    | OAuth `client_version`             |
| `PHONEPE_BASE_URL`          | base host for all calls            |
| `PHONEPE_CALLBACK_BASE_URL` | backend base used in `redirectUrl` |
| `PHONEPE_FRONTEND_URL`      | frontend origin                    |

---

## Step 1 — Fetch Auth Token (S2S)

Every payment interaction needs an access token first. The token is cached in
memory and reused until ~60s before it expires; only then is this call repeated.

```
POST {PHONEPE_BASE_URL}/v1/oauth/token
Content-Type: application/x-www-form-urlencoded
```

Body (form-urlencoded):

```
client_id={PHONEPE_MERCHANT_ID}
client_version={PHONEPE_CLIENT_VERSION}
client_secret={PHONEPE_SALT_KEY}
grant_type=client_credentials
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "encrypted_access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "issued_at": 1782115080,
  "expires_at": 1782118680,
  "session_expires_at": 1782118680,
  "token_type": "O-Bearer"
}
```

We only need `access_token`. (`expires_at` is a unix timestamp in seconds, used
to decide when to refresh the cache.)

---

## Step 2 — Create Payment URL (S2S)

```
POST {PHONEPE_BASE_URL}/checkout/v2/pay
Authorization: O-Bearer {access_token}
Content-Type: application/json
```

Body:

```json
{
  "merchantOrderId": "newtxn123456",
  "amount": 1000,
  "expireAfter": 1200,
  "metaInfo": {
    "udf1": "test1",
    "udf2": "new param2",
    "udf3": "test3",
    "udf4": "dummy value 4",
    "udf5": "addition infor ref1"
  },
  "paymentFlow": {
    "type": "PG_CHECKOUT",
    "message": "Payment message used for collect requests",
    "merchantUrls": {
      "redirectUrl": "http://localhost:5173"
    }
  }
}
```

Notes:

- `amount` is in **paise** (₹10 → `1000`).
- `merchantOrderId` is our own unique id; we use it later in Step 4 to fetch
  status. The same id is what PhonePe echoes back as `merchantOrderId` inside
  the order.
- `metaInfo` supports `udf1` … `udf10` for arbitrary reference values.
- `redirectUrl` is fully customizable — we point it at the backend
  (`{PHONEPE_CALLBACK_BASE_URL}/...`) so the backend can run Step 4 after the
  user returns. It can carry additional path/query values as needed.

Response:

```json
{
  "orderId": "OMO2606221328592503454241",
  "state": "PENDING",
  "expireAt": 1782287939251,
  "redirectUrl": "https://mercury-uat.phonepe.com/transact/uat_v3?token=eyJ...&routingKey=W"
}
```

We return this `redirectUrl` to the frontend.

---

## Step 3 — Frontend redirect & return

1. Backend returns the Step 2 `redirectUrl` to the frontend.
2. Frontend redirects the browser **directly** to that URL.
3. User completes (or fails) the payment on PhonePe's hosted page.
4. PhonePe redirects the browser (plain **GET** navigation) back to the
   `redirectUrl` we set in `paymentFlow.merchantUrls` in Step 2.

The redirect carries **no payment result in the body** — we must confirm the
outcome ourselves via Step 4.

---

## Step 4 — Confirm Payment (Order Status, S2S)

```
GET {PHONEPE_BASE_URL}/checkout/v2/order/{merchantOrderId}/status
Authorization: O-Bearer {access_token}
```

No body. `{merchantOrderId}` is the same id sent in Step 2.

The authoritative result is `state`:

- `COMPLETED` → payment succeeded
- `FAILED` → payment failed (terminal)
- `PENDING` → not yet resolved

### Response — success

```json
{
  "orderId": "OMO2606221343388993454437",
  "state": "COMPLETED",
  "amount": 1000,
  "currency": "INR",
  "expireAt": 1782288932142,
  "metaInfo": {
    "udf5": "addition infor ref1",
    "udf3": "test3",
    "udf4": "dummy value 4",
    "udf1": "test1",
    "udf2": "new param2"
  },
  "paymentDetails": [
    {
      "paymentMode": "NET_BANKING",
      "transactionId": "OM2606221343388993454134",
      "timestamp": 1782116132142,
      "amount": 1000,
      "currency": "INR",
      "feeAmount": null,
      "payableAmount": null,
      "state": "COMPLETED",
      "splitInstruments": [
        {
          "amount": 1000,
          "currency": "INR",
          "rail": {
            "type": "PG",
            "authorizationCode": "<authorizationCode>"
          },
          "instrument": {
            "type": "NET_BANKING",
            "bankId": "ABCD",
            "arn": "81774397192680089232633",
            "brn": "200439752730"
          }
        }
      ]
    }
  ]
}
```

### Response — failed

```json
{
  "orderId": "OMO2606221344306963454257",
  "state": "FAILED",
  "amount": 1000,
  "currency": "INR",
  "expireAt": 1782288900925,
  "errorCode": "TXN_NOT_COMPLETED",
  "detailedErrorCode": "TXN_AUTO_FAILED",
  "metaInfo": {
    "udf5": "addition infor ref1",
    "udf3": "test3",
    "udf4": "dummy value 4",
    "udf1": "test1",
    "udf2": "new param2"
  },
  "paymentDetails": [
    {
      "paymentMode": "NET_BANKING",
      "transactionId": "OM2606221344306963454198",
      "timestamp": 1782116100925,
      "amount": 1000,
      "currency": "INR",
      "feeAmount": null,
      "payableAmount": null,
      "state": "FAILED",
      "errorCode": "TXN_NOT_COMPLETED",
      "detailedErrorCode": "TXN_AUTO_FAILED",
      "splitInstruments": [
        {
          "amount": 1000,
          "currency": "INR",
          "rail": {
            "type": "PG",
            "authorizationCode": "<authorizationCode>"
          },
          "instrument": {
            "type": "NET_BANKING",
            "bankId": "SBIN",
            "arn": "26483344162718194856131",
            "brn": "240507779456"
          }
        }
      ]
    }
  ]
}
```

---

## Summary

```
Step 1  POST /v1/oauth/token                              -> access_token
Step 2  POST /checkout/v2/pay (O-Bearer)                  -> redirectUrl
Step 3  frontend redirects to redirectUrl; user pays;
        PhonePe redirects (GET) back to merchantUrls.redirectUrl
Step 4  GET  /checkout/v2/order/{merchantOrderId}/status  -> state (COMPLETED | FAILED | PENDING)
```
