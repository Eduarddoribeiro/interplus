import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Store,
  BadgePercent,
  Handshake,
  HeartHandshake
} from 'lucide-react'

import SectionHeader from '../common/SectionHeader'

const iconMap = {
  Store,
  BadgePercent,
  Handshake,
  HeartHandshake
}

const stats = [
  {
    id: 1,
    icon: 'Store',
    title: 'Empresas Parceiras',
    description:
      'Negócios locais que oferecem benefícios exclusivos aos nossos alunos.'
  },
  {
    id: 2,
    icon: 'BadgePercent',
    title: 'Descontos Exclusivos',
    description:
      'Vantagens negociadas especialmente para quem faz parte da Família Inter.'
  },
  {
    id: 3,
    icon: 'Handshake',
    title: 'Uso Simples',
    description:
      'Apresente sua carteirinha de aluno no estabelecimento parceiro e aproveite seu benefício.'
  },
  {
    id: 4,
    icon: 'HeartHandshake',
    title: 'Família Inter',
    description:
      'Mais vantagens para quem faz parte da Escola Oficial do Inter Viamão.'
  }
]

export default function Stats() {
  const ref = useRef(null)

  const inView = useInView(ref, {
    once: true,
    margin: '-80px'
  })

  return (
    <section
      id="stats"
      className="py-24 bg-neutral-50"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <SectionHeader
          eyebrow="Clube de Benefícios"
          title={
            <>
              Vantagens de fazer
              <br />
              parte da Família Inter
            </>
          }
          description="Muito além dos treinos. Nossa comunidade tem acesso a benefícios exclusivos em empresas parceiras de Viamão."
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-16">

          {stats.map((item, index) => {

            const Icon = iconMap[item.icon]

            return (

              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: .5,
                  delay: index * .08
                }}
                className="
                  group
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

                <div
                  className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-inter-red/10
                    flex
                    items-center
                    justify-center
                    mb-8
                    transition-all
                    duration-300
                    group-hover:bg-inter-red
                  "
                >

                  {Icon && (

                    <Icon
                      size={30}
                      className="
                        text-inter-red
                        transition-colors
                        duration-300
                        group-hover:text-white
                      "
                    />

                  )}

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
                  {item.title}
                </h3>

                <p
                  className="
                    text-neutral-500
                    leading-7
                  "
                >
                  {item.description}
                </p>

              </motion.article>

            )

          })}

        </div>

      </div>
    </section>
  )
}