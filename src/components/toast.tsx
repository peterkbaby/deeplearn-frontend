"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { X } from "lucide-react";
type Toast = {
  id: number;
  message: string;
  tone: "error" | "success" | "info";
};
const ToastContext = createContext<{
  showToast: (message: string, tone?: Toast["tone"]) => void;
} | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback(
    (message: string, tone: Toast["tone"] = "error") =>
      setToasts((current) =>
        [...current, { id: Date.now() + Math.random(), message, tone }].slice(
          -3,
        ),
      ),
    [],
  );
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() =>
              setToasts((current) =>
                current.filter((item) => item.id !== toast.id),
              )
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`global-toast ${toast.tone}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
