"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CatalogProduct } from "@/data/catalogData";
import { catalogProductToProductItem } from "@/data/landingData";
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
    if (loadingDraft) return;
    setLoadingDraft(true);
    try {
      const res = await fetch("/api/v1/invitations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug: product.slug }),
      });
      const data = await res.json();
      if (res.ok && data.data?.editorUrl) {
        router.push(data.data.editorUrl);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDraft(false);
    }
    router.push(`/create?template=${product.slug}`);
  };

  return (
    <ProductShowcaseCard
      product={showcaseItem}
      index={index}
      primaryLabel="Tùy chỉnh ngay"
      isCreating={loadingDraft}
      onPrimaryAction={handleCustomize}
      onOpenDemo={() => onOpenDemo(product)}
      showGuideLinks={true}
    />
  );
}
