# Tsara Node

Official server-side TypeScript and Node.js SDK for the Tsara API.

## Requirements

- Node.js 18 or newer

## Install

```bash
npm install @tsara/node
```

## Configure

```ts
import { Tsara } from "@tsara/node";

const tsara = new Tsara({ secretKey: process.env.TSARA_SECRET_KEY! });
```

Use `sk_test_...` while developing and `sk_live_...` in production. The SDK rejects public keys and environment mismatches. Never expose a secret key in browser code.

The default API URL is `https://api.tsara.ng/v1`. A custom `baseUrl` must use HTTPS; plain HTTP is accepted only for local development hosts.

## Create Checkout

Checkout creation is the only SDK resource method that accepts a public key. The request intentionally omits secret-key authorization.

```ts
const checkout = await tsara.checkout.create(process.env.TSARA_PUBLIC_KEY!, {
  trx_id: "order_001",
  email: "customer@example.com",
  name: "Customer Name",
  amount: 1000,
  success_url: "https://merchant.example/payments/success",
  cancel_url: "https://merchant.example/payments/cancel",
});
```

Open the returned Checkout URL with `@tsara/checkout-js` or redirect the customer to it. Confirm payment through a signed webhook or server-side status request before delivering value.

## Resources

The client exposes Checkout, transactions, payment links, customers and identity, transfers, payouts, refunds, bills, stablecoin, ramp widgets, API keys, and webhooks.

```ts
const transaction = await tsara.transactions.retrieve("order_001");
const successful = await tsara.checkout.all({ status: "success" });
```

## Idempotency and retries

Use a unique idempotency key for every logical money-moving operation. Reuse the key when retrying the same operation.

```ts
import { generateIdempotencyKey } from "@tsara/node";

const refund = await tsara.refunds.create(
  { transaction_id: "ts_123", amount: 1000 },
  generateIdempotencyKey("refund"),
);
```

The SDK retries transient `429`, `502`, `503`, and `504` responses. Read requests are retried automatically. Write requests are retried only when an idempotency key is present.

## Pagination

```ts
for await (const transaction of tsara.transactions.iterate({ status: "success" })) {
  // Process every result across all pages.
}
```

## Errors

Typed errors include `AuthenticationError`, `AuthorizationError`, `ValidationError`, `ConflictError`, `RateLimitError`, `ServerError`, `NetworkError`, and `TimeoutError`. All extend `TsaraError`.

## Verify webhooks

Verify the exact raw request body before JSON parsing. Tsara sends the HMAC-SHA512 digest in `X_TSARA_SIGNATURE`.

```ts
import { constructWebhookEvent } from "@tsara/node";

const event = constructWebhookEvent(
  rawRequestBody,
  request.headers["x_tsara_signature"] ?? "",
  process.env.TSARA_WEBHOOK_SECRET!,
);
```

Return `2xx` only after safely accepting the event. Make handlers idempotent because delivery can be retried.

## Framework examples

- `examples/express/server.ts`
- `examples/nextjs/app/api/checkout/route.ts`

## Credential rotation

API-key and webhook-secret rotation are separate. A rotated API key is returned once; store it securely and recreate the SDK client. A rotated webhook secret starts with `whsec_test_` or `whsec_live_`.

## Release status

`0.1.x` is a release-candidate line. Validate your test integration before enabling live money movement.


## Incoming and sandbox transfers

Business-wallet transfers support test and live secret keys. Test mode uses the sandbox wallet.
Transfer responses include `direction` (`IN` or `OUT`); incoming transfers contain `sender` details.
Verify `transfer.received` events using the raw body and the existing webhook signature helper.
See [release readiness](RELEASE-READINESS.md) for publishing prerequisites.
