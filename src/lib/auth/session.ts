import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "dingdong_session";
const SESSION_DURATION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    // Session expired
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    ...session.user,
    roles: session.user.roles.map((r) => r.role),
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  const hasAllowedRole = user.roles.some((r) => allowedRoles.includes(r));
  if (!hasAllowedRole) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function destroySession() {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

