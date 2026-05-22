import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/* Fenêtre modale accessible — overlay flouté, fermeture via Échap / clic hors cadre. */
export default function Modal({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-canvas/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92dvh] w-full origin-bottom overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-2xl shadow-black/60 sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
