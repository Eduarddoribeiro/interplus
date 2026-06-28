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
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/40 bg-red-500/15 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] font-bold text-red-200 tracking-[.08em] uppercase">
            Clube de Benefícios Oficial
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={item}
          className="text-6xl md:text-8xl font-black text-white leading-[1.0] tracking-[-0.04em] mb-4"
        >
          Família<br />
          <span className="text-red-400">Inter</span> Viamão
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={item}
          className="text-lg md:text-xl text-white/55 font-normal mb-5 tracking-[.01em]"
        >
          Benefícios exclusivos para quem faz parte da nossa história
        </motion.p>

        {/* Description */}
        <motion.p
          variants={item}
          className="text-sm text-white/38 max-w-md mx-auto leading-relaxed mb-12"
        >
          Ser aluno da Escola Oficial do Inter vai muito além dos treinos. Sua família tem acesso a vantagens reais em empresas parceiras de Viamão.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-wrap gap-3 justify-center">
          <a
            href="#parceiros"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-inter-red text-white font-bold text-sm rounded-xl hover:bg-inter-red-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(200,16,46,.4)]"
          >
            ⚡ Conhecer parceiros
            <ArrowRight size={15} />
          </a>
          <a
            href="#seja-parceiro"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/8 text-white font-semibold text-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
          >
            <Handshake size={15} />
            Quero ser parceiro
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
