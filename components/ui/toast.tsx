"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  confirm: () => Promise.resolve(false),
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
};

const BG: Record<ToastVariant, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const idRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    confirm: (opts) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ opts, resolve });
      }),
  };

  const handleConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <>
            {/* Toast stack */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-5 fade-in duration-200 ${BG[t.variant]}`}
                >
                  {ICONS[t.variant]}
                  <p className="text-sm font-medium leading-relaxed flex-1">{t.message}</p>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 opacity-50" />
                  </button>
                </div>
              ))}
            </div>

            {/* Confirm dialog */}
            {confirmState && (
              <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-150">
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          confirmState.opts.variant === "danger"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {confirmState.opts.variant === "danger" ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <Info className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">
                          {confirmState.opts.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {confirmState.opts.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 px-6 pb-5">
                    <button
                      onClick={() => handleConfirm(false)}
                      className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {confirmState.opts.cancelLabel || "Batal"}
                    </button>
                    <button
                      onClick={() => handleConfirm(true)}
                      className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-colors ${
                        confirmState.opts.variant === "danger"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-[#1b365d] hover:bg-[#152a48]"
                      }`}
                    >
                      {confirmState.opts.confirmLabel || "Ya, Lanjutkan"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
