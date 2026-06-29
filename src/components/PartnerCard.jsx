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
    descricao,
    instagram,
    site,
    whatsapp,
    endereco
  } = partner

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="
        flex
        flex-col
        h-full
        group
        overflow-hidden
        rounded-3xl
        bg-white
        border
        border-neutral-200
        hover:border-inter-red/30
        hover:shadow-xl
        hover:-translate-y-2
        transition-all
        duration-300
      "
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-neutral-100">
        <img
          src={imagem}
          alt={nome}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div
          className="
            absolute
            top-4
            right-4
            rounded-xl
            bg-inter-red
            px-3
            py-1.5
            text-[11px]
            font-bold
            uppercase
            tracking-wide
            text-white
            shadow-lg
          "
        >
          {desconto}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <span
          className="
            inline-flex
            w-fit
            rounded-full
            bg-inter-red/10
            px-3
            py-1
            mb-3
            text-[10px]
            font-bold
            uppercase
            tracking-[.18em]
            text-inter-red
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
            mb-2
          "
        >
          {nome}
        </h3>

        <p
          className="
            text-sm
            leading-6
            text-neutral-500
            mb-3
          "
        >
          {descricao}
        </p>

        {endereco && (
          <div className="flex items-start gap-2 mb-4">
            <MapPin
              size={15}
              className="text-inter-red mt-1 shrink-0"
            />
            <span className="text-sm text-neutral-600">
              {endereco}
            </span>
          </div>
        )}

        <div className="mt-auto w-full">
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
                transition-all
                hover:bg-[#16A34A]
              "
            >
              <MessageCircle size={17} />
              Entrar em contato
            </a>
          )}

          {(instagram || site) && (
            <div className="flex justify-center gap-5 mt-3">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex
                    items-center
                    gap-1
                    text-sm
                    text-neutral-500
                    hover:text-inter-red
                    transition-colors
                  "
                >
                  <Instagram size={15} />
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
                    text-sm
                    text-neutral-500
                    hover:text-inter-red
                    transition-colors
                  "
                >
                  <Globe size={15} />
                  Site
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}