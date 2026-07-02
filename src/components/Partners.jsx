import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'


import PartnerCard from './PartnerCard'

const partners = [
  {
    id: 1,
    nome: "Academia Evolution",
    categoria: "Academia",
    desconto: "15% OFF",
    imagem: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    descricao: "Treinamento, musculação e acompanhamento personalizado para toda a família.",
    instagram: "https://instagram.com/",
    site: "",
    whatsapp: "5551999991111",
    endereco: "Av. Liberdade, 820 - Viamão"
  },
  {
    id: 2,
    nome: "Bella Pizza",
    categoria: "Restaurante",
    desconto: "10% OFF",
    imagem: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    descricao: "Pizzas artesanais, massas e um ambiente ideal para reunir a família.",
    instagram: "https://instagram.com/",
    site: "",
    whatsapp: "5551999992222",
    endereco: "Rua Júlio de Castilhos, 315 - Viamão"
  },
  {
    id: 3,
    nome: "Ótica Visão",
    categoria: "Ótica",
    desconto: "20% OFF",
    imagem: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
    descricao: "Óculos de grau, solares e lentes com atendimento especializado.",
    instagram: "https://instagram.com/",
    site: "https://example.com",
    whatsapp: "5551999993333",
    endereco: "Centro de Viamão"
  },
  {
    id: 4,
    nome: "Clínica Vida",
    categoria: "Saúde",
    desconto: "12% OFF",
    imagem: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    descricao: "Consultas, exames e atendimento humanizado para toda a família.",
    instagram: "https://instagram.com/",
    site: "",
    whatsapp: "5551999994444",
    endereco: "Av. Senador Salgado Filho, 1200"
  },
  {
    id: 5,
    nome: "Pet Center Amigo",
    categoria: "Pet Shop",
    desconto: "18% OFF",
    imagem: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80",
    descricao: "Banho, tosa, acessórios e produtos para o bem-estar do seu pet.",
    instagram: "https://instagram.com/",
    site: "",
    whatsapp: "5551999995555",
    endereco: "Rua Bento Gonçalves, 450"
  },
  {
    id: 6,
    nome: "Livraria Horizonte",
    categoria: "Educação",
    desconto: "10% OFF",
    imagem: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    descricao: "Livros, materiais escolares e artigos de papelaria para todas as idades.",
    instagram: "https://instagram.com/",
    site: "",
    whatsapp: "5551999996666",
    endereco: "Praça Júlio de Castilhos, 88"
  }
]

const ALL = 'Todos'

export default function Partners() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const categories = [ALL, ...new Set(partners.map((p) => p.categoria))]
  const [active, setActive] = useState(ALL)

  const filtered =
    active === ALL
      ? partners
      : partners.filter((p) => p.categoria === active)

  return (
    <section
      id="parceiros"
      className="py-24 bg-neutral-50"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12" ref={ref}>

        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .5 }}
          className="mb-12"
        >
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-inter-red mb-3">
            Empresas Parceiras
          </p>

          <h2 className="font-display text-5xl md:text-6xl uppercase leading-[.9]">
            Onde você poderá
            <br />
            aproveitar seus benefícios
          </h2>

          <p className="mt-5 max-w-2xl text-neutral-500 leading-8">
            Estamos formando nossa rede de empresas parceiras.
            Em breve você encontrará descontos e vantagens exclusivas para
            alunos e famílias da Escola Oficial do Inter Viamão.
          </p>
        </motion.div>

        {/* Filtros */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: .15 }}
          className="flex flex-wrap gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full border transition-all ${
                active === cat
                  ? 'bg-inter-red border-inter-red text-white'
                  : 'bg-white border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Carrossel */}

        <motion.div
  key={active}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: .25 }}
>
  <Swiper 
    modules={[Navigation]}
    navigation
    grabCursor
    watchOverflow
    centerInsufficientSlides
    spaceBetween={20}
    className="partners-swiper"
    breakpoints={{
      0: {
        slidesPerView: 1.15
      },
      480: {
        slidesPerView: 1.35
      },
      640: {
        slidesPerView: 1.8
      },
      768: {
        slidesPerView: 2.2
      },
      1024: {
        slidesPerView: 3
      },
      1280: {
        slidesPerView: 4
      }
    }}
  >
    {filtered.map((partner, index) => (
      <SwiperSlide key={partner.id}>
        <PartnerCard
          partner={partner}
          index={index}
        />
      </SwiperSlide>
    ))}
  </Swiper>
</motion.div>
      </div>
    </section>
  )
}