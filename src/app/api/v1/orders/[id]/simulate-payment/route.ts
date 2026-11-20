import { NextRequest } from "next/server";
import { apiError, handleApiError } from "@/lib/api/response";

export async function POST(
  _req: NextRequest,
  _context: { params: { id: string } }
) {
  try {
    return apiError(
      "Tính năng thanh toán thử nghiệm đã được tắt.",
      "FORBIDDEN",
      403
    );
  } catch (err) {
    return handleApiError(err);
  }
}

