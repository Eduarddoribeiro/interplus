import { Clock, MessageCircle, Footprints } from "lucide-react";

import RegistrationHero from "../components/public/RegistrationHero";
import RegistrationForm from "../components/public/RegistrationForm";

const HOW_IT_WORKS = [
  {
    icon: Footprints,
    title: "Chegue 10 minutos antes",
    text: "O professor recebe vocês e apresenta a turma da idade do seu filho.",
  },
  {
    icon: Clock,
    title: "1 hora de treino",
    text: "Seu filho treina junto com a turma, no ritmo da categoria dele.",
  },
  {
    icon: MessageCircle,
    title: "Depois, tiramos suas dúvidas",
    text: "Horários, uniforme e matrícula — com calma, pessoalmente ou pelo WhatsApp.",
  },
];

export default function PublicRegistration() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <RegistrationHero />

      <section
        id="registration-form"
        className="mx-auto max-w-3xl px-4 sm:px-6"
      >
        <RegistrationForm />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-2xl font-bold text-neutral-900">
          Como é a aula experimental
        </h2>

        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }, index) => (
            <li
              key={title}
              className="rounded-2xl border border-neutral-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Icon size={18} />
                </span>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Passo {index + 1}
                </span>
              </div>

              <h3 className="mt-4 font-bold text-neutral-900">{title}</h3>

              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
