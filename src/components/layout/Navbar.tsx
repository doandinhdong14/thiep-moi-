"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Home,
  LayoutGrid,
  Sparkles,
  PackageCheck,
  Handshake,
  PhoneCall,
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
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import VoucherModal from "@/components/landing/VoucherModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export default function Navbar() {
  const pathname = usePathname();
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
    { label: "Đơn hàng của tôi", href: "/dashboard", icon: PackageCheck, active: pathname.startsWith("/dashboard") },
    { label: "Đối tác", href: "/partners", icon: Handshake, active: pathname.startsWith("/partners") || pathname.startsWith("/affiliate") },
    { label: "Liên hệ", href: "/#contact", icon: PhoneCall, active: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] h-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* 1. Left Zone: Brand Logo */}
            <BrandLogo size="md" theme="light" />

            {/* 2. Middle Zone: Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full text-[14px] font-medium text-slate-700">
              {navLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 h-full hover:text-[#fa416a] transition-colors ${item.active ? "text-[#fa416a] font-semibold" : "text-slate-600"
                      }`}
                  >
                    <IconComponent className="w-4 h-4 stroke-[1.8]" />
                    <span>{item.label}</span>
                    {item.active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#fa416a] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* 3. Right Zone: Actions */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {/* Voucher Button */}
              <button
                onClick={() => setVoucherModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fff0f3] hover:bg-rose-100 border border-rose-200 text-[#fa416a] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Nhận mã voucher giảm giá"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Nhận voucher</span>
              </button>

              {/* Authentication Actions */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/create"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold rounded-md shadow-sm shadow-rose-200 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tạo thiệp mới</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:text-[#fa416a] text-xs font-medium rounded-md hover:bg-rose-50 transition-colors"
                    title="Bảng điều khiển thiệp mời"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#fa416a]" />
                    <span className="max-w-[90px] truncate">{user.name}</span>
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

            {/* Mobile menu trigger */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setVoucherModalOpen(true)}
                className="p-2 text-[#fa416a] hover:bg-rose-50 rounded-lg sm:hidden"
                aria-label="Nhận voucher"
              >
                <Gift className="w-5 h-5" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-[#fa416a] rounded-lg focus:outline-none"
                aria-label="Mở danh mục điều hướng"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-rose-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
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
        )}
      </header>

      {/* Voucher Modal */}
      <VoucherModal isOpen={voucherModalOpen} onClose={() => setVoucherModalOpen(false)} />
    </>
  );
}
