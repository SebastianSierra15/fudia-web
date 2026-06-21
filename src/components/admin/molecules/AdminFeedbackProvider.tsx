"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, LoaderCircle, X } from "lucide-react";

type ToastTone = "success" | "error" | "warning" | "info";
type ToastState = { id: number; message: string; tone: ToastTone } | null;

type AdminFeedbackContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
  showLoading: (message: string) => void;
  hideLoading: () => void;
};

const AdminFeedbackContext = createContext<AdminFeedbackContextValue | null>(
  null,
);

const toastIcon = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: CircleAlert,
  info: Info,
};
const toastClass = {
  success:
    "border-emerald-400/35 bg-[#10291f] text-emerald-100 shadow-emerald-950/30",
  error: "border-red-400/35 bg-[#2a1218] text-red-100 shadow-red-950/30",
  warning:
    "border-amber-400/35 bg-[#2b2111] text-amber-100 shadow-amber-950/30",
  info: "border-blue-400/35 bg-[#111f35] text-blue-100 shadow-blue-950/30",
};

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);
  const showLoading = useCallback(
    (message: string) => setLoadingMessage(message),
    [],
  );
  const hideLoading = useCallback(() => setLoadingMessage(null), []);
  const ToastIcon = toast ? toastIcon[toast.tone] : null;

  return (
    <AdminFeedbackContext.Provider
      value={{ showToast, showLoading, hideLoading }}
    >
      {children}
      {toast && ToastIcon ? (
        <div
          className={`fixed top-4 right-4 z-[90] flex w-[min(420px,calc(100vw-2rem))] items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${toastClass[toast.tone]}`}
          role="status"
        >
          <ToastIcon size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1 text-sm font-medium leading-5">
            {toast.message}
          </p>
          <button
            type="button"
            title="Cerrar notificacion"
            onClick={() => setToast(null)}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-black/10"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
      {loadingMessage ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          role="status"
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <LoaderCircle
              size={58}
              strokeWidth={2.2}
              className="animate-spin text-(--color-accent)"
            />
            <p className="max-w-[280px] text-base font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
              {loadingMessage}
            </p>
          </div>
        </div>
      ) : null}
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const context = useContext(AdminFeedbackContext);
  if (!context)
    throw new Error(
      "useAdminFeedback must be used inside AdminFeedbackProvider",
    );
  return context;
}
