import { describe, expect, it } from "vitest";
import { Tsara } from "../src/index";

describe("Tsara", () => {
  it("rejects public keys", () => expect(() => new Tsara({ secretKey: "pk_test_nope" })).toThrow(/secret key/));
  it("rejects environment mismatch", () => expect(() => new Tsara({ secretKey: "sk_live_example", environment: "test" })).toThrow(/environment/));
  it("rejects insecure remote base URLs", () => {
    expect(() => new Tsara({ secretKey: "sk_test_example", baseUrl: "http://api.example.com/v1" })).toThrow(/HTTPS/);
  });

  it("allows HTTP only for local development", () => {
    expect(() => new Tsara({ secretKey: "sk_test_example", baseUrl: "http://127.0.0.1:8080/v1" })).not.toThrow();
  });

  it("rejects non-positive timeouts", () => {
    expect(() => new Tsara({ secretKey: "sk_test_example", timeout: 0 })).toThrow(/timeout/i);
  });

  it("rejects credentials in base URLs", () => {
    expect(() => new Tsara({ secretKey: "sk_test_example", baseUrl: "https://user@api.example.com/v1" })).toThrow(/credentials/i);
  });

});
