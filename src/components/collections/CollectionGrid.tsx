"use client";

import CollectionCard from "./CollectionCard";
import { CollectionItem } from "@/data/catalogData";

interface CollectionGridProps {
  collections: CollectionItem[];
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {collections.map((item) => (
        <CollectionCard key={item.id} collection={item} />
      ))}
    </div>
  );
}

