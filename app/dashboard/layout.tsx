"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Globe,
  CalendarDays,
  ShieldCheck,
  History,
  ShieldAlert,
  ArrowLeft,
  Inbox,
  Newspaper,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut, role, adminProfile, isSuperAdmin, canAccess } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "superadmin" && role !== "admin" && role !== "operator") {
        router.push("/");
      }
    }
  }, [user, loading, role, router]);

  const handleLogout = async () => {
    try {
      await writeAuditLog("LOGOUT", "auth", "User logout dari dashboard");
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat sistem kelurahan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  interface NavItem {
    key: string;
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    exact?: boolean;
  }

  const allBaseNavItems: NavItem[] = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { key: "berita", href: "/dashboard/berita", label: "Berita & Artikel", icon: Newspaper },
    { key: "agenda", href: "/dashboard/agenda", label: "Agenda Kegiatan", icon: CalendarDays },
    { key: "layanan", href: "/dashboard/layanan", label: "Permohonan Surat", icon: Inbox },
    { key: "penduduk", href: "/dashboard/penduduk", label: "Data Penduduk", icon: Users },
    { key: "pengaduan", href: "/dashboard/pengaduan", label: "Pengaduan Masuk", icon: MessageSquare },
    { key: "settings", href: "/dashboard/settings", label: "Profil & Konten Web", icon: Globe },
  ];

  const baseNavItems = allBaseNavItems.filter((item) => canAccess(item.key));

  const systemNavItems: NavItem[] = isSuperAdmin
    ? [
        { key: "admins", href: "/dashboard/admins", label: "Kelola Admin", icon: ShieldCheck },
        { key: "audit", href: "/dashboard/audit", label: "Log Aktivitas", icon: History },
      ]
    : [];

  let isCurrentRouteForbidden = false;
  let forbiddenModuleName = "";

  if (pathname.startsWith("/dashboard/admins") && !isSuperAdmin) {
    isCurrentRouteForbidden = true;
    forbiddenModuleName = "Kelola Admin";
  } else if (pathname.startsWith("/dashboard/audit") && !isSuperAdmin) {
    isCurrentRouteForbidden = true;
    forbiddenModuleName = "Log Aktivitas (Audit Sistem)";
  } else {
    const matchedBase = allBaseNavItems.find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (matchedBase && !canAccess(matchedBase.key)) {
      isCurrentRouteForbidden = true;
      forbiddenModuleName = matchedBase.label;
    }
  }

  const initials = (user.displayName || user.email || "A").charAt(0).toUpperCase();

  const currentPageLabel = [...baseNavItems, ...systemNavItems].find(n =>
    n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/")
  )?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[256px] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex`}
        style={{ background: "linear-gradient(180deg, #1e3a63 0%, #1b365d 40%, #152c4a 100%)" }}
      >
        {/* Brand header */}
        <div className="shrink-0 px-5 pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-kota-serang.png"
                alt="Lambang Kota Serang"
                className="h-10 w-auto object-contain shrink-0 drop-shadow-lg"
              />
              <div>
                <div className="text-white text-sm font-bold leading-tight">Banjar Agung</div>
                <div className="text-[10px] font-semibold text-[#c9971c]/70 tracking-widest uppercase mt-0.5">Admin Panel</div>
              </div>
            </div>
            <button
              className="md:hidden text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/[0.08] shrink-0" />

        {/* Navigation — hidden scrollbar */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 pt-4 pb-2">
          {/* Menu label */}
          <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            Menu Utama
          </div>

          <div className="space-y-1">
            {baseNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <div
                    className={`relative flex items-center gap-3 px-3 py-[9px] rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white/70"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#c9971c] rounded-r-full shadow-[0_0_8px_rgba(201,151,28,0.4)]" />
                    )}

                    <div className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isActive
                        ? "bg-[#c9971c] text-white shadow-sm shadow-[#c9971c]/30"
                        : "text-white/35 group-hover:text-white/55"
                    }`}>
                      <item.icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>

                    <span className={`text-[13px] flex-1 leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* System section */}
          {systemNavItems.length > 0 && (
            <>
              <div className="mx-3 my-3 h-px bg-white/[0.06]" />
              <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                Sistem
              </div>
              <div className="space-y-1">
                {systemNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <div
                        className={`relative flex items-center gap-3 px-3 py-[9px] rounded-xl transition-all duration-200 group ${
                          isActive
                            ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                            : "text-white/45 hover:bg-white/[0.05] hover:text-white/70"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#c9971c] rounded-r-full shadow-[0_0_8px_rgba(201,151,28,0.4)]" />
                        )}

                        <div className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isActive
                            ? "bg-[#c9971c] text-white shadow-sm shadow-[#c9971c]/30"
                            : "text-white/35 group-hover:text-white/55"
                        }`}>
                          <item.icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                        </div>

                        <span className={`text-[13px] flex-1 leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 pb-5 pt-2">
          {/* User card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a732] via-[#c9971c] to-[#9a7415] flex items-center justify-center text-white font-bold text-[15px] shadow-lg shadow-black/20 ring-2 ring-white/10">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[2.5px] border-[#1b365d] shadow-sm shadow-emerald-400/40" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate leading-tight">
                    {adminProfile?.displayName || user.displayName || "Admin"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-[3px] rounded-md leading-none ${
                      role === "superadmin"
                        ? "bg-purple-400/20 text-purple-200"
                        : role === "operator"
                        ? "bg-amber-400/20 text-amber-200"
                        : "bg-sky-400/20 text-sky-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        role === "superadmin" ? "bg-purple-400" : role === "operator" ? "bg-amber-400" : "bg-sky-400"
                      }`} />
                      {role === "superadmin" ? "Super Admin" : role === "operator" ? "Operator" : "Admin"}
                    </span>
                  </div>
                </div>
              </div>
              {adminProfile?.department && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] text-white/30 truncate">{adminProfile.department}</p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="group w-full flex items-center justify-center gap-2 px-3 py-3 bg-white/[0.03] hover:bg-red-500/15 border-t border-white/[0.06] transition-all duration-200"
            >
              <LogOut size={14} className="text-white/30 group-hover:text-red-400 transition-colors" />
              <span className="text-[12px] font-semibold text-white/30 group-hover:text-red-400 transition-colors">Keluar Sesi</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb-style page title */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <LayoutDashboard size={12} />
                <span>Admin</span>
                <ChevronRight size={10} className="text-slate-300" />
              </div>
              <span className="text-[13px] font-bold text-slate-800">{currentPageLabel}</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Quick actions */}
            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-[#1b365d] hover:bg-slate-100 px-3 py-2 rounded-xl transition-all"
            >
              <Globe size={14} />
              <span>Lihat Website</span>
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-slate-200" />

            {/* User profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-slate-800 leading-tight">
                  {adminProfile?.displayName || user.displayName || "Admin"}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-[2px] rounded-md leading-none ${
                    role === "superadmin"
                      ? "bg-purple-50 text-purple-600"
                      : role === "operator"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-[#1b365d]/[0.06] text-[#1b365d]"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      role === "superadmin" ? "bg-purple-400" : role === "operator" ? "bg-amber-400" : "bg-[#1b365d]"
                    }`} />
                    {role === "superadmin" ? "Super Admin" : role === "operator" ? "Operator" : "Admin"}
                  </span>
                  {adminProfile?.department && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-[9px] text-slate-400">{adminProfile.department}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-[#1b365d]/15 ring-2 ring-slate-100">
                  {initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isCurrentRouteForbidden ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Akses Menu Dibatasi</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Akun Anda tidak memiliki hak akses untuk membuka modul <strong>{forbiddenModuleName}</strong>.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Silakan hubungi <strong>Super Administrator (Lurah / Seklur)</strong> jika Anda memerlukan akses ke fitur ini.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href={baseNavItems[0]?.href || "/dashboard"}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Menu Utama</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
