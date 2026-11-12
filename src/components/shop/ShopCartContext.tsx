"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartSummaryView } from "@/lib/shop/cart";
import { isShopApiSuccess, type PublicShopSettings } from "@/lib/shop/types";

interface UndoRemovalState {
  item: {
    variantId: string;
    quantity: number;
    customizationId: string | null;
    giftWrapCode: string;
    productName: string;
  };
}

export type ShopDrawerTab = "cart" | "orders";

interface ShopCartContextValue {
  cart: CartSummaryView | null;
  settings: PublicShopSettings | null;
  wishlistIds: string[];
  loading: boolean;
  drawerOpen: boolean;
  drawerTab: ShopDrawerTab;
  badgePopped: boolean;
  undoToast: UndoRemovalState | null;
  openDrawer: (tab?: ShopDrawerTab | unknown) => void;
  setDrawerTab: (tab: ShopDrawerTab) => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<CartSummaryView | null>;
  refreshSettings: () => Promise<PublicShopSettings | null>;
  addToCart: (input: {
    variantId: string;
    quantity?: number;
    customizationId?: string | null;
    giftWrapCode?: string;
    flyFromEl?: HTMLElement | null;
    flyImageUrl?: string | null;
    openDrawerAfter?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateCartItem: (
    itemId: string,
    patch: {
      quantity?: number;
      giftWrapCode?: string;
      unitIndex?: number;
      customizationId?: string | null;
      applyToAllUnits?: boolean;
    },
  ) => Promise<{ ok: boolean; error?: string }>;
  removeCartItem: (itemId: string) => Promise<void>;
  undoRemoveItem: () => Promise<void>;
  dismissUndoToast: () => void;
  applyPromoCode: (code: string | null) => Promise<{ ok: boolean; message?: string }>;
  toggleWishlist: (productId: string) => Promise<boolean>;
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function runFlyToCartAnimation(
  sourceEl: HTMLElement | null | undefined,
  imageUrl: string | null | undefined,
) {
  if (typeof window === "undefined" || !sourceEl || !imageUrl || prefersReducedMotion()) {
    return;
  }
  const navCart = document.getElementById("ddg-nav-cart-btn");
  const mobileCart = document.getElementById("ddg-mobile-cart-btn");
  const badge =
    navCart && navCart.getBoundingClientRect().width > 0
      ? navCart
      : mobileCart && mobileCart.getBoundingClientRect().width > 0
        ? mobileCart
        : null;
  if (!badge) return;

  const srcRect = sourceEl.getBoundingClientRect();
  const destRect = badge.getBoundingClientRect();
  if (srcRect.width === 0 || destRect.width === 0) return;

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "";
  img.className = "ddg-fly-clone";
  const startSize = Math.min(76, Math.max(44, srcRect.width * 0.4));
  img.style.width = `${startSize}px`;
  img.style.height = `${startSize}px`;
  img.style.left = `${srcRect.left + srcRect.width / 2 - startSize / 2}px`;
  img.style.top = `${srcRect.top + srcRect.height / 2 - startSize / 2}px`;
  img.style.opacity = "0.95";
  img.style.transform = "translate3d(0, 0, 0) scale(1)";

  document.body.appendChild(img);

  const dx =
    destRect.left + destRect.width / 2 - (srcRect.left + srcRect.width / 2);
  const dy =
    destRect.top + destRect.height / 2 - (srcRect.top + srcRect.height / 2);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      img.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.28)`;
      img.style.opacity = "0.15";
    });
  });

  window.setTimeout(() => {
    img.remove();
  }, 620);
}

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummaryView | null>(null);
  const [settings, setSettings] = useState<PublicShopSettings | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<ShopDrawerTab>("cart");
  const [badgePopped, setBadgePopped] = useState<boolean>(false);
  const [undoToast, setUndoToast] = useState<UndoRemovalState | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const triggerBadgePop = useCallback(() => {
    setBadgePopped(false);
    requestAnimationFrame(() => {
      setBadgePopped(true);
      window.setTimeout(() => setBadgePopped(false), 380);
    });
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/cart", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json)) {
        setCart(json.data);
        return json.data as CartSummaryView;
      }
    } catch {
      // ignore transient network
    }
    return null;
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/settings", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json)) {
        setSettings(json.data);
        return json.data as PublicShopSettings;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/wishlist", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json) && Array.isArray(json.data?.productIds)) {
        setWishlistIds(json.data.productIds);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([refreshCart(), refreshSettings(), refreshWishlist()]).finally(() => {
      if (active) setLoading(false);
    });

    const onAuthChange = () => {
      fetch("/api/shop/cart/merge", { method: "POST" })
        .catch(() => null)
        .finally(() => {
          refreshCart();
          refreshWishlist();
        });
    };
    window.addEventListener("auth-change", onAuthChange);
    return () => {
      active = false;
      window.removeEventListener("auth-change", onAuthChange);
    };
  }, [refreshCart, refreshSettings, refreshWishlist]);

  const openDrawer = useCallback(
    (tabOrEvent?: ShopDrawerTab | unknown) => {
      const nextTab: ShopDrawerTab = tabOrEvent === "orders" ? "orders" : "cart";
      setDrawerTab(nextTab);
      refreshCart();
      setDrawerOpen(true);
    },
    [refreshCart],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const addToCart = useCallback(
    async (input: {
      variantId: string;
      quantity?: number;
      customizationId?: string | null;
      giftWrapCode?: string;
      flyFromEl?: HTMLElement | null;
      flyImageUrl?: string | null;
      openDrawerAfter?: boolean;
    }) => {
      try {
        const res = await fetch("/api/shop/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: input.variantId,
            quantity: input.quantity ?? 1,
            customizationId: input.customizationId ?? null,
            giftWrapCode: input.giftWrapCode ?? "NONE",
          }),
        });
        const json = await res.json();
        if (!res.ok || !isShopApiSuccess(json)) {
          return {
            ok: false,
            error: json?.error?.message || "Không thể thêm vào giỏ quà.",
          };
        }

        setCart(json.data);
        runFlyToCartAnimation(input.flyFromEl, input.flyImageUrl);
        triggerBadgePop();
        if (input.openDrawerAfter) {
          window.setTimeout(() => {
            setDrawerTab("cart");
            setDrawerOpen(true);
          }, prefersReducedMotion() ? 0 : 280);
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Lỗi kết nối máy chủ." };
      }
    },
    [triggerBadgePop],
  );

  const updateCartItem = useCallback(
    async (
      itemId: string,
      patch: {
        quantity?: number;
        giftWrapCode?: string;
        unitIndex?: number;
        customizationId?: string | null;
        applyToAllUnits?: boolean;
      },
    ) => {
      try {
        const res = await fetch(`/api/shop/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok || !isShopApiSuccess(json)) {
          return {
            ok: false,
            error: json?.error?.message || "Không cập nhật được giỏ quà.",
          };
        }
        setCart(json.data);
        return { ok: true };
      } catch {
        return { ok: false, error: "Lỗi kết nối máy chủ." };
      }
    },
    [],
  );

  const removeCartItem = useCallback(
    async (itemId: string) => {
      const removed = cart?.items.find((i) => i.id === itemId);
      const res = await fetch(`/api/shop/cart/items/${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (isShopApiSuccess(json)) {
        setCart(json.data);
        if (removed) {
          setUndoToast({
            item: {
              variantId: removed.variantId,
              quantity: removed.quantity,
              customizationId: removed.units[0]?.customizationId ?? null,
              giftWrapCode: removed.giftWrapCode,
              productName: removed.productName,
            },
          });
          if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
          undoTimerRef.current = window.setTimeout(() => setUndoToast(null), 5000);
        }
      }
    },
    [cart?.items],
  );

  const undoRemoveItem = useCallback(async () => {
    if (!undoToast) return;
    const item = undoToast.item;
    setUndoToast(null);
    await addToCart({
      variantId: item.variantId,
      quantity: item.quantity,
      customizationId: item.customizationId,
      giftWrapCode: item.giftWrapCode,
    });
  }, [undoToast, addToCart]);

  const dismissUndoToast = useCallback(() => {
    setUndoToast(null);
  }, []);

  const applyPromoCode = useCallback(async (code: string | null) => {
    try {
      const res = await fetch("/api/shop/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: code }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        return { ok: false, message: json?.error?.message || "Không áp dụng được mã." };
      }
      setCart(json.data);
      return {
        ok: Boolean(json.data.promoValid),
        message: json.data.promoMessage || undefined,
      };
    } catch {
      return { ok: false, message: "Lỗi kết nối máy chủ." };
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: string) => {
    try {
      const res = await fetch("/api/shop/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (isShopApiSuccess(json)) {
        const added = Boolean(json.data?.wishlisted);
        setWishlistIds((prev) =>
          added
            ? Array.from(new Set([...prev, productId]))
            : prev.filter((id) => id !== productId),
        );
        return added;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const value = useMemo<ShopCartContextValue>(
    () => ({
      cart,
      settings,
      wishlistIds,
      loading,
      drawerOpen,
      drawerTab,
      badgePopped,
      undoToast,
      openDrawer,
      setDrawerTab,
      closeDrawer,
      refreshCart,
      refreshSettings,
      addToCart,
      updateCartItem,
      removeCartItem,
      undoRemoveItem,
      dismissUndoToast,
      applyPromoCode,
      toggleWishlist,
    }),
    [
      cart,
      settings,
      wishlistIds,
      loading,
      drawerOpen,
      drawerTab,
      badgePopped,
      undoToast,
      openDrawer,
      closeDrawer,
      refreshCart,
      refreshSettings,
      addToCart,
      updateCartItem,
      removeCartItem,
      undoRemoveItem,
      dismissUndoToast,
      applyPromoCode,
      toggleWishlist,
    ],
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart(): ShopCartContextValue {
  const ctx = useContext(ShopCartContext);
  if (!ctx) {
    throw new Error("useShopCart must be used within ShopCartProvider");
  }
  return ctx;
}

export function useOptionalShopCart(): ShopCartContextValue | null {
  return useContext(ShopCartContext);
}

