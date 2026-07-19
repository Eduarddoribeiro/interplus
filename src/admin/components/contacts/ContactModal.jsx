export default function ContactModal({
  open,
  onClose,
  children
}) {

  if (!open) return null

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-3xl rounded-2xl bg-white p-8">

        {children}

      </div>

    </div>

  )

}