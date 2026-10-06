import { PaymentLinksResource, TransfersResource, PayoutsResource, RefundsResource, WebhooksResource, CustomersResource, CustomerIdentityResource, BillsResource, CryptoBillsResource, StablecoinOnrampsResource, StablecoinOfframpsResource, StablecoinWalletsResource, StablecoinAddressesResource, StablecoinTransfersResource, RampWidgetsResource, RampTransactionsResource, ApiKeysResource } from "./resources";
import { NetworkError, TimeoutError, TsaraError, errorForStatus } from "./errors";
import { Page, parsePage } from "./foundations";
export type Environment = "test" | "live";
export type Query = Record<string, string | number | boolean | undefined>;
export interface TsaraOptions { secretKey: string; environment?: Environment; baseUrl?: string; timeout?: number; maxRetries?: number; application?: string; fetch?: typeof globalThis.fetch }
export interface RequestOptions { query?: Query; body?: unknown; idempotencyKey?: string; authenticate?: boolean }

export class TransactionsResource {
  constructor(private readonly client: Tsara) {}
  all(filters: Query = {}) { return this.client.get("/transactions", filters); }
  page<T = Record<string, unknown>>(filters: Query = {}) { return this.client.page<T>("/transactions", filters); }
  iterate<T = Record<string, unknown>>(filters: Query = {}) { return this.client.iterate<T>("/transactions", filters); }
  retrieve(transactionId: string) { return this.client.get("/transactions", { trx_id: transactionId }); }
  retrieveByReference(reference: string) { return this.client.get("/transactions", { reference }); }
  create(payload: Record<string, unknown>, idempotencyKey?: string) { return this.client.post("/transactions", payload, idempotencyKey); }
  bills(filters: Query = {}) { return this.client.get("/transactions/bill", filters); }
}

export class CheckoutResource {
  constructor(private readonly client: Tsara) {}
  create(publicKey: string, payload: Record<string, unknown>) {
    if (!/^pk_(test|live)_/.test(publicKey)) throw new TypeError("A Checkout public key is required.");
    return this.client.publicPost("/checkout", { public_key: publicKey, ...payload });
  }
  all(filters: Query = {}) { return this.client.get("/checkout", filters); }
  retrieve(transactionId: string) { return this.client.get("/checkout", { trx_id: transactionId }); }
  status(transactionId: string) { return this.client.get("/checkout/status", { trx_id: transactionId }); }
  paymentInstructions(transactionId: string, method?: string) { return this.client.get("/checkout/account", { trx_id: transactionId, method }); }
  selectCrypto(transactionId: string, asset: string) { return this.client.post("/checkout/crypto", { trx_id: transactionId, asset }); }
}

export class Tsara {
  readonly environment: Environment;
  readonly apiKeys: ApiKeysResource;
  readonly transactions: TransactionsResource;
  readonly checkout: CheckoutResource;
  readonly bills: BillsResource;
  readonly cryptoBills: CryptoBillsResource;
  readonly stablecoinOnramps: StablecoinOnrampsResource;
  readonly stablecoinOfframps: StablecoinOfframpsResource;
  readonly stablecoinWallets: StablecoinWalletsResource;
  readonly stablecoinAddresses: StablecoinAddressesResource;
  readonly stablecoinTransfers: StablecoinTransfersResource;
  readonly rampWidgets: RampWidgetsResource;
  readonly rampTransactions: RampTransactionsResource;
  readonly customers: CustomersResource;
  readonly customerIdentity: CustomerIdentityResource;
  readonly paymentLinks: PaymentLinksResource;
  readonly transfers: TransfersResource;
  readonly payouts: PayoutsResource;
  readonly refunds: RefundsResource;
  readonly webhooks: WebhooksResource;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(private readonly options: TsaraOptions) {
    const inferred = options.secretKey.startsWith("sk_test_") ? "test" : options.secretKey.startsWith("sk_live_") ? "live" : null;
    if (!inferred) throw new TypeError("A secret key beginning with sk_test_ or sk_live_ is required.");
    if (options.environment && options.environment !== inferred) throw new TypeError("The environment does not match the secret key prefix.");
    if (!options.fetch && typeof globalThis.fetch !== "function") throw new TypeError("A Fetch implementation is required.");
    if ((options.maxRetries ?? 2) < 0 || (options.maxRetries ?? 2) > 5) throw new TypeError("maxRetries must be between 0 and 5.");
    if ((options.timeout ?? 30_000) <= 0) throw new TypeError("timeout must be positive.");
    const baseUrl = new URL(options.baseUrl ?? "https://api.tsara.ng/v1");
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
    if (baseUrl.protocol !== "https:" && !(baseUrl.protocol === "http:" && isLocal)) throw new TypeError("The base URL must use HTTPS unless it targets localhost.");
    if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) throw new TypeError("The base URL cannot contain credentials, a query string, or a fragment.");
    this.environment = options.environment ?? inferred;
    this.baseUrl = baseUrl.toString().replace(/\/$/, "");
    this.timeout = options.timeout ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.apiKeys = new ApiKeysResource(this);
    this.transactions = new TransactionsResource(this);
    this.checkout = new CheckoutResource(this);
    this.bills = new BillsResource(this);
    this.cryptoBills = new CryptoBillsResource(this);
    this.stablecoinOnramps = new StablecoinOnrampsResource(this);
    this.stablecoinOfframps = new StablecoinOfframpsResource(this);
    this.stablecoinWallets = new StablecoinWalletsResource(this);
    this.stablecoinAddresses = new StablecoinAddressesResource(this);
    this.stablecoinTransfers = new StablecoinTransfersResource(this);
    this.rampWidgets = new RampWidgetsResource(this);
    this.rampTransactions = new RampTransactionsResource(this);
    this.customers = new CustomersResource(this);
    this.customerIdentity = new CustomerIdentityResource(this);
    this.paymentLinks = new PaymentLinksResource(this);
    this.transfers = new TransfersResource(this);
    this.payouts = new PayoutsResource(this);
    this.refunds = new RefundsResource(this);
    this.webhooks = new WebhooksResource(this);
  }

  get(path: string, query: Query = {}) { return this.request("GET", path, { query }); }
  post(path: string, body: Record<string, unknown> = {}, idempotencyKey?: string) { return this.request("POST", path, { body, idempotencyKey }); }
  publicPost(path: string, body: Record<string, unknown> = {}) { return this.request("POST", path, { body, authenticate: false }); }
  async page<T = Record<string, unknown>>(path: string, query: Query = {}): Promise<Page<T>> { return parsePage<T>(await this.get(path, query)); }
  async *iterate<T = Record<string, unknown>>(path: string, query: Query = {}): AsyncGenerator<T> {
    let pageNumber = Math.max(1, Number(query.page ?? 1));
    do {
      const page = await this.page<T>(path, { ...query, page: pageNumber });
      for (const item of page.data) yield item;
      pageNumber++;
      if (!page.hasNextPage) break;
    } while (true);
  }

  async request(method: string, path: string, options: RequestOptions = {}): Promise<Record<string, unknown>> {
    const url = new URL(this.baseUrl + "/" + path.replace(/^\//, ""));
    for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json", "User-Agent": `tsara-node/0.1.0${this.options.application ? ` ${this.options.application}` : ""}` };
    if (options.authenticate !== false) headers.Authorization = `Bearer ${this.options.secretKey}`;
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    const safeToRetry = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) || Boolean(options.idempotencyKey);

    for (let attempt = 0; ; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const response = await this.fetcher(url, { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: controller.signal });
        const data = await response.json().catch(() => ({})) as Record<string, unknown>;
        const apiStatus = Number(data.status_code);
        const envelopeFailed = data.success === false || data.status === "failed" || (Number.isInteger(apiStatus) && apiStatus >= 400);
        if (response.ok && !envelopeFailed) return data;
        const effectiveStatus = response.ok && Number.isInteger(apiStatus) && apiStatus >= 400 && apiStatus <= 599
          ? apiStatus : response.status;
        const error = errorForStatus(effectiveStatus, String(data.message ?? "Tsara API request failed."), (data.errors as Record<string, unknown>) ?? {}, response.headers.get("x-request-id") ?? undefined);
        if (safeToRetry && error.retryable && attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt, response.headers.get("retry-after"));
          continue;
        }
        throw error;
      } catch (error) {
        if (error instanceof TsaraError) throw error;
        const networkError = error instanceof Error && error.name === "AbortError"
          ? new TimeoutError("Tsara request timed out.", 0, {}, undefined, true)
          : new NetworkError(error instanceof Error ? error.message : "Tsara network request failed.", 0, {}, undefined, true);
        if (safeToRetry && attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt);
          continue;
        }
        throw networkError;
      } finally { clearTimeout(timer); }
    }
  }

  private async waitBeforeRetry(attempt: number, retryAfter?: string | null): Promise<void> {
    const parsed = retryAfter !== null && retryAfter !== undefined && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : 100 * (2 ** attempt);
    await new Promise(resolve => setTimeout(resolve, Math.min(2000, parsed)));
  }
}

export { PaymentLinksResource, TransfersResource, PayoutsResource, RefundsResource, WebhooksResource, CustomersResource, CustomerIdentityResource, BillsResource, CryptoBillsResource, StablecoinOnrampsResource, StablecoinOfframpsResource, StablecoinWalletsResource, StablecoinAddressesResource, StablecoinTransfersResource, RampWidgetsResource, RampTransactionsResource, ApiKeysResource } from "./resources";
export * from "./errors";
export * from "./foundations";
