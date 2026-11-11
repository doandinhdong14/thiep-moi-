import TemplatesCatalogClient from "@/components/templates/TemplatesCatalogClient";
import { getEffectiveVisibleTemplates } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function TemplatesGalleryPage() {
  const visibleTemplates = await getEffectiveVisibleTemplates();
  return <TemplatesCatalogClient templates={visibleTemplates} />;
}
