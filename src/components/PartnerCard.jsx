import { motion } from 'framer-motion'
import { Instagram, Globe, MessageCircle, MapPin } from 'lucide-react'

export default function PartnerCard({ partner, index }) {
  const { nome, categoria, logo, imagem, desconto, descricao, instagram, site, whatsapp, endereco } = partner

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group relative bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
    >
      {/* Red accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-inter-red scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300 z-10" />

      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-neutral-100">
        <img
          src={imagem}
          alt={nome}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Discount badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-inter-red text-white text-[11px] font-black rounded-full tracking-wide shadow-lg">
          {desconto}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
            {logo}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 truncate">{nome}</h3>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">{categoria}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 leading-relaxed mb-1">{descricao}</p>

        {/* Address */}
        {endereco && (
          <div className="flex items-center gap-1 mb-4">
            <MapPin size={11} className="text-neutral-300 shrink-0" />
            <span className="text-[11px] text-neutral-400 truncate">{endereco}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-200 text-[11px] font-semibold text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-all"
          >
            <Instagram size={12} /> Instagram
          </a>
          <a
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-200 text-[11px] font-semibold text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-all"
          >
            <Globe size={12} /> Site
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#25D366]/40 text-[11px] font-semibold text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
          >
            <MessageCircle size={12} /> WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  )
}
