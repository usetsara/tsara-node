import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";

function fetcher() {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

describe("stablecoin resources", () => {
  it("creates and reconciles an onramp with an idempotent reference", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.stablecoinOnramps.create({ amount: 1000, fiat_currency: "NGN", asset: "USDC", chain: "SOLANA" }, "onramp_123");
    await tsara.stablecoinOnramps.reconcile("trx_123");
    expect(String(request.mock.calls[0]![0])).toMatch(/\/stablecoin\/onramp$/);
    expect(request.mock.calls[0]![1]?.headers).toMatchObject({ "Idempotency-Key": "onramp_123" });
    expect(String(request.mock.calls[0]![1]?.body)).toContain('"reference":"onramp_123"');
    expect(String(request.mock.calls[1]![0])).toContain("/stablecoin/onramp/status?uid=trx_123&refresh=true");
  });

  it("quotes and creates an offramp", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.stablecoinOfframps.quote(5000);
    await tsara.stablecoinOfframps.create({ amount: 5000, fiat_currency: "NGN", asset: "USDC", chain: "SOLANA", bank_code: "090286", account_number: "0110000000" }, "offramp_123");
    expect(String(request.mock.calls[0]![0])).toMatch(/\/stablecoin\/offramp\/quote$/);
    expect(String(request.mock.calls[1]![0])).toMatch(/\/stablecoin\/offramp$/);
    expect(request.mock.calls[1]![1]?.headers).toMatchObject({ "Idempotency-Key": "offramp_123" });
  });

  it("uses canonical wallet, address, and transfer routes", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.stablecoinWallets.balance({ wallet_uid: "wallet_1" });
    await tsara.stablecoinAddresses.balance("address_1");
    await tsara.stablecoinTransfers.create({ from_address: "from", to_address: "to", amount: 2, network: "SOLANA", asset: "USDC" }, "transfer_123");
    expect(String(request.mock.calls[0]![0])).toContain("/stablecoin/wallets/balance?wallet_uid=wallet_1");
    expect(String(request.mock.calls[1]![0])).toContain("/stablecoin/wallets/addresses/balance?address=address_1");
    expect(String(request.mock.calls[2]![0])).toMatch(/\/stablecoin\/wallets\/transfers$/);
  });
});
