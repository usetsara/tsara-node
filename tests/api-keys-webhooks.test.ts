import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";

function fetcher() {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: true, data: { data: [], meta: { page: 1, total_pages: 1 } } }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

describe("API key and webhook resources", () => {
  it("gets configuration and rotates the active API secret", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.apiKeys.config();
    await tsara.apiKeys.rotateSecret();
    expect(String(request.mock.calls[0]![0])).toMatch(/\/api-keys\/config$/);
    expect(String(request.mock.calls[1]![0])).toMatch(/\/api-keys\/rotate-secret$/);
  });

  it("exposes webhook resend and paginated log operations", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.webhooks.resendTransaction({ reference: "order_1" });
    await tsara.webhooks.logsPage({ delivery_status: "failed" });
    await tsara.webhooks.resendRefund({ uid: "ref_1" });
    expect(String(request.mock.calls[0]![0])).toMatch(/\/webhook\/resend$/);
    expect(String(request.mock.calls[1]![0])).toContain("/webhook/logs?delivery_status=failed");
    expect(String(request.mock.calls[2]![0])).toMatch(/\/webhook\/refund-resend$/);
  });
});
