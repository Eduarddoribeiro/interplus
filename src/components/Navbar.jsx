import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useScrolled } from "../hooks/useScrolled";

const links = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Parceiros", href: "#parceiros" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-neutral-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto h-24 px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="group">
            <img
              src={scrolled ? "/logo-vermelho.png" : "/logo.svg"}
              alt="Escola Oficial do Inter"
              className={`w-auto transition-all duration-300 group-hover:scale-105 ${
                scrolled
                  ? "h-14 lg:h-16"
                  : "h-16 lg:h-20"
              }`}
            />
          </a>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-10">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium transition-colors ${
                  scrolled
                    ? "text-neutral-700 hover:text-neutral-950"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}

            <a
              href="#seja-parceiro"
              className="px-6 py-3 rounded-full bg-inter-red text-white text-sm font-semibold transition-all duration-300 hover:bg-inter-red-dark hover:-translate-y-0.5 hover:shadow-lg"
            >
              Seja Parceiro
            </a>
          </div>

          {/* Mobile */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden transition-colors ${
              scrolled ? "text-neutral-800" : "text-white"
            }`}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* Drawer Mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 inset-x-0 z-40 bg-white border-b border-neutral-200 shadow-xl md:hidden"
          >
            <div className="flex flex-col px-6 py-8 gap-6">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-semibold text-neutral-700"
                >
                  {link.label}
                </a>
              ))}

              <a
                href="#seja-parceiro"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-inter-red py-4 text-center text-white font-semibold"
              >
                Seja Parceiro
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}