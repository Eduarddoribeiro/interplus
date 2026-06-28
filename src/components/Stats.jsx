import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Store, BadgePercent, Handshake, HeartHandshake } from 'lucide-react'

const iconMap = { Store, BadgePercent, Handshake, HeartHandshake }

const stats = [
  {
    id: 1,
    icon: "Store",
    title: "Empresas Parceiras",
    description: "Negócios locais que oferecem benefícios exclusivos aos nossos alunos."
  },
  {
    id: 2,
    icon: "BadgePercent",
    title: "Descontos Exclusivos",
    description: "Vantagens negociadas especialmente para quem faz parte da Família Inter."
  },
  {
    id: 3,
    icon: "Handshake",
    title: "Uso Simples",
    description: "Apresente sua carteirinha de aluno no estabelecimento parceiro e aproveite seu benefício."
  },
  {
    id: 4,
    icon: "HeartHandshake",
    title: "Família Inter",
    description: "Mais vantagens para quem faz parte da Escola Oficial do Inter Viamão."
  }
]

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="stats" className="py-24 bg-neutral-50 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
         <p className="text-[11px] font-bold text-inter-red tracking-[.12em] uppercase mb-3">
  Clube de Benefícios
</p>

<h2 className="font-display text-5xl uppercase text-neutral-900 leading-none">
  Vantagens de fazer parte da Família Inter
</h2>

<p className="text-neutral-500 mt-5 max-w-2xl">
  Muito além dos treinos. Nossa comunidade tem acesso a benefícios exclusivos em empresas parceiras de Viamão.
</p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 rounded-2xl overflow-hidden">
          {stats.map((s, i) => {
            const Icon = iconMap[s.icon]
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white px-8 py-10 flex flex-col items-center text-center hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-inter-red/10 flex items-center justify-center mb-6 group-hover:bg-inter-red transition-all duration-300">
  {Icon && (
    <Icon
      size={26}
      className="text-inter-red group-hover:text-white transition-colors duration-300"
    />
  )}
</div>
                <h3 className="font-display text-2xl md:text-3xl uppercase text-neutral-900 leading-none">
  {s.title}
</h3>

<p className="text-sm text-neutral-500 leading-relaxed mt-3">
  {s.description}
</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
