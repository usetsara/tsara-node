export class TsaraError extends Error {
  constructor(message: string, public readonly status = 0, public readonly details: Record<string, unknown> = {}, public readonly requestId?: string, public readonly retryable = false) {
    super(message);
    this.name = new.target.name;
  }
}
export class AuthenticationError extends TsaraError {}
export class AuthorizationError extends TsaraError {}
export class ValidationError extends TsaraError {}
export class NotFoundError extends TsaraError {}
export class ConflictError extends TsaraError {}
export class RateLimitError extends TsaraError {}
export class ServerError extends TsaraError {}
export class NetworkError extends TsaraError {}
export class TimeoutError extends NetworkError {}
export class WebhookSignatureError extends TsaraError {}

export function errorForStatus(status: number, message: string, details: Record<string, unknown>, requestId?: string): TsaraError {
  const retryable = [429, 502, 503, 504].includes(status);
  const ErrorClass = status === 401 ? AuthenticationError
    : status === 403 ? AuthorizationError
    : [400, 402, 422].includes(status) ? ValidationError
    : status === 404 ? NotFoundError
    : status === 409 ? ConflictError
    : status === 429 ? RateLimitError
    : status >= 500 ? ServerError
    : TsaraError;
  return new ErrorClass(message, status, details, requestId, retryable);
}
