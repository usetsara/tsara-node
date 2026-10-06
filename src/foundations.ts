import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { WebhookSignatureError } from "./errors";

export interface Page<T = Record<string, unknown>> {
  data: T[];
  meta: Record<string, unknown>;
  raw: Record<string, unknown>;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export function parsePage<T = Record<string, unknown>>(raw: Record<string, unknown>): Page<T> {
  const payload = raw.data;
  const container = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const data = Array.isArray(container.data) ? container.data as T[] : Array.isArray(payload) ? payload as T[] : Array.isArray(container.items) ? container.items as T[] : [];
  const meta = raw.meta && typeof raw.meta === "object" ? raw.meta as Record<string, unknown> : container.meta && typeof container.meta === "object" ? container.meta as Record<string, unknown> : {};
  const currentPage = Math.max(1, Number(meta.current_page ?? meta.page ?? 1));
  const lastPage = Math.max(currentPage, Number(meta.last_page ?? meta.total_pages ?? meta.pages ?? currentPage));
  const hasNextPage = "next_page_url" in meta ? Boolean(meta.next_page_url) : "has_more" in meta ? Boolean(meta.has_more) : currentPage < lastPage;
  return { data, meta, raw, currentPage, lastPage, hasNextPage };
}

export function generateIdempotencyKey(prefix = "tsara"): string {
  if (!/^[A-Za-z0-9_-]+$/.test(prefix)) throw new TypeError("Idempotency prefix may contain only letters, numbers, underscores, and hyphens.");
  return `${prefix.toLowerCase()}_${randomUUID().replace(/-/g, "")}`;
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
  const normalized = signature.trim().replace(/^sha512=/i, "");
  if (!normalized || !secret || !/^[a-f0-9]{128}$/i.test(normalized)) return false;
  const expected = createHmac("sha512", secret).update(payload).digest();
  const received = Buffer.from(normalized, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function constructWebhookEvent<T = Record<string, unknown>>(payload: string | Buffer, signature: string, secret: string): T {
  if (!verifyWebhookSignature(payload, signature, secret)) throw new WebhookSignatureError("Invalid Tsara webhook signature.");
  try { return JSON.parse(payload.toString()) as T; }
  catch { throw new WebhookSignatureError("Tsara webhook payload is not valid JSON."); }
}
