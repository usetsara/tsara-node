import type { Query, Tsara } from "./index";
import type { Page } from "./foundations";
import { constructWebhookEvent, verifyWebhookSignature } from "./foundations";

type Item = Record<string, unknown>;

export class PaymentLinksResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item) { return this.client.post("/payment-links", payload); }
  all(filters: Query = {}) { return this.client.get("/payment-links", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/payment-links", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/payment-links", filters); }
  retrieve(id: string) { return this.client.get("/payment-links", { id }); }
  transactions(filters: Query = {}) { return this.client.get("/payment-links/transactions", filters); }
  updateStatus(uid: string, status: string) { return this.client.post("/payment-links/status", { uid, status }); }
}

export class TransfersResource {
  constructor(private readonly client: Tsara) {}
  all(filters: Query = {}) { return this.client.get("/transfers", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/transfers", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/transfers", filters); }
  retrieve(uid: string) { return this.all({ uid }); }
  create(payload: Item, idempotencyKey: string) { return this.client.post("/transfers", { ...payload, idempotency_key: idempotencyKey }, idempotencyKey); }
  banks() { return this.client.get("/transfers/banks"); }
  nameEnquiry(bankCode: string, accountNumber: string) { return this.client.post("/transfers/name-enquiry", { bank_code: bankCode, account_number: accountNumber }); }
  status(uid: string) { return this.client.post("/transfers/status", { uid }); }
}

export class PayoutsResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item, idempotencyKey?: string) { return this.client.post("/payouts", payload, idempotencyKey); }
  all(filters: Query = {}) { return this.client.get("/payouts", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/payouts", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/payouts", filters); }
  retrieve(reference: string) { return this.all({ reference }); }
  nameEnquiry(bankCode: string, accountNumber: string) { return this.client.post("/payouts/name-enquiry", { bank_code: bankCode, account_number: accountNumber }); }
  createBulk(payload: Item, idempotencyKey?: string) { return this.client.post("/payouts/bulk", payload, idempotencyKey); }
  bulk(filters: Query = {}) { return this.client.get("/payouts/bulk", filters); }
  reconcile(filters: Query) { return this.client.get("/payouts/reconcile", filters); }
  process(identifier: Item) { return this.client.post("/payouts/process", identifier); }
  resendWebhook(identifier: Item) { return this.client.post("/payouts/webhook-resend", identifier); }
  webhookAttempts(filters: Query = {}) { return this.client.get("/payouts/webhook-attempts", filters); }
}

export class RefundsResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item, idempotencyKey?: string) { return this.client.post("/refunds", payload, idempotencyKey); }
  all(filters: Query = {}) { return this.client.get("/refunds", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/refunds", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/refunds", filters); }
  retrieve(reference: string) { return this.all({ reference }); }
  process(identifier: Item) { return this.client.post("/refunds/process", identifier); }
  finalize(identifier: Item) { return this.client.post("/refunds/finalize", identifier); }
}

export class WebhooksResource {
  constructor(private readonly client: Tsara) {}
  resendTransaction(identifier: Item) { return this.client.post("/webhook/resend", identifier); }
  logs(filters: Query = {}) { return this.client.get("/webhook/logs", filters); }
  logsPage<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/webhook/logs", filters); }
  iterateLogs<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/webhook/logs", filters); }
  attempts(filters: Query = {}) { return this.client.get("/webhook/attempts", filters); }
  test(payload: Item = {}) { return this.client.post("/webhook/test", payload); }
  rotateSecret() { return this.client.post("/webhook/rotate-secret"); }
  config() { return this.client.get("/webhook/config"); }
  resendRefund(identifier: Item) { return this.client.post("/webhook/refund-resend", identifier); }
  refundLogs(filters: Query = {}) { return this.client.get("/webhook/refund-logs", filters); }
  refundLogsPage<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/webhook/refund-logs", filters); }
  iterateRefundLogs<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/webhook/refund-logs", filters); }
  refundAttempts(filters: Query = {}) { return this.client.get("/webhook/refund-attempts", filters); }
  verifySignature(payload: string | Buffer, signature: string, secret: string) { return verifyWebhookSignature(payload, signature, secret); }
  constructEvent<T = Item>(payload: string | Buffer, signature: string, secret: string) { return constructWebhookEvent<T>(payload, signature, secret); }
}


export class CustomersResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item) { return this.client.post("/customers", payload); }
  all(filters: Query = {}) { return this.client.get("/customers", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/customers", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/customers", filters); }
  retrieve(customerId: string) { return this.client.get("/customers", { id: customerId }); }
  update(customerId: string, payload: Item) { return this.client.post("/customers/update", { customer_id: customerId, ...payload }); }
}
export class CustomerIdentityResource {
  constructor(private readonly client: Tsara) {}
  retrieve(number: string, type?: string) { return this.client.get("/customers/identity", { number, type }); }
  initiate(number: string, type="BVN", customerId?: string, scenario?: string) { return this.client.post("/customers/identity", { number, type:type.toUpperCase(), ...(customerId?{customer_id:customerId}:{}), ...(scenario?{scenario}:{}) }); }
  validate(number: string, otp: string, type="BVN", scenario?: string) { return this.client.post("/customers/identity/validate", { number, otp, type:type.toUpperCase(), ...(scenario?{scenario}:{}) }); }
}


function billPath(service:string):string { switch(service.toUpperCase()){case "AIRTIME":return "airtime";case "DATA":return "data";case "CABLETV":return "cable";case "UTILITY":return "electricity";default:throw new TypeError("Unsupported bill service.");} }
export class BillsResource {
 constructor(private readonly client:Tsara){}
 services(filters:Query={}){return this.client.get("/bill/services",filters);}
 categories(service:string,filters:Query={}){return this.client.get("/bill/categories",{service:service.toUpperCase(),...filters});}
 products(service:string,filters:Query={}){return this.client.get("/bill/products",{service:service.toUpperCase(),...filters});}
 providers(service:string,filters:Query={}){return this.client.get(`/bill/${billPath(service)}/providers`,filters);}
 plans(service:string,filters:Query={}){const normalized=service.toUpperCase();return this.client.get(`/bill/${billPath(normalized)}/${normalized==="UTILITY"?"products":"plans"}`,filters);}
 verify(service:string,provider:string,number:string,vendType?:string){return this.client.post("/bill/verify",{service:service.toUpperCase(),provider,number,...(vendType?{vend_type:vendType.toUpperCase()}:{})});}
 providerTransactions(id?:string){return this.client.get("/bill/transactions",{id});}
 history(filters:Query={}){return this.client.get("/bill/history",filters);}
 historyPage<T=Item>(filters:Query={}):Promise<Page<T>>{return this.client.page<T>("/bill/history",filters);}
 iterateHistory<T=Item>(filters:Query={}){return this.client.iterate<T>("/bill/history",filters);}
 retrieve(identifier:string){return this.history({trx_id:identifier});}
 purchaseAirtime(payload:Item,idempotencyKey:string){return this.purchase("airtime",payload,idempotencyKey);}
 purchaseData(payload:Item,idempotencyKey:string){return this.purchase("data",payload,idempotencyKey);}
 purchaseCable(payload:Item,idempotencyKey:string){return this.purchase("cable",payload,idempotencyKey);}
 purchaseElectricity(payload:Item,idempotencyKey:string){return this.purchase("electricity",{...payload,...(payload.vend_type?{vend_type:String(payload.vend_type).toUpperCase()}:{})},idempotencyKey);}
 private purchase(type:string,payload:Item,idempotencyKey:string){return this.client.post(`/bill/${type}`,{...payload,idempotency_key:idempotencyKey},idempotencyKey);}
}
export class CryptoBillsResource {
 constructor(private readonly client:Tsara){}
 create(payload:Item,idempotencyKey:string){return this.client.post("/bill/crypto",{...payload,idempotency_key:idempotencyKey},idempotencyKey);}
 retrieve(identifier:Query){return this.client.get("/bill/crypto",identifier);}
 history(filters:Query={}){return this.client.get("/bill/crypto/history",filters);}
 historyPage<T=Item>(filters:Query={}):Promise<Page<T>>{return this.client.page<T>("/bill/crypto/history",filters);}
 iterateHistory<T=Item>(filters:Query={}){return this.client.iterate<T>("/bill/crypto/history",filters);}
 manual(filters:Query={}){return this.client.get("/bill/crypto/manual",filters);}
 reconcile(filters:Query={}){return this.client.get("/bill/crypto/reconcile",filters);}
 retry(identifier:Item){return this.client.post("/bill/crypto/retry",identifier);}
}


export class StablecoinOnrampsResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item, idempotencyKey: string) { return this.client.post("/stablecoin/onramp", { reference: idempotencyKey, ...payload }, idempotencyKey); }
  all(filters: Query = {}) { return this.client.get("/stablecoin/onramp", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/stablecoin/onramp", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/stablecoin/onramp", filters); }
  retrieve(identifier: string, refresh = false) { return this.all({ uid: identifier, refresh }); }
  retrieveByReference(reference: string, refresh = false) { return this.all({ reference, refresh }); }
  rate(asset = "solana:usdc", currency = "NGN") { return this.client.get("/stablecoin/onramp/rate", { asset: asset.toLowerCase(), currency: currency.toUpperCase() }); }
  status(identifier: string, refresh = false) { return this.client.get("/stablecoin/onramp/status", { uid: identifier, refresh }); }
  reconcile(identifier: string) { return this.status(identifier, true); }
}

export class StablecoinOfframpsResource {
  constructor(private readonly client: Tsara) {}
  quote(amount: number, asset = "solana:usdc", currency = "NGN") { return this.client.post("/stablecoin/offramp/quote", { amount, asset: asset.toLowerCase(), fiat_currency: currency.toUpperCase() }); }
  create(payload: Item, idempotencyKey: string) { return this.client.post("/stablecoin/offramp", { reference: idempotencyKey, ...payload }, idempotencyKey); }
  all(filters: Query = {}) { return this.client.get("/stablecoin/offramp", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/stablecoin/offramp", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/stablecoin/offramp", filters); }
  retrieve(identifier: string, refresh = false) { return this.all({ uid: identifier, refresh }); }
  retrieveByReference(reference: string, refresh = false) { return this.all({ reference, refresh }); }
  rate(asset = "solana:usdc", currency = "NGN") { return this.client.get("/stablecoin/offramp/rate", { asset: asset.toLowerCase(), fiat_currency: currency.toUpperCase() }); }
  status(identifier: string, refresh = false) { return this.client.get("/stablecoin/offramp/status", { uid: identifier, refresh }); }
  reconcile(identifier: string) { return this.status(identifier, true); }
}

export class StablecoinWalletsResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item) { return this.client.post("/stablecoin/wallets", payload); }
  all(filters: Query = {}) { return this.client.get("/stablecoin/wallets", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/stablecoin/wallets", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/stablecoin/wallets", filters); }
  retrieve(identifier: string) { return this.all({ uid: identifier }); }
  retrieveByReference(reference: string) { return this.all({ reference }); }
  balance(identifier: Query) { return this.client.get("/stablecoin/wallets/balance", identifier); }
  rate() { return this.client.get("/stablecoin/wallets/rate"); }
}

export class StablecoinAddressesResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item) { return this.client.post("/stablecoin/wallets/addresses", payload); }
  all(filters: Query = {}) { return this.client.get("/stablecoin/wallets/addresses", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/stablecoin/wallets/addresses", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/stablecoin/wallets/addresses", filters); }
  retrieve(identifier: string) { return this.all({ uid: identifier }); }
  retrieveByAddress(address: string) { return this.all({ address }); }
  balance(address: string) { return this.client.get("/stablecoin/wallets/addresses/balance", { address }); }
  send(payload: Item, idempotencyKey: string) { return this.client.post("/stablecoin/wallets/addresses/send", { reference: idempotencyKey, ...payload }, idempotencyKey); }
}

export class StablecoinTransfersResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item, idempotencyKey: string) { return this.client.post("/stablecoin/wallets/transfers", { reference: idempotencyKey, ...payload }, idempotencyKey); }
  all(filters: Query = {}) { return this.client.get("/stablecoin/wallets/transfers", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/stablecoin/wallets/transfers", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/stablecoin/wallets/transfers", filters); }
  retrieve(identifier: string) { return this.all({ uid: identifier }); }
  retrieveByReference(reference: string) { return this.all({ reference }); }
}


export class RampWidgetsResource {
  constructor(private readonly client: Tsara) {}
  create(payload: Item) { return this.client.post("/ramp/widgets", payload); }
  all(filters: Query = {}) { return this.client.get("/ramp/widgets", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/ramp/widgets", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/ramp/widgets", filters); }
  retrieve(identifier: string) { return this.all({ id: identifier }); }
  retrieveByPublicKey(publicKey: string) { return this.all({ public_key: publicKey }); }
  update(identifier: string, payload: Item) { return this.client.post("/ramp/widgets/update", { id: identifier, ...payload }); }
  updateDomains(identifier: string, domains: unknown[]) { return this.client.post("/ramp/widgets/domains", { widget_id: identifier, domains }); }
  updateStatus(identifier: string, status: string) { return this.client.post("/ramp/widgets/status", { id: identifier, status: status.toLowerCase() }); }
  analytics(filters: Query = {}) { return this.client.get("/ramp/widgets/analytics", filters); }
}

export class RampTransactionsResource {
  constructor(private readonly client: Tsara) {}
  all(filters: Query = {}) { return this.client.get("/ramp/transactions", filters); }
  page<T = Item>(filters: Query = {}): Promise<Page<T>> { return this.client.page<T>("/ramp/transactions", filters); }
  iterate<T = Item>(filters: Query = {}) { return this.client.iterate<T>("/ramp/transactions", filters); }
  retrieve(identifier: string, refresh = false) { return this.all({ id: identifier, refresh }); }
  retrieveByReference(reference: string, refresh = false) { return this.all({ reference, refresh }); }
  reconcile(identifier: string) { return this.retrieve(identifier, true); }
}


export class ApiKeysResource {
  constructor(private readonly client: Tsara) {}
  config() { return this.client.get("/api-keys/config"); }
  rotateSecret() { return this.client.post("/api-keys/rotate-secret"); }
}
