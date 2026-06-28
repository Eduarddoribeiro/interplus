import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Store, Gift, Users, Star } from 'lucide-react'

const iconMap = { Store, Gift, Users, Star }

const stats = [
  {
    id: 1,
    icon: "Store",
    value: "20+",
    label: "Empresas parceiras"
  },
  {
    id: 2,
    icon: "Gift",
    value: "30%",
    label: "Descontos exclusivos"
  },
  {
    id: 3,
    icon: "Users",
    value: "300+",
    label: "Famílias beneficiadas"
  },
  {
    id: 4,
    icon: "Star",
    value: "100%",
    label: "Benefício gratuito"
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
            Números que importam
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Benefícios reais para famílias reais
          </h2>
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
                <div className="w-11 h-11 rounded-xl bg-inter-red/8 flex items-center justify-center mb-5 group-hover:bg-inter-red/15 transition-colors">
                  {Icon && <Icon size={20} className="text-inter-red" />}
                </div>
                <div className="text-4xl md:text-5xl font-black text-neutral-900 tracking-[-0.04em] leading-none">
                  {s.value}
                </div>
                <div className="text-xs font-medium text-neutral-400 mt-2.5">{s.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
