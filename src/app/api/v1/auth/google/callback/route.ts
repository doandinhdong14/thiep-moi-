import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

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

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id?: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("utf8")
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const origin = getAppOrigin(req);
  const { searchParams } = new URL(req.url);

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  let returnTo = "/dashboard";
  let stateRedirectUri: string | undefined;

  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (
        parsed.returnTo &&
        typeof parsed.returnTo === "string" &&
        parsed.returnTo.startsWith("/") &&
        !parsed.returnTo.startsWith("//")
      ) {
        returnTo = parsed.returnTo;
      }
      if (parsed.redirectUri && typeof parsed.redirectUri === "string") {
        stateRedirectUri = parsed.redirectUri;
      }
    } catch {
      // Fallback to default
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
  }

  const redirectUri = stateRedirectUri || `${origin}/api/v1/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google OAuth token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", origin));
    }

    // 2. Fetch user information
    let googleUser: GoogleUserInfo = {};

    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userInfoRes.ok) {
        googleUser = await userInfoRes.json();
      }
    } catch (err) {
      console.warn("Could not fetch userinfo endpoint, falling back to id_token:", err);
    }

    // Fallback: extract claims from id_token if userinfo didn't populate
    if (!googleUser.email && tokenData.id_token) {
      const idPayload = parseJwt(tokenData.id_token);
      if (idPayload) {
        googleUser = {
          email: typeof idPayload.email === "string" ? idPayload.email : undefined,
          name: typeof idPayload.name === "string" ? idPayload.name : undefined,
          picture: typeof idPayload.picture === "string" ? idPayload.picture : undefined,
        };
      }
    }

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/login?error=no_email_provided", origin));
    }

    const email = googleUser.email.toLowerCase().trim();

    // 3. Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: googleUser.name?.trim() || email.split("@")[0],
          image: googleUser.picture || null,
          emailVerified: new Date(),
          status: "ACTIVE",
          locale: "vi-VN",
          imageCredits: 10,
          audioCredits: 5,
          roles: {
            create: {
              role: "CREATOR",
              grantedBy: "GOOGLE_OAUTH",
            },
          },
        },
        include: {
          roles: true,
        },
      });

      await logAudit({
        actorId: user.id,
        actorRole: "CREATOR",
        action: "USER_SIGNUP_GOOGLE",
        resourceType: "User",
        resourceId: user.id,
        afterSummary: { email: user.email, name: user.name },
      });
    } else {
      if (user.status !== "ACTIVE") {
        return NextResponse.redirect(new URL("/login?error=account_suspended", origin));
      }

      // If user had no role, give default CREATOR
      if (user.roles.length === 0) {
        await prisma.roleAssignment.create({
          data: {
            userId: user.id,
            role: "CREATOR",
            grantedBy: "GOOGLE_OAUTH",
          },
        });
      }

      // Sync avatar or verified status if changed
      const updates: { image?: string; emailVerified?: Date } = {};
      if (!user.image && googleUser.picture) {
        updates.image = googleUser.picture;
      }
      if (!user.emailVerified) {
        updates.emailVerified = new Date();
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }

      await logAudit({
        actorId: user.id,
        actorRole: user.roles[0]?.role || "CREATOR",
        action: "USER_LOGIN_GOOGLE",
        resourceType: "User",
        resourceId: user.id,
      });
    }

    // 4. Create local session
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    const session = await createSession(user.id, userAgent, ipAddress);

    // 5. Build response and set session cookie
    const response = NextResponse.redirect(new URL(returnTo, origin));
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    // Clear state cookie
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(new URL("/login?error=oauth_error", origin));
  }
}
