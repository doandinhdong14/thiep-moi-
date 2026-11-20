"use client";

/**
 * Creates (or resumes) an invitation draft for the given template slug
 * and returns the direct editor URL (`/editor/<id>?step=content`).
 */
export async function createDraftEditorUrl(templateSlug: string): Promise<string> {
  const res = await fetch("/api/v1/invitations/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateSlug }),
  });

  const data = await res.json().catch(() => null);
  if (res.ok && data?.data?.editorUrl) {
    return data.data.editorUrl as string;
  }

  throw new Error(
    data?.error?.message || "Không thể mở trang chỉnh sửa lúc này. Vui lòng thử lại."
  );
}
