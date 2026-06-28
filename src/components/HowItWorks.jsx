import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CreditCard, MapPin, Sparkles } from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: CreditCard,
    title: 'Apresente a carteirinha',
    desc:  'Mostre sua carteirinha física ou digital — disponível no app da escola — no estabelecimento parceiro.',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Escolha um parceiro',
    desc:  'Navegue pela lista de parceiros, filtre por categoria e encontre o benefício perfeito para o seu momento.',
  },
  {
    num: '03',
    icon: Sparkles,
    title: 'Aproveite o desconto',
    desc:  'O desconto é aplicado na hora. Simples, rápido e exclusivo para quem faz parte da Família Inter.',
  },
]

export default function HowItWorks() {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="como-funciona" className="py-24 bg-white px-6 md:px-12">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] font-bold text-inter-red tracking-[.12em] uppercase mb-3">
            É simples assim
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Como usar seus benefícios
          </h2>
          <p className="mt-3 text-neutral-500 text-base leading-relaxed max-w-md">
            Em três passos rápidos, você e sua família aproveitam todos os descontos dos nossos parceiros.
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-9 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent pointer-events-none" />

          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="group relative p-8 rounded-2xl border border-neutral-200 bg-white hover:border-inter-red/40 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                {/* Step badge */}
                <div className="w-10 h-10 rounded-xl bg-inter-red flex items-center justify-center mb-6">
                  <Icon size={18} className="text-white" />
                </div>

                <div className="text-[10px] font-bold text-neutral-300 tracking-widest mb-2">
                  PASSO {s.num}
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{s.desc}</p>

                {/* Hover accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-inter-red rounded-l-2xl scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
