"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number; // ms
}

interface ToastContextValue {
  show: (message: string, options?: { type?: ToastType; duration?: number }) => void;
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number }) => void;
  info: (message: string, options?: { duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, options?: { type?: ToastType; duration?: number }) => {
    const id = idRef.current++;
    const toast: Toast = {
      id,
      message,
      type: options?.type ?? "info",
      duration: options?.duration ?? 3500,
    };
    setToasts((prev) => [...prev, toast]);
    // auto dismiss
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
  }, [remove]);

  const api = useMemo<ToastContextValue>(() => ({
    show,
    success: (m, o) => show(m, { ...o, type: "success" }),
    error: (m, o) => show(m, { ...o, type: "error" }),
    info: (m, o) => show(m, { ...o, type: "info" }),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast viewport */}
      <div className="fixed z-[1000] top-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={[
            "min-w-[260px] max-w-[360px] px-4 py-3 rounded-md shadow-md border text-sm",
            t.type === "success" && "bg-green-50 border-green-200 text-green-800",
            t.type === "error" && "bg-red-50 border-red-200 text-red-800",
            t.type === "info" && "bg-gray-50 border-gray-200 text-gray-800",
          ].filter(Boolean).join(" ")}> 
            <div className="flex items-start gap-3">
              <span className="mt-0.5">
                {t.type === "success" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.829a1 1 0 011.414-1.414l3.222 3.222 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                ) : t.type === "error" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-8a1 1 0 00-1 1v5a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10A8 8 0 11.002 10 8 8 0 0118 10zM9 9h2v5H9V9zm0-4h2v2H9V5z"/></svg>
                )}
              </span>
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
