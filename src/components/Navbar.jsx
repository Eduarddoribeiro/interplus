import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useScrolled } from '../hooks/useScrolled'

const links = [
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Parceiros',     href: '#parceiros'     },
  { label: 'FAQ',           href: '#faq'           },
]

export default function Navbar() {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
      {/* Logo */}
<a href="#inicio" className="group flex items-center">
  <img
  src={scrolled ? "/logo-vermelho.png" : "/logo.svg"}
  alt="Escola Oficial do Inter"
  className="h-20 md:h-20 lg:h-24 w-auto transition-all duration-300 group-hover:scale-105"
/>
</a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:opacity-100 ${
                scrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/70 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#seja-parceiro"
            className="px-4 py-2 bg-inter-red text-white text-sm font-semibold rounded-xl hover:bg-inter-red-dark transition-all hover:-translate-y-px"
          >
            Seja Parceiro
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-neutral-700' : 'text-white'}`}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 bg-white border-b border-neutral-200 px-6 py-6 flex flex-col gap-5 shadow-xl md:hidden"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base font-semibold text-neutral-700 hover:text-neutral-900"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#seja-parceiro"
              onClick={() => setOpen(false)}
              className="mt-2 px-5 py-3 bg-inter-red text-white text-sm font-bold rounded-xl text-center hover:bg-inter-red-dark transition-colors"
            >
              Seja Parceiro
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
