import { describe, it, expect } from "vitest";
import { generatePayOSOrderCode, getPayOSClient } from "@/lib/payments/payos";

describe("PayOS Payment Integration Unit Tests", () => {
  it("should generate a valid numeric orderCode within safe integer range", () => {
    const code1 = generatePayOSOrderCode();
    const code2 = generatePayOSOrderCode();

    expect(typeof code1).toBe("number");
    expect(code1).toBeGreaterThan(0);
    expect(Number.isSafeInteger(code1)).toBe(true);
    expect(code1.toString().length).toBeGreaterThanOrEqual(10);
    expect(code1).not.toBe(code2);
  });

  it("should initialize PayOS client instance with environment credentials", () => {
    process.env.PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "test-client-id";
    process.env.PAYOS_API_KEY = process.env.PAYOS_API_KEY || "test-api-key";
    process.env.PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "test-checksum-key";
    const client = getPayOSClient();
    expect(client).not.toBeNull();
    expect(client?.paymentRequests).toBeDefined();
    expect(client?.webhooks).toBeDefined();
  });
});

