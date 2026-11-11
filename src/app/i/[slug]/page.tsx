import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import { TEMPLATES_REGISTRY, DEFAULT_TEMPLATE_SLUG } from "@/lib/templates/registry";
import {
  INTERACTIVE_TEMPLATE_URLS,
  hydrateInteractiveHtml,
} from "@/lib/templates/hydrateInteractiveHtml";
import PasswordUnlockForm from "./PasswordUnlockForm";
import { Archive, Lock } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const inv = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    include: {
      revisions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!inv || inv.status !== "PUBLISHED") {
    return { title: "Thiệp mời" };
  }

  let subtitle = "";
  try {
    const rev = inv.revisions[0];
    if (rev) {
      const parsed = JSON.parse(rev.contentJson);
      subtitle = parsed?.subtitle || "";
    }
  } catch {
    // ignore malformed content JSON
  }

  // Respect privacy: noindex if unlisted or password protected
  const shouldIndex = inv.privacyMode === "PUBLIC" && inv.allowIndexing;

  return {
    title: inv.title || "Thiệp mời",
    description: subtitle || "Lời mời và kỷ niệm trân trọng dành riêng cho bạn.",
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
  };
}

export default async function PublicInvitationPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  const inv = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    include: {
      templateVersion: {
        include: { template: true },
      },
      revisions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!inv) {
    notFound();
  }

  // If draft, only owner or admin can preview
  if (inv.status === "DRAFT") {
    if (!user || (user.id !== inv.ownerId && !user.roles.includes("ADMIN"))) {
      notFound();
    }
  }

  // If archived
  if (inv.status === "ARCHIVED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white text-center">
        <div className="max-w-md p-8 rounded-3xl bg-slate-800 border border-slate-700 space-y-4">
          <Archive className="w-12 h-12 mx-auto text-amber-400" />
          <h1 className="text-xl font-serif font-bold">Thiệp mời đã được lưu trữ</h1>
          <p className="text-xs text-slate-400">
            Sự kiện này đã kết thúc và thiệp mời đã được chuyển vào kho lưu trữ của chủ sở hữu.
          </p>
        </div>
      </div>
    );
  }

  // Password Protection
  if (inv.privacyMode === "PASSWORD" && inv.passcodeHash) {
    const isOwner = user && user.id === inv.ownerId;
    const cookieStore = cookies();
    const isUnlocked = cookieStore.get(`unlocked_${inv.slug}`)?.value === "true";

    if (!isOwner && !isUnlocked) {
      return <PasswordUnlockForm slug={inv.slug} title={inv.title} />;
    }
  }

  // Record daily view
  const today = new Date().toISOString().split("T")[0];
  await prisma.invitationEventStatsDaily.upsert({
    where: {
      invitationId_dayUTC: {
        invitationId: inv.id,
        dayUTC: today,
      },
    },
    update: {
      views: { increment: 1 },
    },
    create: {
      invitationId: inv.id,
      dayUTC: today,
      views: 1,
    },
  }).catch(() => {});

  const latestRev = inv.revisions[0];
  const content = latestRev ? JSON.parse(latestRev.contentJson) : null;
  const templateSlug = inv.templateVersion.template.slug;
  const templateMeta = TEMPLATES_REGISTRY[templateSlug] || TEMPLATES_REGISTRY[DEFAULT_TEMPLATE_SLUG];

  let interactiveHtml: string | undefined;
  if (content && INTERACTIVE_TEMPLATE_URLS[templateSlug]) {
    try {
      const htmlPath = path.join(process.cwd(), "public", "templates", `${templateSlug}.html`);
      const rawHtml = fs.readFileSync(htmlPath, "utf-8");
      interactiveHtml = hydrateInteractiveHtml(rawHtml, templateSlug, content, {
        invitationSlug: inv.slug,
        isPreview: false,
      });
    } catch {
      // Fallback to client template loading if file read fails
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center">
      {inv.status === "DRAFT" && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 sticky top-0 z-50 shadow">
          ⚠️ Chế độ xem trước của tác giả (Bản nháp chưa xuất bản công khai)
        </div>
      )}
      <TemplateRenderer
        content={content}
        theme={templateMeta.theme}
        slug={inv.slug}
        templateSlug={templateSlug}
        interactiveHtml={interactiveHtml}
        isPreview={false}
      />
    </div>
  );
}

