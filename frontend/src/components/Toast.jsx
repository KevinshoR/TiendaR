import { createContext, useCallback, useContext, useState } from 'react'

/*
 * Toasts globales: const toast = useToast(); toast.success('...') / toast.error('...')
 */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const value = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg bg-white ${
              t.type === 'success' ? 'border-esmeralda/40 text-tinta' : 'border-red-300 text-red-600'
            }`}
            style={{ animation: 'toastIn .3s ease both' }}
          >
            <span className={t.type === 'success' ? 'text-esmeralda' : 'text-red-500'}>
              {t.type === 'success' ? '✓' : '✕'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform:none; } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
