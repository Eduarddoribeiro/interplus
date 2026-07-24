import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import SectionHeader from '../common/sectionHeader'

const faq = [
  {
    id: 1,
    pergunta: 'Quem pode utilizar os descontos?',
    resposta:
      'Todos os alunos ativos da Escola Oficial do Inter Viamão mediante apresentação da carteirinha.'
  },
  {
    id: 2,
    pergunta: 'Como faço para receber o desconto?',
    resposta:
      'Basta apresentar sua carteirinha do Clube de Benefícios antes do pagamento.'
  },
  {
    id: 3,
    pergunta: 'Os descontos valem em todas as unidades?',
    resposta:
      'Os benefícios são válidos nas unidades participantes indicadas nesta página.'
  },
  {
    id: 4,
    pergunta: 'A carteirinha tem validade?',
    resposta:
      'Sim. Ela permanece válida enquanto o aluno estiver regularmente matriculado.'
  }
]

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <motion.article
      layout
      className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        px-8
        transition-all
        duration-300
        hover:border-inter-red/30
        hover:shadow-lg
      "
    >
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between gap-6 text-left"
      >
        <h3
          className={`
            font-semibold
            text-lg
            transition-colors
            ${
              isOpen
                ? 'text-inter-red'
                : 'text-neutral-900'
            }
          `}
        >
          {item.pergunta}
        </h3>

        <ChevronDown
          size={22}
          className={`
            shrink-0
            transition-all
            duration-300
            ${
              isOpen
                ? 'rotate-180 text-inter-red'
                : 'text-neutral-400'
            }
          `}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0
            }}
            animate={{
              height: 'auto',
              opacity: 1
            }}
            exit={{
              height: 0,
              opacity: 0
            }}
            transition={{
              duration: .25
            }}
            className="overflow-hidden"
          >
            <p className="pb-7 leading-7 text-neutral-500">
              {item.resposta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default function FAQ() {
  const [openId, setOpenId] = useState(1)

  return (
    <section
      id="faq"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <SectionHeader
          align="center"
          eyebrow="Dúvidas Frequentes"
          title="Temos respostas"
          description="Respondemos as principais dúvidas sobre o Clube de Benefícios da Escola Oficial do Inter Viamão."
        />

        <div className="max-w-4xl mx-auto mt-14 space-y-4">

          {faq.map((item) => (

            <FaqItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() =>
                setOpenId(
                  openId === item.id
                    ? null
                    : item.id
                )
              }
            />

          ))}

        </div>

      </div>
    </section>
  )
}