import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import PartnerCard from './PartnerCard'

const partners = [
  {
    id: 1,
    nome: "Em breve",
    categoria: "Todos",
    desconto: "Novos benefícios em breve",
    imagem: "/placeholder.png",
    instagram: "",
    site: ""
  }
];

const ALL = 'Todos'

export default function Partners() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const categories = [ALL, ...new Set(partners.map((p) => p.categoria))]
  const [active, setActive] = useState(ALL)

  const filtered = active === ALL ? partners : partners.filter((p) => p.categoria === active)

  return (
    <section id="parceiros" className="py-24 bg-neutral-50 px-6 md:px-12">
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-[11px] font-bold text-inter-red tracking-[.12em] uppercase mb-3">
            Parceiros selecionados
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Empresas que acreditam na sua família
          </h2>
        </motion.div>

        {/* Filter bar */}
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
              <PartnerCard key={p.id} partner={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-neutral-400 text-sm">
            Nenhum parceiro nesta categoria ainda.
          </div>
        )}
      </div>
    </section>
  )
}
