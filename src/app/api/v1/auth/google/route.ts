import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getAppOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  let proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

  if (host.includes("dingdonggift.com") || host.includes("railway.app")) {
    proto = "https";
  }

  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const origin = getAppOrigin(req);
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
  }

  const { searchParams } = new URL(req.url);
  const rawReturnTo = searchParams.get("returnTo") || searchParams.get("callbackUrl") || "/dashboard";
  const safeReturnTo =
    rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") ? rawReturnTo : "/dashboard";

  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  const nonce = crypto.randomBytes(16).toString("hex");
  const statePayload = {
    nonce,
    returnTo: safeReturnTo,
    redirectUri,
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("google_oauth_state", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  return response;
}
