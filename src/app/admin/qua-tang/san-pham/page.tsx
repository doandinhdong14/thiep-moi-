"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Edit3,
  ExternalLink,
  FolderPlus,
  ImagePlus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface AdminCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

interface AdminVariantForm {
  id?: string;
  sku: string;
  name: string;
  colorName: string;
  colorHex: string;
  sizeLabel: string;
  priceVnd: string;
  compareAtVnd: string;
  initialStock: string;
  lowStockThreshold: string;
  isActive: boolean;
}

interface AdminProductRow {
  id: string;
  categoryId: string;
  category: { id: string; slug: string; name: string };
  slug: string;
  name: string;
  subtitle: string | null;
  shortDesc: string | null;
  description: string | null;
  materialCare: string | null;
  giftNote: string | null;
  productType: "SINGLE" | "COMBO" | "ADDON";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  images: string[];
  cardIncluded: boolean;
  eligibleTemplateIds: string[];
  defaultTemplateId: string | null;
  minPriceVnd: number;
  totalAvailableStock: number;
  variants: {
    id: string;
    sku: string;
    name: string;
    colorName: string | null;
    colorHex: string | null;
    sizeLabel: string | null;
    priceVnd: number;
    compareAtVnd: number | null;
    isActive: boolean;
    availableStock: number;
    onHand?: number;
    lowStockThreshold?: number;
  }[];
}

interface TemplateChoicesItem {
  slug: string;
  title: string;
}

export default function AdminShopProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [templates, setTemplates] = useState<TemplateChoicesItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Product Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState<"SINGLE" | "COMBO" | "ADDON">("SINGLE");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">("DRAFT");
  const [subtitle, setSubtitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [materialCare, setMaterialCare] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [cardIncluded, setCardIncluded] = useState(true);
  const [defaultTemplateId, setDefaultTemplateId] = useState("thiep-8");
  const [eligibleTemplateIds, setEligibleTemplateIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<AdminVariantForm[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        fetch("/api/admin/shop/products", { cache: "no-store" }),
        fetch("/api/admin/shop/categories", { cache: "no-store" }),
        fetch("/api/shop/templates", { cache: "no-store" }),
      ]);
      const [pJson, cJson, tJson] = await Promise.all([pRes.json(), cRes.json(), tRes.json()]);
      if (isShopApiSuccess(pJson)) setProducts(pJson.data || []);
      if (isShopApiSuccess(cJson)) setCategories(cJson.data || []);
      if (isShopApiSuccess(tJson) && tJson.data?.templates) setTemplates(tJson.data.templates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSaving(true);
    try {
      const res = await fetch("/api/admin/shop/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), isActive: true }),
      });
      if (res.ok) {
        setNewCatName("");
        await loadAll();
      }
    } finally {
      setCatSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setCategoryId(categories[0]?.id || "");
    setProductType("SINGLE");
    setStatus("DRAFT");
    setSubtitle("");
    setShortDesc("");
    setDescription("");
    setMaterialCare("");
    setGiftNote("");
    setIsFeatured(false);
    setCardIncluded(true);
    setDefaultTemplateId("thiep-8");
    setEligibleTemplateIds(["thiep-8", "thiep-10", "thiep-giang-sinh"]);
    setImages([]);
    setVariants([
      {
        sku: `DDG-${Date.now().toString().slice(-5)}`,
        name: "Tiêu chuẩn",
        colorName: "Kem sữa",
        colorHex: "#F5E6D3",
        sizeLabel: "Freesize",
        priceVnd: "199000",
        compareAtVnd: "",
        initialStock: "0",
        lowStockThreshold: "5",
        isActive: true,
      },
    ]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: AdminProductRow) => {
    setEditingId(p.id);
    setName(p.name);
    setCategoryId(p.categoryId);
    setProductType(p.productType);
    setStatus(p.status);
    setSubtitle(p.subtitle || "");
    setShortDesc(p.shortDesc || "");
    setDescription(p.description || "");
    setMaterialCare(p.materialCare || "");
    setGiftNote(p.giftNote || "");
    setIsFeatured(p.isFeatured);
    setCardIncluded(p.cardIncluded);
    setDefaultTemplateId(p.defaultTemplateId || "thiep-8");
    setEligibleTemplateIds(p.eligibleTemplateIds || []);
    setImages(p.images || []);
    setVariants(
      p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        colorName: v.colorName || "",
        colorHex: v.colorHex || "#F5E6D3",
        sizeLabel: v.sizeLabel || "",
        priceVnd: String(v.priceVnd),
        compareAtVnd: v.compareAtVnd ? String(v.compareAtVnd) : "",
        initialStock: String(v.onHand ?? v.availableStock ?? 0),
        lowStockThreshold: String(v.lowStockThreshold ?? 5),
        isActive: v.isActive,
      })),
    );
    setFormError(null);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/shop/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && isShopApiSuccess(json) && json.data?.publicUrl) {
        setImages((prev) => [...prev, json.data.publicUrl]);
      } else {
        setFormError(json?.error?.message || "Upload ảnh thất bại.");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        categoryId,
        name: name.trim(),
        subtitle: subtitle.trim() || null,
        shortDesc: shortDesc.trim() || null,
        description: description.trim() || null,
        materialCare: materialCare.trim() || null,
        giftNote: giftNote.trim() || null,
        productType,
        status,
        isFeatured,
        cardIncluded,
        defaultTemplateId: defaultTemplateId || null,
        eligibleTemplateIds,
        images,
        variants: variants.map((v, idx) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          name: v.name.trim(),
          colorName: v.colorName.trim() || null,
          colorHex: v.colorHex.trim() || null,
          sizeLabel: v.sizeLabel.trim() || null,
          priceVnd: Math.max(0, Number(v.priceVnd) || 0),
          compareAtVnd: v.compareAtVnd ? Number(v.compareAtVnd) : null,
          initialStock: Math.max(0, Number(v.initialStock) || 0),
          lowStockThreshold: Math.max(0, Number(v.lowStockThreshold) || 5),
          isActive: v.isActive,
          isDefault: idx === 0,
        })),
      };

      const url = editingId
        ? `/api/admin/shop/products/${editingId}`
        : "/api/admin/shop/products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setFormError(json?.error?.message || "Lưu sản phẩm thất bại.");
        return;
      }
      setModalOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p: AdminProductRow, nextStatus: "DRAFT" | "ACTIVE") => {
    await fetch(`/api/admin/shop/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadAll();
  };

  const handleDeleteProduct = async (p: AdminProductRow) => {
    if (!window.confirm(`Lưu trữ / xóa sản phẩm "${p.name}"?`)) return;
    await fetch(`/api/admin/shop/products/${p.id}`, { method: "DELETE" });
    await loadAll();
  };

  const filteredProducts = products.filter((p) =>
    statusFilter === "ALL" ? true : p.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Sản phẩm, Biến thể &amp; Danh mục quà
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sản phẩm DRAFT chỉ hiển thị tại Admin; chuyển sang ACTIVE &amp; nhập tồn &gt; 0 để mở
            bán ngoài Storefront.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Category quick bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 mr-1">Danh mục:</span>
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
            >
              {cat.name} ({cat._count?.products ?? 0})
            </span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Tên danh mục mới..."
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
          />
          <button
            type="submit"
            disabled={catSaving}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "DRAFT", "ACTIVE", "ARCHIVED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              statusFilter === st
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {st === "ALL" ? `Tất cả (${products.length})` : st}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Danh mục / Loại</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Giá từ</th>
                <th className="py-3 px-4 text-right">Tồn khả dụng</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0] || "/assets/shop/hero-gift-box.svg"}
                          alt={p.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {p.variants.length} phân loại • Thiệp mặc định:{" "}
                            {p.defaultTemplateId || "Tùy chọn"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{p.category.name}</div>
                      <div className="text-[11px] text-slate-400">{p.productType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "DRAFT"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatVnd(p.minPriceVnd)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {p.totalAvailableStock}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {p.status === "ACTIVE" && (
                          <Link
                            href={`/qua-tang/san-pham/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Xem ngoài shop"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(p, p.status === "ACTIVE" ? "DRAFT" : "ACTIVE")
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {p.status === "ACTIVE" ? "Ẩn (DRAFT)" : "Mở bán"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-[#FFF0F3] text-[#B94A67] hover:bg-[#FFE0E8]"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Lưu trữ / Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 flex items-start justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                {editingId ? "Chỉnh sửa sản phẩm & phân loại" : "Thêm sản phẩm quà tặng mới"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Khăn len Cashmere Sương Mai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại</label>
                    <select
                      value={productType}
                      onChange={(e) =>
                        setProductType(e.target.value as "SINGLE" | "COMBO" | "ADDON")
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="SINGLE">SINGLE</option>
                      <option value="COMBO">COMBO</option>
                      <option value="ADDON">ADDON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED")
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="DRAFT">DRAFT (Nháp)</option>
                      <option value="ACTIVE">ACTIVE (Mở bán)</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phụ đề ngắn
                  </label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú hộp quà
                  </label>
                  <input
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Kèm hộp giấy nắp nam châm & thiệp QR"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả ngắn &amp; Mô tả chi tiết
                  </label>
                  <textarea
                    rows={2}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Mô tả ngắn hiển thị dưới tiêu đề..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 mb-2"
                  />
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Câu chuyện sản phẩm, kích thước, cảm giác chạm..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chất liệu &amp; Hướng dẫn bảo quản
                  </label>
                  <input
                    value={materialCare}
                    onChange={(e) => setMaterialCare(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Real photos */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Ảnh thật sản phẩm ({images.length})
                  </span>
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{uploading ? "Đang tải..." : "Upload ảnh JPG/PNG/WebP"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative group">
                      <img
                        src={url}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card binding */}
              <div className="border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mẫu thiệp mặc định gắn với sản phẩm
                  </label>
                  <select
                    value={defaultTemplateId}
                    onChange={(e) => setDefaultTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                  >
                    {templates.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.title} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-5 text-xs">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={cardIncluded}
                      onChange={(e) => setCardIncluded(e.target.checked)}
                    />
                    <span>Tặng kèm thiệp QR</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <span>Sản phẩm nổi bật</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    Mẫu thiệp cho phép khách chọn (để trống = tất cả mẫu đang bật)
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50">
                    {templates.map((t) => {
                      const active = eligibleTemplateIds.includes(t.slug);
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          onClick={() =>
                            setEligibleTemplateIds((prev) =>
                              active ? prev.filter((s) => s !== t.slug) : [...prev, t.slug],
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 ${
                            active
                              ? "bg-[#C85A77] text-white"
                              : "bg-white border border-slate-200 text-slate-700"
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{t.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Biến thể &amp; Giá bán ({variants.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) => [
                        ...prev,
                        {
                          sku: `DDG-${Date.now().toString().slice(-4)}-${prev.length + 1}`,
                          name: `Màu ${prev.length + 1}`,
                          colorName: "",
                          colorHex: "#D46C88",
                          sizeLabel: "",
                          priceVnd: prev[0]?.priceVnd || "199000",
                          compareAtVnd: "",
                          initialStock: "0",
                          lowStockThreshold: "5",
                          isActive: true,
                        },
                      ])
                    }
                    className="text-xs font-semibold text-[#B94A67] hover:underline"
                  >
                    + Thêm biến thể
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs items-end"
                    >
                      <div>
                        <label className="text-[11px] text-slate-500">SKU *</label>
                        <input
                          required
                          value={v.sku}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, sku: e.target.value } : row,
                              ),
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-500">Tên biến thể *</label>
                        <input
                          required
                          value={v.name}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, name: e.target.value } : row,
                              ),
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Giá bán (đ) *</label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={v.priceVnd}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, priceVnd: e.target.value } : row,
                              ),
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      {!v.id && (
                        <div>
                          <label className="text-[11px] text-slate-500">Tồn khởi tạo</label>
                          <input
                            type="number"
                            min={0}
                            value={v.initialStock}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, initialStock: e.target.value } : row,
                                ),
                              )
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, isActive: e.target.checked } : row,
                                ),
                              )
                            }
                          />
                          <span>Mở</span>
                        </label>
                        {variants.length > 1 && !v.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setVariants((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-rose-600 hover:underline"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#C85A77] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

