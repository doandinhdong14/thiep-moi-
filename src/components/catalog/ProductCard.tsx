"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CatalogProduct } from "@/data/catalogData";
import { catalogProductToProductItem } from "@/data/landingData";
import { createDraftEditorUrl } from "@/lib/templates/openEditor";
import ProductShowcaseCard from "@/components/landing/ProductShowcaseCard";

interface ProductCardProps {
  product: CatalogProduct;
  index?: number;
  onOpenDemo: (product: CatalogProduct) => void;
}

export default function ProductCard({ product, index = 0, onOpenDemo }: ProductCardProps) {
  const router = useRouter();
  const [loadingDraft, setLoadingDraft] = useState(false);

  const showcaseItem = useMemo(() => catalogProductToProductItem(product), [product]);

  const handleCustomize = async () => {
    if (loadingDraft || product.isLocked) return;
    setLoadingDraft(true);
    try {
      const editorUrl = await createDraftEditorUrl(product.slug);
      router.push(editorUrl);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Không thể mở trang chỉnh sửa. Vui lòng thử lại.");
    } finally {
      setLoadingDraft(false);
    }
  };

  return (
    <ProductShowcaseCard
      product={showcaseItem}
      index={index}
      primaryLabel="Chỉnh sửa ngay"
      isCreating={loadingDraft}
      onPrimaryAction={handleCustomize}
      onOpenDemo={() => onOpenDemo(product)}
      showGuideLinks={true}
    />
  );
}
