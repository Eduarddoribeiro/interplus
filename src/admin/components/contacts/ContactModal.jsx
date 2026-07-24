import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ContactModal({
  open,
  onClose,
  title = 'Novo Contato',
  children,
}) {
  useEffect(() => {
    function handleEsc(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">

          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-neutral-100"
          >
            <X size={20} />
          </button>

        </div>

        {/* Conteúdo */}

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {children}
        </div>

      </div>
    </div>
  )
}