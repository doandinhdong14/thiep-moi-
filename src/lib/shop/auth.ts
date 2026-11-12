import crypto from "crypto";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

export const SHOP_GUEST_COOKIE = "ddg_shop_guest";
export const SHOP_ORDER_ACCESS_COOKIE = "ddg_shop_order_access";

function getServerSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    env.SESSION_SECRET ||
    "dingdonggift-dev-secret-change-me"
  );
}

function getGiftTokenPepper(): string {
  return (
    process.env.GIFT_CARD_ACTIVATION_PEPPER ||
    env.GIFT_CARD_ACTIVATION_PEPPER ||
    getServerSecret()
  );
}

function getAesKey(): Buffer {
  return crypto.createHash("sha256").update(`aes:${getServerSecret()}`).digest();
}

export function signValue(raw: string): string {
  const sig = crypto
    .createHmac("sha256", getServerSecret())
    .update(raw)
    .digest("base64url");
  return `${raw}.${sig}`;
}

export function verifySignedValue(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const raw = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", getServerSecret())
    .update(raw)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function readShopGuestToken(): string | null {
  try {
    const store = cookies();
    const raw = store.get(SHOP_GUEST_COOKIE)?.value;
    return verifySignedValue(raw);
  } catch {
    return null;
  }
}

export function getOrCreateShopGuestToken(): { token: string; isNew: boolean } {
  const existing = readShopGuestToken();
  if (existing) {
    return { token: existing, isNew: false };
  }
  const fresh = crypto.randomBytes(18).toString("base64url");
  return { token: fresh, isNew: true };
}

export function setShopGuestCookieOnResponse(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  token: string,
): void {
  res.cookies.set(SHOP_GUEST_COOKIE, signValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
}

export function hashShopToken(rawToken: string): string {
  return crypto
    .createHash("sha256")
    .update(`${getGiftTokenPepper()}:${rawToken}`)
    .digest("hex");
}

export function generateOpaqueGiftToken(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export function encryptGiftToken(rawToken: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getAesKey(), iv);
  const encrypted = Buffer.concat([cipher.update(rawToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptGiftToken(ciphertext: string): string | null {
  try {
    const [ivStr, tagStr, dataStr] = ciphertext.split(".");
    if (!ivStr || !tagStr || !dataStr) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getAesKey(),
      Buffer.from(ivStr, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagStr, "base64url"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataStr, "base64url")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export function generateOrderAccessToken(): string {
  return crypto.randomBytes(20).toString("base64url");
}

export function hashOrderAccessToken(raw: string): string {
  return crypto
    .createHash("sha256")
    .update(`order:${getServerSecret()}:${raw}`)
    .digest("hex");
}

export function readOrderAccessCookieMap(): Record<string, string> {
  try {
    const raw = cookies().get(SHOP_ORDER_ACCESS_COOKIE)?.value;
    const verified = verifySignedValue(raw);
    if (!verified) return {};
    const parsed = JSON.parse(verified) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOrderAccessToCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  orderCode: string,
  accessToken: string,
): void {
  const current = readOrderAccessCookieMap();
  const next = { ...current, [orderCode]: accessToken };
  // Keep at most 15 recent order tokens inside signed cookie
  const entries = Object.entries(next).slice(-15);
  const serialized = JSON.stringify(Object.fromEntries(entries));
  res.cookies.set(SHOP_ORDER_ACCESS_COOKIE, signValue(serialized), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function getShopActorFromRoles(roles: string[]) {
  return {
    isAdmin: roles.includes("ADMIN"),
    isShopManager: roles.includes("SHOP_MANAGER"),
    canManageShop: roles.includes("ADMIN") || roles.includes("SHOP_MANAGER"),
  };
}

export async function requireShopStaff() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  const perms = getShopActorFromRoles(user.roles);
  if (!perms.canManageShop) {
    throw new Error("FORBIDDEN");
  }
  return { user, ...perms };
}

export async function requireShopAdminOnly() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!user.roles.includes("ADMIN")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const clean = phone.replace(/\s+/g, "");
  if (clean.length <= 4) return "****";
  return `${clean.slice(0, 3)}***${clean.slice(-3)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}***@${domain}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length > 1 ? `${parts[0][0]}***` : "*";
  }
  return `${parts[0]} ${parts.slice(1).map((p) => `${p[0] || ""}***`).join(" ")}`;
}

export function maskStreetAddress(address: string | null | undefined): string {
  if (!address) return "";
  const trimmed = address.trim();
  if (trimmed.length <= 8) return "***";
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

