"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Bell, 
  Globe, 
  CalendarDays,
  ShieldCheck,
  History,
  ShieldAlert,
  ArrowLeft
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
        alert("Anda tidak memiliki hak akses administrator ke halaman ini.");
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
          <div className="w-8 h-8 border-4 border-[#1b365d] border-t-transparent rounded-full animate-spin" />
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
    icon: any;
    exact?: boolean;
  }

  const allBaseNavItems: NavItem[] = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { key: "berita", href: "/dashboard/berita", label: "Berita & Artikel", icon: FileText },
    { key: "agenda", href: "/dashboard/agenda", label: "Agenda Kegiatan", icon: CalendarDays },
    { key: "layanan", href: "/dashboard/layanan", label: "Permohonan Surat", icon: FileText },
    { key: "penduduk", href: "/dashboard/penduduk", label: "Data Penduduk", icon: Users },
    { key: "pengaduan", href: "/dashboard/pengaduan", label: "Pengaduan Masuk", icon: MessageSquare },
    { key: "settings", href: "/dashboard/settings", label: "Profil & Konten Web", icon: Globe },
  ];

  const baseNavItems = allBaseNavItems.filter((item) => canAccess(item.key));

  const systemNavItems: NavItem[] = isSuperAdmin
    ? [
        { key: "admins", href: "/dashboard/admins", label: "Kelola Admin", icon: ShieldCheck },
        { key: "audit", href: "/dashboard/audit", label: "Log Aktivitas (Audit)", icon: History },
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

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1b365d] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-kota-serang.png"
              alt="Lambang Kota Serang"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div>
              <div className="text-white text-xs font-bold leading-tight">Banjar Agung</div>
              <div className="text-blue-200 text-[10px] leading-tight">Admin CMS</div>
            </div>
          </div>
          <button
            className="md:hidden text-white/60 hover:text-white p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="space-y-0.5">
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
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-150 group ${
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={17}
                        className={isActive ? "text-white" : "text-blue-200/60 group-hover:text-white"}
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/50" />}
                  </div>
                </Link>
              );
            })}
          </div>

          {systemNavItems.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/10 space-y-0.5">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
                Sistem & Audit
              </div>
              {systemNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <div
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-150 group ${
                        isActive
                          ? "bg-white/15 text-white font-medium"
                          : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          size={17}
                          className={isActive ? "text-white" : "text-blue-200/60 group-hover:text-white"}
                        />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-white/50" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm font-medium"
          >
            <LogOut size={17} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              {[...baseNavItems, ...systemNavItems].find(n =>
                n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/")
              )?.label || "Dashboard"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 pl-2 ml-1">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-xs font-semibold text-slate-800">{adminProfile?.displayName || user.displayName || "Admin"}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    role === "superadmin" 
                      ? "bg-purple-100 text-purple-700 border border-purple-200" 
                      : role === "operator"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-[#1b365d] border border-blue-200"
                  }`}>
                    {role === "superadmin" ? "Super Admin" : role === "operator" ? "Operator" : "Admin Seksi"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {adminProfile?.department ? `${adminProfile.department} • ` : ""}{user.email}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#1b365d] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border border-slate-200">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isCurrentRouteForbidden ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-sm font-medium transition-colors"
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
