import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;
  let userCount = 0;

  try {
    const dbStart = Date.now();
    userCount = await prisma.user.count();
    dbLatency = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `error: ${err?.message || "failed to connect"}`;
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        provider: process.env.DATABASE_URL?.includes("postgres") ? "postgresql" : "sqlite",
        totalUsers: userCount,
      },
      memory: {
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}

