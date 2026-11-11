import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import {
  TEMPLATES_REGISTRY,
  getAllTemplatesOrdered,
  isTemplateVisible,
} from "@/lib/templates/registry";
import { findCatalogProductBySlug, TEST_PRODUCT_PRICE_VND } from "@/data/catalogData";
import {
  getAdminTemplatesConfig,
  saveAdminTemplatesConfig,
  type AdminTemplatesConfig,
} from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

async function buildAdminTemplatesPayload(config: AdminTemplatesConfig) {
  const versionsWithCounts = await prisma.templateVersion
    .findMany({
      select: {
        template: { select: { slug: true } },
        _count: { select: { invitations: true } },
      },
    })
    .catch(() => []);

  const usageBySlug = new Map<string, number>();
  for (const row of versionsWithCounts) {
    const slug = row.template?.slug;
    if (!slug) continue;
    usageBySlug.set(slug, (usageBySlug.get(slug) || 0) + (row._count?.invitations || 0));
  }

  const ordered = getAllTemplatesOrdered();
  let visibleCounter = 0;

  const templates = ordered.map((tpl) => {
    const visible = isTemplateVisible(tpl, config.visibilityOverrides);
    if (visible) visibleCounter += 1;
    const catalog = findCatalogProductBySlug(tpl.slug);

    return {
      slug: tpl.slug,
      title: tpl.title,
      numberCode: tpl.numberCode || null,
      displayOrder: tpl.displayOrder || null,
      publicOrdinalCode: visible
        ? `#${String(visibleCounter).padStart(2, "0")}`
        : null,
      occasionKey: tpl.occasionKey,
      occasionTitle: tpl.occasionTitle,
      description: tpl.description,
      badge: tpl.badge || null,
      sourceFile: tpl.sourceFile || "React Built-in Component",
      interactiveUrl: tpl.interactiveUrl || null,
      isUserProvided: !tpl.defaultHidden,
      defaultHidden: Boolean(tpl.defaultHidden),
      visible,
      priceVnd: catalog?.price ?? TEST_PRODUCT_PRICE_VND,
      note: config.templateNotes[tpl.slug] || "",
      invitationsCount: usageBySlug.get(tpl.slug) || 0,
    };
  });

  return {
    templates,
    stats: {
      total: templates.length,
      visibleCount: templates.filter((t) => t.visible).length,
      hiddenCount: templates.filter((t) => !t.visible).length,
      userProvidedCount: templates.filter((t) => t.isUserProvided).length,
    },
    config,
  };
}

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const config = await getAdminTemplatesConfig();
    const payload = await buildAdminTemplatesPayload(config);
    return apiSuccess(payload);
  } catch (error) {
    return handleApiError(error);
  }
}

const PatchAdminTemplatesSchema = z.object({
  action: z
    .enum([
      "toggle_visibility",
      "update_template_note",
      "update_general_notes",
      "reset_defaults",
      "bulk_update",
    ])
    .optional(),
  slug: z.string().optional(),
  visible: z.boolean().optional(),
  note: z.string().max(2000).optional(),
  generalNotes: z.string().max(15000).optional(),
  visibilityOverrides: z.record(z.string(), z.boolean()).optional(),
  templateNotes: z.record(z.string(), z.string().max(2000)).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const json = await req.json();
    const data = PatchAdminTemplatesSchema.parse(json);
    const updatedBy = admin.email || admin.name || admin.id;

    let saved: AdminTemplatesConfig;

    if (data.action === "reset_defaults") {
      saved = await saveAdminTemplatesConfig({ resetDefaults: true }, updatedBy);
    } else if (data.action === "toggle_visibility") {
      if (!data.slug || !TEMPLATES_REGISTRY[data.slug]) {
        return apiError("Mẫu thiệp không tồn tại trong hệ thống.", "INVALID_SLUG", 400);
      }
      if (typeof data.visible !== "boolean") {
        return apiError("Thiếu trạng thái visible.", "INVALID_INPUT", 400);
      }
      saved = await saveAdminTemplatesConfig(
        { visibilityOverrides: { [data.slug]: data.visible } },
        updatedBy
      );
    } else if (data.action === "update_template_note") {
      if (!data.slug || !TEMPLATES_REGISTRY[data.slug]) {
        return apiError("Mẫu thiệp không tồn tại trong hệ thống.", "INVALID_SLUG", 400);
      }
      saved = await saveAdminTemplatesConfig(
        { templateNotes: { [data.slug]: data.note ?? "" } },
        updatedBy
      );
    } else if (data.action === "update_general_notes") {
      if (typeof data.generalNotes !== "string") {
        return apiError("Thiếu nội dung ghi chú.", "INVALID_INPUT", 400);
      }
      saved = await saveAdminTemplatesConfig(
        { generalNotes: data.generalNotes },
        updatedBy
      );
    } else {
      saved = await saveAdminTemplatesConfig(
        {
          visibilityOverrides: data.visibilityOverrides,
          templateNotes: data.templateNotes,
          generalNotes: data.generalNotes,
        },
        updatedBy
      );
    }

    await logAudit({
      actorId: admin.id,
      actorRole: "ADMIN",
      action: `ADMIN_TEMPLATES_${(data.action || "BULK_UPDATE").toUpperCase()}`,
      resourceType: "SystemSetting",
      resourceId: data.slug || "admin_templates_config_v1",
      afterSummary: {
        action: data.action || "bulk_update",
        slug: data.slug,
        visible: data.visible,
      },
    });

    const payload = await buildAdminTemplatesPayload(saved);
    return apiSuccess(payload);
  } catch (error) {
    return handleApiError(error);
  }
}

