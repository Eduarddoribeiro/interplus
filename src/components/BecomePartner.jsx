import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const perks = [
  'Divulgação nas redes sociais',
  'Exposição para centenas de famílias',
  'Fortalecimento da sua marca',
]

export default function BecomePartner() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="seja-parceiro" className="py-24 px-6 md:px-12 bg-inter-red" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[1.05] mb-4">
          Sua empresa pode fazer parte da Família Inter
        </h2>
        <p className="text-white/65 text-base leading-relaxed mb-10">
          Conecte sua marca a centenas de famílias engajadas da Escola Oficial do Inter em Viamão.
        </p>

        {/* Perks */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {perks.map((p) => (
            <div
              key={p}
              className="flex items-center gap-2 px-4 py-2 bg-white/12 border border-white/20 rounded-full text-sm font-semibold text-white/90"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              {p}
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/5551999990000?text=${encodeURIComponent('Olá! Quero ser parceiro do Clube de Benefícios Inter Viamão.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-inter-red font-extrabold text-base rounded-2xl hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,.22)] transition-all duration-300"
        >
          Quero ser parceiro
          <ArrowRight size={18} />
        </a>
      </motion.div>
    </section>
  )
}
