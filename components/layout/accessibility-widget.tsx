"use client";

/**
 * [KOMPONEN / AKSESIBILITAS] Widget Fitur Aksesibilitas Publik
 * Panel kontrol pembesar teks, kontras tinggi, font disleksia, reduce motion, dan text-to-speech.
 */

import { useState, useEffect, useRef } from "react";
import {
  Accessibility,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SunMoon,
  Type,
  Volume2,
  VolumeX,
  X,
  Eye,
  Activity,
  Check,
} from "lucide-react";

interface A11ySettings {
  textSize: "normal" | "large" | "xlarge";
  highContrast: boolean;
  dyslexicFont: boolean;
  reduceMotion: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  textSize: "normal",
  highContrast: false,
  dyslexicFont: false,
  reduceMotion: false,
};

const STORAGE_KEY = "banjaragung_a11y_settings";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasSpeechSupport(typeof window !== "undefined" && "speechSynthesis" in window);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<A11ySettings>;
        const merged: A11ySettings = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        applySettings(merged);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const applySettings = (cfg: A11ySettings) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.classList.remove("a11y-text-lg", "a11y-text-xl");
    if (cfg.textSize === "large") root.classList.add("a11y-text-lg");
    if (cfg.textSize === "xlarge") root.classList.add("a11y-text-xl");

    if (cfg.highContrast) {
      root.classList.add("a11y-high-contrast");
    } else {
      root.classList.remove("a11y-high-contrast");
    }

    if (cfg.dyslexicFont) {
      root.classList.add("a11y-dyslexic");
    } else {
      root.classList.remove("a11y-dyslexic");
    }

    if (cfg.reduceMotion) {
      root.classList.add("a11y-reduce-motion");
    } else {
      root.classList.remove("a11y-reduce-motion");
    }
  };

  const updateSettings = (patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applySettings(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
    stopSpeaking();
  };

  const toggleSpeech = () => {
    if (!hasSpeechSupport) return;
    const synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const mainEl = document.getElementById("main-content") || document.body;
    const textToRead = mainEl.innerText.slice(0, 3000);

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const activeCount =
    (settings.textSize !== "normal" ? 1 : 0) +
    (settings.highContrast ? 1 : 0) +
    (settings.dyslexicFont ? 1 : 0) +
    (settings.reduceMotion ? 1 : 0);

  return (
    <>
      <div className="fixed bottom-24 left-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="accessibility-panel"
          aria-label="Buka Menu Fitur Aksesibilitas Warga"
          title="Fitur Aksesibilitas (Ukuran teks, kontras, pembaca suara)"
          className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-[#1b365d] text-white shadow-lg shadow-[#1b365d]/30 hover:bg-[#152a48] hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-3 focus:ring-amber-400"
        >
          <Accessibility className="w-6 h-6" aria-hidden="true" />
          {activeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 shadow-xs"
              aria-label={`${activeCount} fitur aksesibilitas aktif`}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          id="accessibility-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-dialog-title"
          className="fixed bottom-38 left-6 z-50 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="px-5 py-4 bg-gradient-to-r from-[#1b365d] to-[#254677] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Accessibility className="w-5 h-5 text-amber-300" aria-hidden="true" />
              </div>
              <div>
                <h3 id="a11y-dialog-title" className="text-sm font-bold">Aksesibilitas Warga</h3>
                <p className="text-[11px] text-white/70">Sesuaikan tampilan & audio portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup panel aksesibilitas"
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Ukuran Teks</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {settings.textSize === "normal" ? "Standar" : settings.textSize === "large" ? "Besar (+12%)" : "Sangat Besar (+25%)"}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl" role="group" aria-label="Pilihan ukuran teks">
                <button
                  type="button"
                  onClick={() => updateSettings({ textSize: "normal" })}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    settings.textSize === "normal"
                      ? "bg-white text-[#1b365d] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={settings.textSize === "normal"}
                >
                  <Type className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>A</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ textSize: "large" })}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    settings.textSize === "large"
                      ? "bg-white text-[#1b365d] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={settings.textSize === "large"}
                >
                  <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>A+</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ textSize: "xlarge" })}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    settings.textSize === "xlarge"
                      ? "bg-white text-[#1b365d] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={settings.textSize === "xlarge"}
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                  <span>A++</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-800 block">Keterbacaan & Tampilan</span>

              <button
                type="button"
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  settings.highContrast
                    ? "bg-amber-50 border-amber-300 text-amber-950 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                aria-pressed={settings.highContrast}
              >
                <div className="flex items-center gap-2.5">
                  <SunMoon className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Kontras Tinggi</p>
                    <p className="text-[10px] text-slate-500">Membantu penglihatan low-vision</p>
                  </div>
                </div>
                {settings.highContrast && <Check className="w-4 h-4 text-amber-600" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ dyslexicFont: !settings.dyslexicFont })}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  settings.dyslexicFont
                    ? "bg-amber-50 border-amber-300 text-amber-950 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                aria-pressed={settings.dyslexicFont}
              >
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Font Ramah Disleksia</p>
                    <p className="text-[10px] text-slate-500">Spasi kata lebih renggang & mudah dieja</p>
                  </div>
                </div>
                {settings.dyslexicFont && <Check className="w-4 h-4 text-amber-600" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  settings.reduceMotion
                    ? "bg-amber-50 border-amber-300 text-amber-950 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                aria-pressed={settings.reduceMotion}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Hentikan Animasi</p>
                    <p className="text-[10px] text-slate-500">Meredam gerakan visual yang mengganggu</p>
                  </div>
                </div>
                {settings.reduceMotion && <Check className="w-4 h-4 text-amber-600" aria-hidden="true" />}
              </button>
            </div>

            {hasSpeechSupport && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block mb-2">Bantuan Suara (Screen Reader)</span>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSpeaking
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                  aria-pressed={isSpeaking}
                >
                  <div className="flex items-center gap-2.5">
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-xs">{isSpeaking ? "Hentikan Suara" : "Bacakan Halaman Ini"}</p>
                      <p className="text-[10px] text-slate-500">Audio berbahasa Indonesia</p>
                    </div>
                  </div>
                  {isSpeaking && <span className="text-[10px] font-bold text-emerald-700">Membaca...</span>}
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Atur Ulang ke Standar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-1 px-3 rounded-lg bg-[#1b365d] text-white font-bold text-[11px] hover:bg-[#152a48] transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
