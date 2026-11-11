import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { templateMetaToProductItem } from "@/data/landingData";
import ProductShowcaseCard from "@/components/landing/ProductShowcaseCard";
import styles from "@/components/landing/ProductShowcase.module.css";
import { Sparkles } from "lucide-react";
import { getEffectiveVisibleTemplates } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function OccasionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const occasion = await prisma.occasion.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!occasion) {
    notFound();
  }

  // Filter active visible templates matching this vertical; fallback to all active user templates
  const allVisible = await getEffectiveVisibleTemplates();
  const matched = allVisible.filter((t) => t.occasionKey === occasion.formPresetKey);
  const matchingTemplates = matched.length > 0 ? matched : allVisible;

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Link
            href="/occasions"
            className="text-xs font-semibold text-rose-600 hover:underline inline-block mb-2"
          >
            ← Quay lại tất cả các dịp
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chuyên mục: {occasion.category.title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            {occasion.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Chọn một trong các mẫu thiết kế tinh tế bên dưới để bắt đầu tạo thiệp mời và mini website tương tác.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Mẫu thiệp dành riêng cho {occasion.title} ({matchingTemplates.length} mẫu)
          </h2>

          <div className={styles.showcaseGrid}>
            {matchingTemplates.map((tpl, index) => (
              <ProductShowcaseCard
                key={tpl.slug}
                product={templateMetaToProductItem(tpl)}
                index={index}
                primaryLabel="Dùng mẫu này"
                showGuideLinks={false}
                showPrice={false}
                subtitleText={tpl.theme.style}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

