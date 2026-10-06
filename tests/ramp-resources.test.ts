import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";

function fetcher() {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

describe("ramp business resources", () => {
  it("manages widgets through secret-authenticated routes", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.rampWidgets.create({ name: "Store widget" });
    await tsara.rampWidgets.updateDomains("rwdg_1", ["https://merchant.example"]);
    await tsara.rampWidgets.updateStatus("rwdg_1", "DISABLED");
    expect(String(request.mock.calls[0]![0])).toMatch(/\/ramp\/widgets$/);
    expect(String(request.mock.calls[1]![1]?.body)).toContain('"widget_id":"rwdg_1"');
    expect(String(request.mock.calls[2]![1]?.body)).toContain('"status":"disabled"');
  });

  it("retrieves and refreshes a ramp transaction", async () => {
    const request = fetcher();
    const tsara = new Tsara({ secretKey: "sk_test_example", fetch: request });
    await tsara.rampTransactions.retrieveByReference("rmp_1");
    await tsara.rampTransactions.reconcile("rmp_uid_1");
    expect(String(request.mock.calls[0]![0])).toContain("/ramp/transactions?reference=rmp_1");
    expect(String(request.mock.calls[1]![0])).toContain("/ramp/transactions?id=rmp_uid_1&refresh=true");
  });
});
