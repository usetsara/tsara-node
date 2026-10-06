import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { AuthenticationError, Tsara, constructWebhookEvent, generateIdempotencyKey, verifyWebhookSignature } from "../src/index";

describe("SDK foundations", () => {
  it("maps authentication errors", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 }));
    await expect(new Tsara({ secretKey: "sk_test_example", fetch: fetcher, maxRetries: 0 }).transactions.all()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("retries reads but not unsafe writes", async () => {
    const readFetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await new Tsara({ secretKey: "sk_test_example", fetch: readFetcher, maxRetries: 1 }).transactions.all();
    expect(readFetcher).toHaveBeenCalledTimes(2);

    const writeFetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: false }), { status: 503 }));
    await expect(new Tsara({ secretKey: "sk_test_example", fetch: writeFetcher, maxRetries: 1 }).paymentLinks.create({ title: "Test" })).rejects.toThrow();
    expect(writeFetcher).toHaveBeenCalledTimes(1);
  });

  it("iterates paginated responses", async () => {
    const fetcher = vi.fn<typeof fetch>(async input => {
      const page = Number(new URL(String(input)).searchParams.get("page") ?? 1);
      return new Response(JSON.stringify({ success: true, data: [{ id: page }], meta: { current_page: page, last_page: 2 } }), { status: 200 });
    });
    const ids: number[] = [];
    for await (const item of new Tsara({ secretKey: "sk_test_example", fetch: fetcher }).transactions.iterate<{ id: number }>()) ids.push(item.id);
    expect(ids).toEqual([1, 2]);
  });

  it("generates idempotency keys and verifies webhook signatures", () => {
    expect(generateIdempotencyKey("refund")).toMatch(/^refund_[a-f0-9]{32}$/);
    const payload = JSON.stringify({ event: "transaction.success" });
    const signature = createHmac("sha512", "whsec_test").update(payload).digest("hex");
    expect(verifyWebhookSignature(payload, signature, "whsec_test")).toBe(true);
    expect(constructWebhookEvent<{ event: string }>(payload, signature, "whsec_test").event).toBe("transaction.success");
  });
});
