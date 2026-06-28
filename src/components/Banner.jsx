import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Instagram, MessageCircle } from 'lucide-react'

export default function Banner() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div className="bg-neutral-950 py-14 px-6 md:px-12" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div>
          <p className="text-[11px] font-bold text-white/30 tracking-[.14em] uppercase mb-2">
            Sempre crescendo
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Novos parceiros toda semana
          </h3>
          <p className="text-sm text-white/38 mt-2">
            Acompanhe nossas redes e fique por dentro dos novos benefícios.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <Instagram size={15} /> Instagram
          </a>
          <a
            href="https://wa.me/5551999990000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-inter-red text-white text-sm font-semibold rounded-xl hover:bg-inter-red-dark transition-colors"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  )
}
