"use client";

import CollectionCard from "./CollectionCard";
import { CollectionItem } from "@/data/catalogData";
import styles from "@/components/landing/ProductShowcase.module.css";

interface CollectionGridProps {
  collections: CollectionItem[];
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  return (
    <div className={styles.showcaseGrid}>
      {collections.map((item, index) => (
        <CollectionCard key={item.id} collection={item} index={index} />
      ))}
    </div>
  );
}
