import { motion } from 'framer-motion'
import {
  Instagram,
  Globe,
  MapPin,
  Dumbbell,
  Utensils,
  Glasses,
  HeartPulse,
  PawPrint,
  GraduationCap,
  Gem
} from 'lucide-react'

import { FaWhatsapp } from 'react-icons/fa'

const categoryIcons = {
  Academia: Dumbbell,
  Restaurante: Utensils,
  Ótica: Glasses,
  Saúde: HeartPulse,
  'Pet Shop': PawPrint,
  Educação: GraduationCap,
  'Joias e Acessórios': Gem
}

export default function PartnerCard({ partner, index }) {
  const {
    nome,
    categoria,
    imagem,
    desconto,
    instagram,
    site,
    whatsapp,
    maps
  } = partner

  const CategoryIcon = categoryIcons[categoria]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .45, delay: index * .08 }}
      className="
        group
        h-full
        flex
        flex-col
        overflow-hidden
        rounded-[28px]
        bg-white
        border
        border-neutral-200
        hover:border-inter-red/30
        hover:shadow-2xl
        hover:-translate-y-1
        transition-all
        duration-300
      "
    >
      {/* Imagem */}

      <div className="relative h-48 overflow-hidden">
        <img
          src={imagem}
          alt={nome}
          loading="lazy"
          className="
            w-full
            h-full
            object-cover
            transition-transform
            duration-700
            group-hover:scale-105
          "
        />

        <div
          className="
            absolute
            top-4
            right-4
            rounded-full
            bg-inter-red
            px-3
            py-1
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-white
            shadow-md
          "
        >
          {desconto}
        </div>
      </div>

      {/* Conteúdo */}

      <div className="flex flex-col flex-1 p-6">

        {/* Categoria */}

        <div
          className="
            inline-flex
            items-center
            gap-2
            w-fit
            rounded-full
            bg-inter-red/10
            border
            border-inter-red/10
            px-3
            py-1.5
            text-[11px]
            font-semibold
            text-inter-red
          "
        >
          {CategoryIcon && <CategoryIcon size={14} />}

          <span>{categoria}</span>
        </div>

        {/* Nome */}

        <h3
          className="
            font-display
            text-3xl
            uppercase
            leading-none
            tracking-wide
            text-neutral-900
            mt-4
          "
        >
          {nome}
        </h3>

        {/* Espaço */}

        <div className="flex-1" />

        {/* Botão */}

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              items-center
              justify-center
              gap-2
              w-full
              mt-8
              rounded-xl
              bg-inter-red
              py-4
              text-sm
              font-semibold
              text-white
              hover:bg-[#a80e24]
              transition-all
              duration-300
              shadow-sm
              hover:shadow-lg
            "
          >
            <FaWhatsapp className="text-[18px]" />

            WhatsApp
          </a>
        )}

        {/* Links */}

        <div
          className="
            mt-5
            pt-5
            border-t
            border-neutral-100
            flex
            justify-center
            items-center
            gap-5
            flex-wrap
          "
        >
          {maps && (
            <a
              href={maps}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex
                items-center
                gap-1.5
                text-[13px]
                text-neutral-500
                hover:text-inter-red
                transition-colors
              "
            >
              <MapPin size={14} />
              Localização
            </a>
          )}

          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex
                items-center
                gap-1.5
                text-[13px]
                text-neutral-500
                hover:text-inter-red
                transition-colors
              "
            >
              <Instagram size={14} />
              Instagram
            </a>
          )}

          {site && (
            <a
              href={site}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex
                items-center
                gap-1.5
                text-[13px]
                text-neutral-500
                hover:text-inter-red
                transition-colors
              "
            >
              <Globe size={14} />
              Site
            </a>
          )}
        </div>

      </div>
    </motion.article>
  )
}