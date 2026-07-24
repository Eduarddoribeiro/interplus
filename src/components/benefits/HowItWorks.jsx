import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BadgeCheck,
  Store,
  BadgePercent
} from 'lucide-react'

import SectionHeader from '../common/SectionHeader'

const steps = [
  {
    num: '01',
    icon: BadgeCheck,
    title: 'Apresente sua carteirinha',
    desc:
      'Ao visitar uma empresa parceira, basta apresentar sua carteirinha de aluno da Escola Oficial do Inter Viamão.'
  },
  {
    num: '02',
    icon: Store,
    title: 'Escolha um parceiro',
    desc:
      'Confira os estabelecimentos participantes do Clube de Benefícios e aproveite as vantagens disponíveis.'
  },
  {
    num: '03',
    icon: BadgePercent,
    title: 'Receba seu benefício',
    desc:
      'O desconto é aplicado na hora, de forma simples, rápida e exclusiva para alunos ativos da Família Inter.'
  }
]

export default function HowItWorks() {
  const ref = useRef(null)

  const inView = useInView(ref, {
    once: true,
    margin: '-80px'
  })

  return (
    <section
      id="como-funciona"
      className="py-24 bg-white"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <SectionHeader
          eyebrow="Como Funciona"
          title={
            <>
              Aproveitar seus benefícios
              <br />
              é muito simples
            </>
          }
          description="Em poucos passos, você utiliza sua carteirinha de aluno e garante descontos exclusivos nas empresas parceiras da Escola Oficial do Inter Viamão."
        />

        <div className="relative mt-16">

          <div className="hidden lg:block absolute top-10 left-[17%] right-[17%] h-px bg-neutral-200" />

          <div className="grid lg:grid-cols-3 gap-8">

            {steps.map((step, index) => {

              const Icon = step.icon

              return (

                <motion.article
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: .5,
                    delay: index * .12
                  }}
                  className="
                    group
                    relative
                    h-full
                    rounded-3xl
                    border
                    border-neutral-200
                    bg-white
                    p-8
                    transition-all
                    duration-300
                    hover:-translate-y-2
                    hover:border-inter-red/30
                    hover:shadow-xl
                  "
                >

                  <div className="flex items-center justify-between mb-8">

                    <div
                      className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-inter-red
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <Icon
                        size={26}
                        className="text-white"
                      />
                    </div>

                    <span
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[.18em]
                        text-neutral-300
                      "
                    >
                      PASSO {step.num}
                    </span>

                  </div>

                  <h3
                    className="
                      font-display
                      text-3xl
                      uppercase
                      leading-none
                      text-neutral-900
                      mb-5
                    "
                  >
                    {step.title}
                  </h3>

                  <p
                    className="
                      text-neutral-500
                      leading-7
                    "
                  >
                    {step.desc}
                  </p>

                  <div
                    className="
                      absolute
                      left-0
                      top-0
                      bottom-0
                      w-1
                      rounded-l-3xl
                      bg-inter-red
                      scale-y-0
                      origin-top
                      transition-transform
                      duration-300
                      group-hover:scale-y-100
                    "
                  />

                </motion.article>

              )

            })}

          </div>

        </div>

      </div>
    </section>
  )
}