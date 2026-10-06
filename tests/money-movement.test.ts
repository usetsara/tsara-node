import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";

function createFetcher() {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("money movement resources", () => {
  it("adds transfer idempotency to the body and header", async () => {
    const fetcher = createFetcher();
    const tsara = new Tsara({ secretKey: "sk_live_example", fetch: fetcher });
    await tsara.transfers.create({ amount: 1000, bank_code: "001", account_number: "1234567890" }, "idem_12345678");

    const [, init] = fetcher.mock.calls[0]!;
    expect(init?.headers).toMatchObject({ "Idempotency-Key": "idem_12345678" });
    expect(String(init?.body)).toContain('"idempotency_key":"idem_12345678"');
  });

  it("supports sandbox transfers using test-key authorization", async () => {
    const fetcher = createFetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: fetcher });
    await tsara.transfers.banks();
    await tsara.transfers.create({ amount: 1000, bank_code: "999991", account_number: "1234567890" }, "test-credit");
    expect(String(fetcher.mock.calls[0]![0])).toMatch(/\/transfers\/banks$/);
    expect(fetcher.mock.calls[1]![1]?.headers).toMatchObject({ Authorization: "Bearer sk_test_example", "Idempotency-Key": "test-credit" });
  });

  it("uses canonical payout and refund paths", async () => {
    const fetcher = createFetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: fetcher });
    await tsara.payouts.create({ reference: "po_1" });
    await tsara.refunds.process({ reference: "rf_1" });

    expect(String(fetcher.mock.calls[0]![0])).toMatch(/\/payouts$/);
    expect(String(fetcher.mock.calls[1]![0])).toMatch(/\/refunds\/process$/);
  });
});
