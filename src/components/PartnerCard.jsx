import { motion } from 'framer-motion'
import {
  Instagram,
  Globe,
  MessageCircle,
  MapPin
} from 'lucide-react'

export default function PartnerCard({ partner, index }) {
  const {
    nome,
    categoria,
    imagem,
    desconto,
    instagram,
    site,
    whatsapp,
    endereco
  } = partner

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .45, delay: index * .08 }}
      className="
        group
        overflow-hidden
        rounded-3xl
        bg-white
        border
        border-neutral-200
        hover:border-inter-red/30
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
      "
    >
      {/* FOTO */}
      <div className="relative h-36 overflow-hidden">

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
            top-3
            right-3
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

      <div className="p-5">

        <span
          className="
            text-[11px]
            uppercase
            tracking-[.16em]
            text-inter-red
            font-bold
          "
        >
          {categoria}
        </span>

        <h3
          className="
            font-display
            text-3xl
            uppercase
            leading-none
            tracking-wide
            text-neutral-900
            mt-2
          "
        >
          {nome}
        </h3>

        {endereco && (
          <div className="flex items-center gap-2 mt-4 mb-5">

            <MapPin
              size={15}
              className="text-inter-red shrink-0"
            />

            <span
              className="
                text-sm
                text-neutral-500
                truncate
              "
            >
              {endereco}
            </span>

          </div>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="
              flex
              items-center
              justify-center
              gap-2
              w-full
              rounded-xl
              bg-[#22C55E]
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-[#16A34A]
              transition-all
            "
          >
            <MessageCircle size={17} />
            Entrar em contato
          </a>
        )}

        {(instagram || site) && (
          <div className="flex justify-center gap-6 mt-4">

            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
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
                rel="noreferrer"
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
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
        )}

      </div>

    </motion.article>
  )
}