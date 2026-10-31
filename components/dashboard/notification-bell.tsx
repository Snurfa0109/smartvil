"use client";

/**
 * [KOMPONEN / ADMIN] Lonceng Notifikasi & Menu Popover Dashboard
 * Menampilkan badge counter realtime, tab kategori notifikasi, dan navigasi cepat ke berkas.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  MessageSquareWarning,
  CheckCheck,
  Volume2,
  VolumeX,
  Clock,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { usePolling } from "@/hooks/use-polling";

export interface AdminNotification {
  id: string;
  category: "surat" | "pengaduan";
  title: string;
  subtitle: string;
  timestamp: string;
  status: string;
  ticketCode?: string;
  link: string;
  isPending: boolean;
}

interface NotificationSummary {
  pendingRequests: number;
  pendingComplaints: number;
  totalPending: number;
}

const STORAGE_KEY_READ = "smartvil_read_notifications";
const STORAGE_KEY_SOUND = "smartvil_notif_sound_enabled";

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Baru saja";
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Baru saja";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Kemarin";
    if (days < 7) return `${days} hr lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "Baru saja";
  }
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"semua" | "surat" | "pengaduan">("semua");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({
    pendingRequests: 0,
    pendingComplaints: 0,
    totalPending: 0,
  });
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        }
      }
      const soundStored = localStorage.getItem(STORAGE_KEY_SOUND);
      if (soundStored !== null) {
        setSoundEnabled(soundStored === "true");
      }
    } catch {
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);

        if (data.summary) {
          setSummary(data.summary);
          const currentPending = Number(data.summary.totalPending || 0);
          if (
            prevCountRef.current !== null &&
            currentPending > prevCountRef.current &&
            soundEnabled
          ) {
            playNotificationChime();
          }
          prevCountRef.current = currentPending;
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  usePolling(fetchNotifications, 20_000);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(Array.from(next).slice(-200)));
      } catch {
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(Array.from(next).slice(-200)));
      } catch {
      }
      return next;
    });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(next));
    } catch {
    }
    if (next) {
      playNotificationChime();
    }
  };

  const handleItemClick = (item: AdminNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    router.push(item.link);
  };

  const unreadCount = notifications.filter(
    (n) => !readIds.has(n.id) && (n.isPending || activeTab !== "semua")
  ).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === "semua") return true;
    return n.category === activeTab;
  });

  const getCategoryIcon = (category: AdminNotification["category"]) => {
    switch (category) {
      case "surat":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "pengaduan":
        return <MessageSquareWarning className="w-4 h-4 text-amber-600" />;
      default:
        return <Inbox className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBg = (category: AdminNotification["category"]) => {
    switch (category) {
      case "surat":
        return "bg-blue-50 border-blue-200";
      case "pengaduan":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Lihat notifikasi masuk"
        className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
          isOpen
            ? "bg-[#1b365d]/10 border-[#1b365d]/30 text-[#1b365d]"
            : "border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#1b365d] to-[#254677] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold leading-tight">Pemberitahuan</h4>
                <p className="text-[10px] text-white/70">
                  {summary.totalPending > 0
                    ? `${summary.totalPending} aktivitas butuh tindakan`
                    : "Semua aktivitas terkendali"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? "Nonaktifkan suara notifikasi" : "Aktifkan suara notifikasi"}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-white/50" />}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Tandai semua sudah dibaca"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white/90 hover:text-white transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Dibaca</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1">
            {[
              { id: "semua", label: "Semua", count: notifications.length },
              { id: "surat", label: "Surat Masuk", count: summary.pendingRequests },
              { id: "pengaduan", label: "Pengaduan", count: summary.pendingComplaints },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-[#1b365d] shadow-2xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      activeTab === tab.id
                        ? "bg-[#1b365d]/10 text-[#1b365d]"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Tidak ada notifikasi</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Semua berkas permohonan dan aduan sudah diperbarui.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left ${
                      isRead ? "bg-white hover:bg-slate-50/80" : "bg-blue-50/30 hover:bg-blue-50/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getCategoryBg(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-bold leading-snug truncate ${
                            isRead ? "text-slate-800" : "text-slate-900"
                          }`}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.isPending && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Menunggu
                            </span>
                          )}
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight truncate">
                        {item.subtitle}
                      </p>

                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                        <span className="text-[#1b365d] hover:underline font-semibold flex items-center gap-0.5">
                          Buka berkas <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/layanan"
              onClick={() => setIsOpen(false)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 hover:text-[#1b365d] text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Loket Layanan</span>
            </Link>
            <Link
              href="/dashboard/pengaduan"
              onClick={() => setIsOpen(false)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 hover:text-amber-700 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
              <span>Pengaduan</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
