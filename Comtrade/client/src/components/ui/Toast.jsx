import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

let toastId = 0;
let addToastGlobal = null;

export function toast(message, type = 'success') {
  if (addToastGlobal) addToastGlobal({ id: ++toastId, message, type });
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  const colors = {
    success: 'border-green-500/30 text-green-400',
    error: 'border-red-500/30 text-red-400',
    info: 'border-white/20 text-white',
  };

  return (
    <>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto animate-slide-down glass rounded-xl px-4 py-3 flex items-center gap-3 border ${colors[t.type] || colors.info}`}
            >
              {icons[t.type] || icons.info}
              <span className="text-sm flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
