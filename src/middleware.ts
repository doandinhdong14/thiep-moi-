import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting map for middleware (in-memory per edge instance)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(key);

  if (!record || record.resetAt <= now) {
    ipRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // 1. CSRF Protection for state-changing API requests
  const isProtectedApi =
    pathname.startsWith("/api/v1/") ||
    pathname.startsWith("/api/shop/") ||
    pathname.startsWith("/api/gifts/") ||
    pathname.startsWith("/api/admin/shop/");

  if (isProtectedApi && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // If origin host does not match request host
        if (originUrl.host !== host && !originUrl.host.includes("localhost") && !host.includes("localhost")) {
          return NextResponse.json(
            { error: { code: "CSRF_FORBIDDEN", message: "Yêu cầu vi phạm chính sách bảo mật CSRF." } },
            { status: 403 }
          );
        }
      } catch (e) {
        // invalid origin header
        return NextResponse.json(
          { error: { code: "CSRF_INVALID_ORIGIN", message: "Origin header không hợp lệ." } },
          { status: 403 }
        );
      }
    }
  }

  // 2. Rate limiting for sensitive API endpoints
  if (pathname.startsWith("/api/v1/auth/sign-in") || pathname.startsWith("/api/v1/auth/sign-up")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const key = `auth_${ip}`;
    // 30 requests per minute
    if (isRateLimited(key, 30, 60000)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 1 phút.",
          },
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/v1/gift-cards/activate")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const key = `activate_${ip}`;
    // 20 requests per minute
    if (isRateLimited(key, 20, 60000)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Bạn đã thử kích hoạt quá nhiều lần. Vui lòng thử lại sau 1 phút.",
          },
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (
    pathname.startsWith("/api/gifts/") ||
    pathname.startsWith("/api/shop/checkout") ||
    pathname.startsWith("/api/shop/uploads") ||
    pathname.startsWith("/api/shop/orders/")
  ) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const key = `shop_${pathname.split("/").slice(0, 4).join("_")}_${ip}`;
    if (isRateLimited(key, 45, 60000)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Thao tác quá nhanh, vui lòng thử lại sau ít phút.",
          },
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/api/shop/:path*",
    "/api/gifts/:path*",
    "/api/admin/shop/:path*",
  ],
};

