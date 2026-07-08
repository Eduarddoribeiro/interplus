import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Megaphone,
  Users,
  BadgePercent,
  Store
} from 'lucide-react'

import SectionHeader from './common/SectionHeader'

const benefits = [
  {
    icon: <Megaphone size={18} />,
    title: 'Divulgação institucional',
    description:
      'Sua empresa será divulgada no site e nas redes sociais da Escola Oficial do Inter Viamão.'
  },
  {
    icon: <Users size={18} />,
    title: 'Novos clientes',
    description:
      'Conecte sua marca a centenas de famílias da nossa comunidade.'
  },
  {
    icon: <BadgePercent size={18} />,
    title: 'Benefício exclusivo',
    description:
      'Você define o desconto ou vantagem oferecida aos alunos.'
  }
]

export default function BecomePartner() {
  const ref = useRef(null)

  const inView = useInView(ref, {
    once: true,
    margin: '-80px'
  })

  return (
    <section
      id="seja-parceiro"
      ref={ref}
      className="bg-inter-red py-24"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <motion.div
  initial={{ opacity: 0, y: 25 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: .6 }}
  className="grid lg:grid-cols-[1.05fr_.95fr] gap-20 items-start"
>

          {/* ESQUERDA */}

          <div>
      <SectionHeader
  light
  className="max-w-xl mb-14"
  eyebrow="Seja um parceiro"
  title={
    <>
      Sua empresa pode crescer
      <br />
      junto da Família Inter
    </>
  }
  description="Faça parte do Clube de Benefícios da Escola Oficial do Inter Viamão e aproxime sua marca de uma comunidade formada por alunos, pais e responsáveis."
/>
            <div className="space-y-6">

              {benefits.map((item) => (

                <div
                  key={item.title}
                  className="flex gap-4"
                >

                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-white/10
                      border
                      border-white/20
                      flex
                      items-center
                      justify-center
                      text-white
                      shrink-0
                    "
                  >
                    {item.icon}
                  </div>

                  <div>

                    <h3 className="font-semibold text-white mb-1">
                      {item.title}
                    </h3>

                    <p className="text-white/70 text-sm leading-6">
                      {item.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

            <a
              href="https://forms.gle/SEU_FORMULARIO"
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex
                items-center
                gap-3
                mt-12
                rounded-2xl
                bg-white
                px-8
                py-4
                font-bold
                text-inter-red
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
              "
            >
              Quero ser parceiro

              <ArrowRight size={18} />
            </a>

          </div>

          {/* DIREITA */}

          <motion.div
            initial={{ opacity: 0, scale: .96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: .15 }}
            className="
              bg-white
              rounded-[32px]
              p-10
              shadow-2xl
            "
          >

            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-inter-red/10
                flex
                items-center
                justify-center
                text-inter-red
                mb-8
              "
            >
              <Store size={30} />
            </div>

            <h3 className="font-display text-3xl uppercase leading-none text-neutral-900 mb-8">
              O que sua empresa recebe?
            </h3>

            <div className="space-y-6">

              {[
                'Divulgação permanente',
                'Publicação nas redes sociais',
                'Alcance de famílias locais',
                'Participação gratuita'
              ].map((item) => (

                <div
                  key={item}
                  className="flex justify-between items-center border-b border-neutral-100 pb-4"
                >
                  <span className="text-neutral-500">
                    {item}
                  </span>

                  <span className="font-bold text-inter-red">
                    ✓
                  </span>

                </div>

              ))}

            </div>

            <div
              className="
                mt-10
                rounded-2xl
                bg-neutral-50
                p-6
              "
            >
              <p className="text-sm leading-7 text-neutral-600">
                Basta oferecer um benefício exclusivo aos alunos da Escola
                Oficial do Inter Viamão. Nossa equipe analisará a proposta
                e entrará em contato para formalizar a parceria.
              </p>
            </div>

          </motion.div>

        </motion.div>

      </div>
    </section>
  )
}