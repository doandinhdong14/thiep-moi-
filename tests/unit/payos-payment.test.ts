import { describe, it, expect } from "vitest";
import {
  generatePayOSOrderCode,
  getPayOSClient,
  parseStoredPayOSQrAttempt,
} from "@/lib/payments/payos";
import { buildVietQrPayload, resolveVietQRBank } from "@/lib/payments/vietqr";
import { TEST_MEDIA_CREDIT_PRICE_VND, TEST_PRODUCT_PRICE_VND } from "@/data/catalogData";

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

  it("should enforce 1.000đ price for products and both media upload credits", () => {
    expect(TEST_PRODUCT_PRICE_VND).toBe(1000);
    expect(TEST_MEDIA_CREDIT_PRICE_VND).toBe(1000);
  });

  it("should generate valid in-app NAPAS VietQR EMVCo payload without external URLs", () => {
    const tcb = resolveVietQRBank("TCB");
    expect(tcb.bin).toBe("970407");

    const mb = resolveVietQRBank("970422");
    expect(mb.code).toBe("MB");

    const payload = buildVietQrPayload({
      bankBin: tcb.bin,
      accountNumber: "19036789123456",
      amount: 1000,
      description: "DDG TEST 001",
    });

    expect(payload.startsWith("000201010212")).toBe(true);
    expect(payload).toContain("A000000727");
    expect(payload).toContain("54041000");
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("should parse stored PENDING PayOS QR metadata cleanly with inline PNG data URL and no checkoutUrl", async () => {
    const sampleQr = buildVietQrPayload({
      bankBin: "970422",
      accountNumber: "0123456789",
      amount: 1000,
      description: "DDG ORDER1",
    });

    const parsed = await parseStoredPayOSQrAttempt({
      status: "PENDING",
      amountVnd: 1000,
      providerRef: "1762900000123",
      rawSafeMetadata: JSON.stringify({
        orderCode: 1762900000123,
        paymentLinkId: "pl_test_123",
        qrCode: sampleQr,
        bin: "970422",
        accountNumber: "0123456789",
        accountName: "CONG TY CP DING DONG GIFT VN",
        amount: 1000,
        description: "DDG ORDER1",
      }),
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(parsed?.bankName).toContain("MB Bank");
    expect((parsed as any)?.checkoutUrl).toBeUndefined();
  });
});

