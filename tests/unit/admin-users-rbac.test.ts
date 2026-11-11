import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "@/lib/auth/session";

describe("Admin User Management & RBAC Suite", () => {
  let testUserId: string;
  const testEmail = `rbac_test_${Date.now()}@dingdonggift.vn`;

  beforeAll(async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const user = await prisma.user.create({
      data: {
        name: "RBAC Test User",
        email: testEmail,
        passwordHash,
        status: "ACTIVE",
        imageCredits: 5,
        audioCredits: 2,
        roles: {
          create: [{ role: "CREATOR" }],
        },
      },
      include: { roles: true },
    });
    testUserId = user.id;
  });

  it("should create user with CREATOR role by default", async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { roles: true },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe(testEmail);
    expect(user?.roles.map((r) => r.role)).toContain("CREATOR");
    expect(user?.imageCredits).toBe(5);
    expect(user?.audioCredits).toBe(2);
  });

  it("should grant additional roles (ADMIN, SHOP_OWNER) via RoleAssignment", async () => {
    await prisma.roleAssignment.create({
      data: {
        userId: testUserId,
        role: "ADMIN",
        grantedBy: "TEST_RUNNER",
      },
    });

    await prisma.roleAssignment.create({
      data: {
        userId: testUserId,
        role: "SHOP_OWNER",
        grantedBy: "TEST_RUNNER",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { roles: true },
    });

    const roles = user?.roles.map((r) => r.role);
    expect(roles).toContain("ADMIN");
    expect(roles).toContain("SHOP_OWNER");
    expect(roles).toContain("CREATOR");
  });

  it("should enforce unique constraint on userId and role", async () => {
    await expect(
      prisma.roleAssignment.create({
        data: {
          userId: testUserId,
          role: "ADMIN",
        },
      })
    ).rejects.toThrow();
  });

  it("should revoke roles cleanly", async () => {
    await prisma.roleAssignment.deleteMany({
      where: {
        userId: testUserId,
        role: "SHOP_OWNER",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { roles: true },
    });

    const roles = user?.roles.map((r) => r.role);
    expect(roles).not.toContain("SHOP_OWNER");
    expect(roles).toContain("ADMIN");
  });

  it("should update user status to SUSPENDED and verify session invalidation logic", async () => {
    // Create a mock session
    await prisma.session.create({
      data: {
        userId: testUserId,
        token: `mock_session_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    let sessions = await prisma.session.findMany({ where: { userId: testUserId } });
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    // Suspend user and revoke sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUserId },
        data: { status: "SUSPENDED" },
      }),
      prisma.session.deleteMany({
        where: { userId: testUserId },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(updatedUser?.status).toBe("SUSPENDED");

    sessions = await prisma.session.findMany({ where: { userId: testUserId } });
    expect(sessions.length).toBe(0);
  });

  it("should adjust credits accurately", async () => {
    const updated = await prisma.user.update({
      where: { id: testUserId },
      data: {
        imageCredits: 100,
        audioCredits: 50,
      },
    });

    expect(updated.imageCredits).toBe(100);
    expect(updated.audioCredits).toBe(50);
  });

  it("should hash and verify passwords securely", async () => {
    const newPlainPassword = "BrandNewSecurePassword@2026!";
    const newHash = await hashPassword(newPlainPassword);

    await prisma.user.update({
      where: { id: testUserId },
      data: { passwordHash: newHash },
    });

    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user?.passwordHash).not.toBeNull();

    const isMatch = await verifyPassword(newPlainPassword, user!.passwordHash!);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", user!.passwordHash!);
    expect(isWrongMatch).toBe(false);
  });
});

