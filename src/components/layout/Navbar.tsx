"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Home,
  LayoutGrid,
  Sparkles,
  Handshake,
  Gift,
  LogIn,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  PlusCircle,
  Store,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import VoucherModal from "@/components/landing/VoucherModal";
import { useOptionalShopCart } from "@/components/shop/ShopCartContext";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export default function Navbar() {
  const pathname = usePathname();
  const shopCart = useOptionalShopCart();
  const cartCount = shopCart?.cart?.itemCount || 0;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(() => {
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
    const handleAuthChange = () => fetchUser();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, [pathname, fetchUser]);

  // Close mobile menu on route change and lock background scroll while open
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  // Handle ESC key for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setVoucherModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/sign-out", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { label: "Trang chủ", href: "/", icon: Home, active: pathname === "/" },
    { label: "Sản phẩm", href: "/products", icon: LayoutGrid, active: pathname === "/products" },
    { label: "Bộ sưu tập", href: "/collections", icon: Sparkles, active: pathname.startsWith("/collections") || pathname.startsWith("/templates") },
    { label: "Cửa hàng quà", href: "/qua-tang", icon: ShoppingBag, active: pathname.startsWith("/qua-tang") },
    { label: "Đối tác", href: "/partners", icon: Handshake, active: pathname.startsWith("/partners") || pathname.startsWith("/affiliate") },
  ];

  return (
    <>
      <header className="sticky top-0 z-[55] bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] h-16">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between gap-2 h-full">
            {/* 1. Left Zone: Brand Logo */}
            <div className="min-w-0 shrink flex items-center">
              <BrandLogo size="md" theme="light" />
            </div>

            {/* 2. Middle Zone: Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 min-w-0 h-full text-[13px] 2xl:text-[14px] font-medium text-slate-700">
              {navLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-2 2xl:px-3 py-2 h-full whitespace-nowrap hover:text-[#fa416a] transition-colors ${item.active ? "text-[#fa416a] font-semibold" : "text-slate-600"
                      }`}
                  >
                    <IconComponent className="hidden 2xl:inline w-4 h-4 stroke-[1.8]" />
                    <span>{item.label}</span>
                    {item.active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#fa416a] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* 3. Right Zone: Desktop/Tablet Actions */}
            <div className="hidden md:flex items-center gap-2 2xl:gap-2.5 shrink-0">
              {shopCart && (
                <button
                  id="ddg-nav-cart-btn"
                  type="button"
                  onClick={() => shopCart.openDrawer("cart")}
                  aria-label={`Mở giỏ quà (${cartCount} sản phẩm) và đơn hàng của tôi`}
                  title="Giỏ quà & Đơn hàng của tôi"
                  className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FFF9F5] hover:bg-[#FDECF0] border border-[#F2DCE2] text-[#3E2A2D] transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-[18px] h-[18px] text-[#FF5C8D]" />
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white ${
                      cartCount > 0 ? "bg-[#FF5C8D] text-white" : "bg-[#F3DCE3] text-[#7C6368]"
                    } ${shopCart.badgePopped ? "ddg-badge-pop" : ""}`}
                  >
                    {cartCount}
                  </span>
                </button>
              )}

              {/* Voucher Button */}
              <button
                onClick={() => setVoucherModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-full bg-[#fff0f3] hover:bg-rose-100 border border-rose-200 text-[#fa416a] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Nhận mã voucher giảm giá"
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden 2xl:inline">Nhận voucher</span>
              </button>

              {/* Authentication Actions */}
              {user ? (
                <div className="flex items-center gap-1 2xl:gap-1.5">
                  <Link
                    href="/create"
                    className="flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold rounded-md shadow-sm shadow-rose-200 transition-all whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tạo thiệp</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1 px-2 py-1.5 text-slate-700 hover:text-[#fa416a] text-xs font-medium rounded-md hover:bg-rose-50 transition-colors"
                    title="Bảng điều khiển thiệp mời"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#fa416a]" />
                    <span className="hidden 2xl:inline max-w-[90px] truncate">{user.name}</span>
                  </Link>

                  <Link
                    href="/dashboard/account"
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Hồ sơ & Tài khoản"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Link>

                  {user.roles.includes("ADMIN") && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
                      title="Trung tâm Quản trị Nền tảng"
                    >
                      <Shield className="w-3 h-3 text-amber-700" />
                      <span>Admin</span>
                    </Link>
                  )}

                  {(user.roles.includes("SHOP_OWNER") || user.roles.includes("SHOP_STAFF")) && (
                    <Link
                      href="/shop/dashboard"
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded-md hover:bg-rose-200 transition-colors"
                      title="Kênh Quản lý Cửa Hàng Shop"
                    >
                      <Store className="w-3 h-3 text-rose-700" />
                      <span>Shop</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    data-testid="logout-btn"
                    className="p-1.5 text-slate-400 hover:text-[#fa416a] rounded-md hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold rounded-[6px] shadow-sm shadow-rose-200 transition-all h-[34px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile & Tablet menu trigger */}
            <div className="flex xl:hidden items-center gap-1 sm:gap-1.5 shrink-0">
              {shopCart && (
                <button
                  id="ddg-mobile-cart-btn"
                  type="button"
                  onClick={() => shopCart.openDrawer("cart")}
                  className="relative inline-flex items-center justify-center w-9 h-9 text-[#3E2A2D] hover:bg-rose-50 rounded-full md:hidden"
                  aria-label={`Mở giỏ quà (${cartCount} sản phẩm) và đơn hàng của tôi`}
                  title="Giỏ quà & Đơn hàng của tôi"
                >
                  <ShoppingBag className="w-[19px] h-[19px] text-[#FF5C8D]" />
                  <span
                    className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white ${
                      cartCount > 0 ? "bg-[#FF5C8D] text-white" : "bg-[#F3DCE3] text-[#7C6368]"
                    } ${shopCart.badgePopped ? "ddg-badge-pop" : ""}`}
                  >
                    {cartCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => setVoucherModalOpen(true)}
                className="w-9 h-9 inline-flex items-center justify-center text-[#fa416a] hover:bg-rose-50 rounded-full md:hidden"
                aria-label="Nhận voucher"
              >
                <Gift className="w-5 h-5" />
              </button>

              <button
                id="ddg-mobile-menu-btn"
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="w-10 h-10 inline-flex items-center justify-center text-slate-700 hover:text-[#fa416a] hover:bg-rose-50 rounded-xl focus:outline-none transition-colors cursor-pointer"
                aria-label="Mở danh mục điều hướng"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Fixed Overlay Drawer (outside h-16 header so it scrolls freely on all phones) */}
      {mobileMenuOpen && (
        <div
          id="ddg-mobile-drawer"
          className="xl:hidden fixed inset-x-0 top-16 bottom-0 z-[55]"
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục điều hướng"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-x-0 top-16 bottom-0 bg-slate-900/35 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Scrollable Sheet */}
          <div className="relative z-10 border-b border-rose-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-2xl max-h-[calc(100dvh-4rem)] overflow-y-auto">
            {navLinks.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                    ? "bg-rose-50 text-[#fa416a] font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#fa416a]"
                    }`}
                >
                  <IconComp className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {shopCart && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      shopCart.openDrawer("cart");
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FFF9F5] text-[#3E2A2D] text-xs font-semibold rounded-lg border border-[#F2DCE2]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FF5C8D]" />
                    <span>Giỏ quà ({cartCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      shopCart.openDrawer("orders");
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-[#D94575] text-xs font-semibold rounded-lg border border-[#F2DCE2]"
                  >
                    <span>Đơn hàng của tôi</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setVoucherModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#fff0f3] text-[#fa416a] text-sm font-semibold rounded-lg border border-rose-200"
              >
                <Gift className="w-4 h-4" />
                <span>Nhận voucher ưu đãi</span>
              </button>

              {user ? (
                <div className="space-y-1.5 pt-1">
                  <div className="px-3 py-2 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Đã đăng nhập với</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                  >
                    Quản lý thiệp mời (Dashboard)
                  </Link>
                  <Link
                    href="/dashboard/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                  >
                    Hồ sơ & Tài khoản cá nhân
                  </Link>
                  {user.roles.includes("ADMIN") && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg"
                    >
                      🛡️ Trung tâm Quản trị Admin
                    </Link>
                  )}
                  {(user.roles.includes("SHOP_OWNER") || user.roles.includes("SHOP_STAFF")) && (
                    <Link
                      href="/shop/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg"
                    >
                      🏪 Kênh Cửa Hàng Shop
                    </Link>
                  )}
                  {user.roles.includes("AFFILIATE") && (
                    <Link
                      href="/affiliate"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                    >
                      🤝 Cổng Cộng Tác Viên
                    </Link>
                  )}
                  <Link
                    href="/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white font-medium text-sm rounded-lg"
                  >
                    Tạo thiệp mới
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center px-3 py-2 text-xs text-slate-500 hover:text-[#fa416a]"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      <VoucherModal isOpen={voucherModalOpen} onClose={() => setVoucherModalOpen(false)} />
    </>
  );
}
