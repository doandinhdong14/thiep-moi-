"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  KeyRound,
  Coins,
  Store,
  Share2,
  UserCheck,
  UserX,
  X,
  Save,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  locale: string;
  imageCredits: number;
  audioCredits: number;
  createdAt: string;
  roles: string[];
  stats: {
    invitationsCount: number;
    ordersCount: number;
    shopsCount: number;
  };
}

const AVAILABLE_ROLES = [
  { key: "ADMIN", label: "Quản trị viên (ADMIN)", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "CREATOR", label: "Người tạo thiệp (CREATOR)", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "SHOP_OWNER", label: "Chủ cửa hàng (SHOP_OWNER)", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { key: "SHOP_STAFF", label: "Nhân viên Shop (SHOP_STAFF)", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "AFFILIATE", label: "Cộng tác viên (AFFILIATE)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action modals state
  const [editingRolesUser, setEditingRolesUser] = useState<UserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [adjustingCreditsUser, setAdjustingCreditsUser] = useState<UserItem | null>(null);
  const [targetImageCredits, setTargetImageCredits] = useState<number>(0);
  const [targetAudioCredits, setTargetAudioCredits] = useState<number>(0);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<UserItem | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [generatedPassResult, setGeneratedPassResult] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        role: selectedRole,
        status: selectedStatus,
      });

      const res = await fetch(`/api/v1/admin/users?${query.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/auth/sign-in?callbackUrl=/admin/users");
          return;
        }
        throw new Error("Không thể tải danh sách người dùng.");
      }

      const data = await res.json();
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.total);
    } catch (err: any) {
      showToast(err.message || "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRole, selectedStatus, router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Role Update
  const handleOpenRoleModal = (user: UserItem) => {
    setEditingRolesUser(user);
    setSelectedRoles([...user.roles]);
  };

  const handleSaveRoles = async () => {
    if (!editingRolesUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${editingRolesUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLES",
          roles: selectedRoles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể cập nhật quyền.");

      showToast(`Đã cập nhật quyền cho người dùng ${editingRolesUser.email}!`);
      setEditingRolesUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Status Toggle (ACTIVE <-> SUSPENDED)
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      nextStatus === "SUSPENDED"
        ? `Bạn có chắc muốn KHÓA tài khoản ${user.email}? Người dùng sẽ bị đăng xuất ngay lập tức.`
        : `Bạn có chắc muốn MỞ KHÓA tài khoản ${user.email}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể đổi trạng thái.");

      showToast(`Đã ${nextStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản thành công!`);
      loadUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Credits Adjustment
  const handleOpenCreditsModal = (user: UserItem) => {
    setAdjustingCreditsUser(user);
    setTargetImageCredits(user.imageCredits);
    setTargetAudioCredits(user.audioCredits);
  };

  const handleSaveCredits = async () => {
    if (!adjustingCreditsUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${adjustingCreditsUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_CREDITS",
          imageCredits: Number(targetImageCredits),
          audioCredits: Number(targetAudioCredits),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể cập nhật credits.");

      showToast(`Đã điều chỉnh credits cho ${adjustingCreditsUser.email}!`);
      setAdjustingCreditsUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Password Reset
  const handleOpenResetPassModal = (user: UserItem) => {
    setResettingPasswordUser(user);
    setNewPasswordInput("");
    setGeneratedPassResult(null);
  };

  const handleExecuteResetPass = async () => {
    if (!resettingPasswordUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${resettingPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: newPasswordInput.trim() ? newPasswordInput.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể đặt lại mật khẩu.");

      setGeneratedPassResult(data.data.temporaryPassword);
      showToast("Đặt lại mật khẩu thành công!");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SHOP_OWNER":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "SHOP_STAFF":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "AFFILIATE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-2.5 animate-slide-up ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              Quản lý Người dùng & Phân quyền (RBAC)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {totalCount} tài khoản
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gán quyền Quản trị (Admin), Chủ Shop hoa quà, Cộng tác viên (CTV), kiểm soát khóa tài khoản và số dư credits.
          </p>
        </div>

        <button
          onClick={() => loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="CREATOR">Người dùng tạo thiệp (CREATOR)</option>
              <option value="SHOP_OWNER">Chủ cửa hàng (SHOP_OWNER)</option>
              <option value="SHOP_STAFF">Nhân viên cửa hàng</option>
              <option value="AFFILIATE">Cộng tác viên (AFFILIATE)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="SUSPENDED">Đã khóa (SUSPENDED)</option>
              <option value="DEACTIVATED">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Vai trò / Quyền hạn</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Credits (Ảnh / Âm thanh)</th>
                <th className="py-3.5 px-4">Thống kê</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                    <span>Đang tải danh sách tài khoản...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài khoản nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === "SUSPENDED";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getRoleBadge(
                                r
                              )}`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Bị khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-[11px]">
                          <span title="Ảnh AI">{u.imageCredits} 🖼️</span>
                          <span className="text-slate-300">/</span>
                          <span title="Âm thanh AI">{u.audioCredits} 🎵</span>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <span>{u.stats.invitationsCount} thiệp</span> •{" "}
                        <span>{u.stats.ordersCount} đơn</span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Role edit */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Phân quyền (RBAC)"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {/* Credits adjust */}
                          <button
                            onClick={() => handleOpenCreditsModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Cấp / Điều chỉnh credits"
                          >
                            <Coins className="w-4 h-4" />
                          </button>

                          {/* Reset password */}
                          <button
                            onClick={() => handleOpenResetPassModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={isSuspended ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {page} / {totalPages} (Tổng số {totalCount} người dùng)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Trang tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal: Edit Roles */}
      {editingRolesUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  Phân quyền tài khoản
                </h3>
              </div>
              <button
                onClick={() => setEditingRolesUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <p className="font-semibold text-slate-800">{editingRolesUser.name}</p>
              <p className="text-slate-500 font-mono mt-0.5">{editingRolesUser.email}</p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">Chọn các vai trò kích hoạt:</p>
              {AVAILABLE_ROLES.map((r) => {
                const checked = selectedRoles.includes(r.key);
                return (
                  <label
                    key={r.key}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked ? "bg-purple-50/60 border-purple-300" : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium text-slate-800">{r.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, r.key]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((k) => k !== r.key));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRolesUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-xl shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Lưu quyền hạn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Adjust Credits */}
      {adjustingCreditsUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  Cấp & Điều chỉnh Credits
                </h3>
              </div>
              <button
                onClick={() => setAdjustingCreditsUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <p className="font-semibold text-slate-800">{adjustingCreditsUser.name}</p>
              <p className="text-slate-500 font-mono mt-0.5">{adjustingCreditsUser.email}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lượng Image Credits (Tạo ảnh thiệp AI):
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetImageCredits}
                  onChange={(e) => setTargetImageCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lượng Audio Credits (Tạo nhạc nền AI):
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetAudioCredits}
                  onChange={(e) => setTargetAudioCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingCreditsUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCredits}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-xl shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Cập nhật số dư</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Reset Password */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  Đặt lại mật khẩu
                </h3>
              </div>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <p className="font-semibold text-slate-800">{resettingPasswordUser.name}</p>
              <p className="text-slate-500 font-mono mt-0.5">{resettingPasswordUser.email}</p>
            </div>

            {generatedPassResult ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mật khẩu mới đã được cập nhật:</span>
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono font-bold text-sm text-slate-900 select-all">
                  {generatedPassResult}
                </div>
                <p className="text-[11px] text-emerald-700">
                  Hãy gửi mật khẩu này cho người dùng và nhắc họ đổi lại trong trang hồ sơ cá nhân.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhập mật khẩu mới (hoặc để trống để tạo ngẫu nhiên):
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống để hệ thống tự tạo mật khẩu mạnh"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lưu ý: Mọi phiên đăng nhập hiện tại của người dùng này sẽ bị hủy bỏ ngay lập tức để bảo mật.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResettingPasswordUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {generatedPassResult ? "Đóng" : "Hủy"}
              </button>
              {!generatedPassResult && (
                <button
                  type="button"
                  onClick={handleExecuteResetPass}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Xác nhận đặt lại</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

