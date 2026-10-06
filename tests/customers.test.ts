import { describe, expect, it, vi } from "vitest";
import { Tsara } from "../src/index";
describe("customers and identity",()=>{
  it("uses canonical routes and normalized identity types",async()=>{
    const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({success:true,data:[]} ),{status:200}));
    const tsara=new Tsara({secretKey:"sk_test_example",fetch:fetcher});
    await tsara.customers.retrieve("id_123"); await tsara.customers.update("id_123",{email:"new@example.com",name:"User",type:"individual"});
    await tsara.customerIdentity.initiate("12345678901","bvn","id_123"); await tsara.customerIdentity.validate("12345678901","123456","nin");
    expect(String(fetcher.mock.calls[0]![0])).toContain("/customers?id=id_123");
    expect(String(fetcher.mock.calls[1]![1]?.body)).toContain('"customer_id":"id_123"');
    expect(String(fetcher.mock.calls[2]![1]?.body)).toContain('"type":"BVN"');
    expect(String(fetcher.mock.calls[3]![0])).toMatch(/\/customers\/identity\/validate$/);
  });
  it("iterates total_pages pagination",async()=>{
    const fetcher=vi.fn<typeof fetch>(async input=>{const page=Number(new URL(String(input)).searchParams.get("page")??1);return new Response(JSON.stringify({success:true,data:[{id:`id_${page}`}],meta:{page,total_pages:2}}),{status:200});});
    const ids:string[]=[]; for await(const customer of new Tsara({secretKey:"sk_test_example",fetch:fetcher}).customers.iterate<{id:string}>()) ids.push(customer.id);
    expect(ids).toEqual(["id_1","id_2"]);
  });
});
