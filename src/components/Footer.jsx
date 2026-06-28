import { Instagram, MessageCircle } from 'lucide-react'

const quickLinks = [
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Parceiros',     href: '#parceiros'     },
  { label: 'Seja Parceiro', href: '#seja-parceiro' },
  { label: 'FAQ',           href: '#faq'           },
]

export default function Footer() {
  return (
    <footer className="bg-neutral-950 px-6 md:px-12 pt-16 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Top grid */}
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/6">
          {/* Brand */}
          <div>
            <a href="#inicio" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 bg-inter-red rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                ⚽
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-sm text-white">Família Inter</div>
                <div className="text-[10px] font-medium tracking-widest uppercase text-white/35">Unidade Viamão</div>
              </div>
            </a>
            <p className="text-sm text-white/38 leading-relaxed max-w-[220px]">
              Benefícios exclusivos para quem veste a camisa do Inter. Fazemos parte de algo maior.
            </p>
            <div className="flex gap-2.5 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-white/45 hover:bg-inter-red hover:text-white transition-all"
              >
                <Instagram size={15} />
              </a>
              <a
                href="https://wa.me/5551999990000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-white/45 hover:bg-inter-red hover:text-white transition-all"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-[11px] font-bold text-white/30 tracking-[.12em] uppercase mb-5">
              Links
            </h4>
            {quickLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block text-sm text-white/50 hover:text-white mb-3 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-white/30 tracking-[.12em] uppercase mb-5">
              Contato
            </h4>
            <a href="https://wa.me/5551999990000" className="block text-sm text-white/50 hover:text-white mb-3 transition-colors">WhatsApp</a>
            <a href="https://instagram.com"        className="block text-sm text-white/50 hover:text-white mb-3 transition-colors">@interviamao</a>
            <a href="mailto:contato@interviamao.com.br" className="block text-sm text-white/50 hover:text-white mb-3 transition-colors">contato@interviamao.com.br</a>
            <p className="text-sm text-white/28 mt-5 leading-relaxed">Viamão – RS<br />Brasil</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-7">
          <p className="text-[12px] text-white/22">
            © {new Date().getFullYear()} Escola Oficial do Inter – Unidade Viamão. Todos os direitos reservados.
          </p>
          <p className="text-[12px] text-white/22">Clube de Benefícios Família Inter</p>
        </div>
      </div>
    </footer>
  )
}
