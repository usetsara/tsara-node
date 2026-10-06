import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";

function createFetcher() {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("resources", () => {
  it("retrieves transactions using secret authentication", async () => {
    const fetcher = createFetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: fetcher });
    await tsara.transactions.retrieve("order_1");

    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain("/transactions?trx_id=order_1");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer sk_test_example" });
  });

  it("does not expose the secret key when creating Checkout", async () => {
    const fetcher = createFetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: fetcher });
    await tsara.checkout.create("pk_test_example", { trx_id: "order_1", amount: 100 });

    const [, init] = fetcher.mock.calls[0]!;
    expect(init?.headers).not.toHaveProperty("Authorization");
    expect(String(init?.body)).toContain("pk_test_example");
  });
});
