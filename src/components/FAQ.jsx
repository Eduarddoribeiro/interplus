import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import faq from '../data/faq.json'

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-inter-red' : 'text-neutral-800 group-hover:text-inter-red'}`}>
          {item.pergunta}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-inter-red' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm text-neutral-500 leading-relaxed pb-5">
              {item.resposta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [openId, setOpenId] = useState(null)

  return (
    <section id="faq" className="py-24 bg-white px-6 md:px-12">
      <div className="max-w-2xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-bold text-inter-red tracking-[.12em] uppercase mb-3">
            Dúvidas frequentes
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Temos respostas
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faq.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
