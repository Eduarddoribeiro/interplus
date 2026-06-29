import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import PartnerCard from './PartnerCard'

const partners = [
  {
    id: 1,
    nome: "Academia Evolution",
    categoria: "Academia",
    desconto: "15% OFF",
    imagem: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    descricao:
      "Treinamento, musculação e acompanhamento personalizado para toda a família.",
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
    descricao:
      "Pizzas artesanais, massas e um ambiente ideal para reunir a família.",
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
    descricao:
      "Óculos de grau, solares e lentes com atendimento especializado.",
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
    descricao:
      "Consultas, exames e atendimento humanizado para toda a família.",
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
    descricao:
      "Banho, tosa, acessórios e produtos para o bem-estar do seu pet.",
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
    descricao:
      "Livros, materiais escolares e artigos de papelaria para todas as idades.",
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
    <section id="parceiros" className="py-24 bg-neutral-50 px-6 md:px-12">
      <div className="max-w-6xl mx-auto" ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-[11px] font-bold text-inter-red tracking-[.12em] uppercase mb-3">
            Empresas Parceiras
          </p>

          <h2 className="font-display text-5xl md:text-6xl uppercase leading-[0.9] tracking-wide text-neutral-900">
            Onde você poderá
            <br />
            aproveitar seus benefícios
          </h2>

          <p className="mt-5 text-neutral-500 text-base leading-8 max-w-2xl">
            Estamos formando nossa rede de empresas parceiras.
            Em breve você encontrará descontos e vantagens exclusivas para
            alunos e famílias da Escola Oficial do Inter Viamão.
          </p>
        </motion.div>

        {/* Filtros apenas quando existirem categorias reais */}
        {partners.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all ${
                  active === cat
                    ? 'bg-inter-red text-white border-inter-red'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((p, i) => (
              <PartnerCard
                key={p.id}
                partner={p}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}