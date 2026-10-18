import { CalendarCheck, MessageCircle, ShieldCheck } from "lucide-react";

/*
 * Topo da página de agendamento.
 *
 * Curto de propósito: no celular o formulário já aparece na
 * primeira tela. Quem chega aqui (Instagram, WhatsApp) já quer
 * agendar — o topo só confirma que é a escola certa.
 */
export default function RegistrationHero() {
  return (
    <header className="px-4 pb-6 pt-6 text-center sm:pb-10 sm:pt-10">
      <img
        src="/logo-vermelho.png"
        alt="Escola do Inter Viamão"
        className="mx-auto h-16 w-44 object-cover sm:h-20 sm:w-56"
      />

      <h1 className="mt-4 text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
        Agende a aula experimental
      </h1>

      <p className="mx-auto mt-2 max-w-md text-neutral-600">
        Escolha o horário em 2 minutos. A confirmação chega pelo WhatsApp.
      </p>

      <ul className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-neutral-700 sm:text-sm">
        <Chip icon={ShieldCheck}>Escola Oficial do Inter</Chip>
        <Chip icon={CalendarCheck}>Turmas por idade</Chip>
        <Chip icon={MessageCircle}>Confirmação pelo WhatsApp</Chip>
      </ul>
    </header>
  );
}

function Chip({ icon: Icon, children }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
      <Icon size={14} className="text-red-600" />
      {children}
    </li>
  );
}
