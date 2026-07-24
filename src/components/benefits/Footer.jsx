import {
  Instagram,
  MessageCircle,
  Mail,
  MapPin,
  ArrowUpRight
} from 'lucide-react'

const quickLinks = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Parceiros', href: '#parceiros' },
  { label: 'Seja parceiro', href: '#seja-parceiro' },
  { label: 'FAQ', href: '#faq' }
]

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">

        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr] gap-16">

          {/* Marca */}

          <div>

            <span className="text-inter-red uppercase tracking-[.18em] text-xs font-bold">
              Clube de Benefícios
            </span>

            <h2 className="font-display text-5xl uppercase leading-[.9] mt-4">
              Família Inter
            </h2>

            <p className="mt-6 text-white/65 leading-8 max-w-md">
              Benefícios exclusivos para alunos e famílias da Escola Oficial do
              Inter Viamão. Fortalecendo nossa comunidade através de parcerias
              com empresas locais.
            </p>

            <div className="flex gap-4 mt-10">

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  px-5
                  py-3
                  text-sm
                  hover:bg-white
                  hover:text-neutral-900
                  transition-all
                "
              >
                <Instagram size={17} />
                Instagram
              </a>

              <a
                href="https://wa.me/5551999990000"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-inter-red
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  hover:brightness-110
                  transition-all
                "
              >
                <MessageCircle size={17} />
                WhatsApp
              </a>

            </div>

          </div>

          {/* Navegação */}

          <div>

            <h3 className="uppercase tracking-[.18em] text-xs font-bold text-white/40 mb-6">
              Explorar
            </h3>

            <div className="space-y-4">

              {quickLinks.map((item) => (

                <a
                  key={item.href}
                  href={item.href}
                  className="
                    flex
                    items-center
                    justify-between
                    text-white/65
                    hover:text-white
                    transition-colors
                  "
                >
                  {item.label}

                  <ArrowUpRight size={15} />

                </a>

              ))}

            </div>

          </div>

          {/* Contato */}

          <div>

            <h3 className="uppercase tracking-[.18em] text-xs font-bold text-white/40 mb-6">
              Contato
            </h3>

            <div className="space-y-5">

              <a
                href="https://wa.me/5551999990000"
                className="flex gap-3 text-white/65 hover:text-white transition-colors"
              >
                <MessageCircle size={18} />

                WhatsApp

              </a>

              <a
                href="mailto:contato@interviamao.com.br"
                className="flex gap-3 text-white/65 hover:text-white transition-colors"
              >
                <Mail size={18} />

                contato@interviamao.com.br

              </a>

              <div className="flex gap-3 text-white/65">

                <MapPin size={18} />

                <span>
                  Viamão • RS
                  <br />
                  Brasil
                </span>

              </div>

            </div>

          </div>

        </div>

        <div className="border-t border-white/10 mt-20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-white/35">
            © {new Date().getFullYear()} Escola Oficial do Inter – Unidade
            Viamão. Todos os direitos reservados.
          </p>

          <p className="text-sm text-white/35">
            Clube de Benefícios • Família Inter
          </p>

        </div>

      </div>

    </footer>
  )
}