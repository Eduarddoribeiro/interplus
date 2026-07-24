import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck } from "lucide-react";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function RegistrationHero() {
  function scrollToForm() {
    document
      .getElementById("registration-form")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg,#170507 0%,#2a0810 40%,#8b0a1c 100%)",
      }}
    >
      {/* Background */}

      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{
          backgroundImage:
            "url('/images/training.jpg')",
          filter: "blur(2px)",
        }}
      />

      {/* Overlay */}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,rgba(200,16,46,.30)_0%,rgba(10,5,7,.78)_70%)]" />

      {/* Glow */}

      <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[180px]" />

      {/* Conteúdo */}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-24 text-center"
      >
        <motion.div
          variants={item}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-md"
        >
          <CalendarCheck
            size={18}
            className="text-red-400"
          />

          <span className="text-sm font-medium uppercase tracking-[0.15em] text-white/80">
            Escola Oficial do Inter Viamão
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display uppercase leading-[0.9] text-white"
        >
          <span className="block text-3xl tracking-[0.12em] text-white/70 md:text-5xl">
            Agende sua
          </span>

          <span className="block text-7xl leading-[0.85] text-red-400 md:text-[8rem]">
            Aula
          </span>

          <span className="block text-5xl tracking-[0.04em] md:text-6xl">
            Experimental
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-8 max-w-3xl text-xl font-semibold text-white/90 md:text-2xl"
        >
          Conheça nossa metodologia oficial, participe de um treino e descubra
          como desenvolvemos atletas dentro e fora de campo.
        </motion.p>

        <motion.p
          variants={item}
          className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/60"
        >
          O agendamento leva menos de dois minutos e nossa equipe entrará em
          contato para confirmar o melhor horário disponível.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-3 rounded-xl bg-inter-red px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(200,16,46,.45)]"
          >
            Agendar Agora

            <ArrowRight size={18} />
          </button>

          
        </motion.div>

        <motion.div
          variants={item}
          className="mt-20 grid gap-5 md:grid-cols-3"
        >
          <InfoCard
            title="Metodologia Oficial"
            text="Treinamentos seguindo o padrão das Escolas Oficiais do Inter."
          />

          <InfoCard
            title="Professores Qualificados"
            text="Equipe preparada para acompanhar o desenvolvimento de cada atleta."
          />

          <InfoCard
            title="Categorias por Idade"
            text="Cada atleta participa do treino adequado à sua faixa etária."
          />
        </motion.div>
      </motion.div>

      {/* Scroll */}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-white/25">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
            Scroll
          </span>

          <motion.div
            className="h-10 w-px bg-gradient-to-b from-white/30 to-transparent"
            animate={{
              opacity: [0, 1, 0],
              y: [0, 6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-red-500/40 hover:bg-white/10">
      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-white/60">
        {text}
      </p>
    </div>
  );
}