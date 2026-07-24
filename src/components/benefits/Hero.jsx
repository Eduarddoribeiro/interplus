import { motion } from 'framer-motion'
import { ArrowRight, Handshake } from 'lucide-react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a0508 0%,#2d0812 40%,#8b0a1c 100%)' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.13]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1800&q=60')",
          filter: 'blur(2px)',
        }}
      />

      {/* Radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(200,16,46,.28)_0%,rgba(10,5,7,.72)_70%)]" />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center px-6 pt-28 pb-20 max-w-4xl mx-auto"
      >
       

{/* Título */}
<motion.h1
  variants={item}
  className="font-display uppercase leading-[0.9] text-white mb-8"
>
  <span className="block text-3xl md:text-5xl tracking-[0.12em] text-white/80">
    Bem-vindo ao
  </span>

  <span className="block text-7xl md:text-[8rem] text-red-400 leading-[0.85]">
    Clube de Benefícios
  </span>

  <span className="block text-5xl md:text-6xl tracking-[0.05em]">
    Família Inter
  </span>
</motion.h1>

<motion.p
  variants={item}
  className="text-xl md:text-2xl text-white/90 font-semibold max-w-3xl mx-auto mb-4"
>
  Benefícios exclusivos para alunos e suas famílias.
</motion.p>

<motion.p
  variants={item}
  className="text-base text-white/60 max-w-lg mx-auto mb-12"
>
Basta apresentar sua carteirinha para aproveitar seus benefícios.</motion.p>

{/* Botões */}
<motion.div
  variants={item}
  className="flex flex-wrap justify-center gap-4"
>
  <a
    href="#parceiros"
    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-inter-red text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(200,16,46,.45)]"
  >
    Ver parceiros
    <ArrowRight size={18} />
  </a>

  <a
    href="#como-funciona"
    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 bg-white/5 text-white font-medium hover:bg-white/10 transition-all duration-300"
  >
    <Handshake size={18} />
    Como usar
  </a>
</motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25">
        <span className="text-[10px] tracking-[.14em] uppercase font-medium">Scroll</span>
        <motion.div
          className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
          animate={{ opacity: [0, 1, 0], y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </section>
  )
}
