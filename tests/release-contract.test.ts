import { createHmac } from "node:crypto";
import { expect, it, vi } from "vitest";
import { Tsara, AuthorizationError, ValidationError, constructWebhookEvent } from "../src/index";

it.each([false, undefined])("maps HTTP 200 business errors (success=%s)", async success => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success, status: "failed", status_code: 403, message: "Disabled" })));
  await expect(new Tsara({ secretKey: "sk_test_example", fetch: fetcher }).transfers.banks()).rejects.toBeInstanceOf(AuthorizationError);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("keeps insufficient-funds errors non-retryable", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: false, status_code: 402, message: "Not enough balance" })));
  await expect(new Tsara({ secretKey: "sk_test_example", fetch: fetcher }).transfers.create({ amount: 1000 }, "one-transfer")).rejects.toBeInstanceOf(ValidationError);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("preserves incoming transfer direction and sender data", async () => {
  const body = { success: true, data: { direction: "IN", sender: { account_name: "Example sender" } } };
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body)));
  expect(await new Tsara({ secretKey: "sk_test_example", fetch: fetcher }).transfers.retrieve("IN-example")).toEqual(body);
});
it("verifies incoming transfer webhook events", () => {
  const body = JSON.stringify({ event: "transfer.received", data: { direction: "IN", amount: 1000 } });
  const signature = createHmac("sha512", "whsec_example").update(body).digest("hex");
  expect(constructWebhookEvent<{ event: string }>(body, signature, "whsec_example").event).toBe("transfer.received");
});
