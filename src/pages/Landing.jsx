import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  HeartHandshake,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { SCHOOL } from "../constants/school";
import { FAQ } from "../constants/faq";
import { birthYearsOf, currentYear } from "../helpers/categoryAge";
import { mapsUrl } from "../utils/calendar";

/*
 * Landing page da escola (endereço principal "/").
 *
 * MODELO: textos e estrutura prontos; os blocos <PhotoSlot> e os
 * trechos entre [colchetes] esperam fotos e dados reais da escola.
 * Locais e turmas por idade vêm do banco (mesmos dados do
 * formulário de agendamento).
 */

const CTA_TO = "/experimental";

// Modalidade de cada local (usado só para o texto do card).
// A resposta "O que levar" do FAQ (constants/faq.js) repete os
// locais e o calçado: mudou aqui, mude lá.
const LOCATION_DETAILS = {
  "Ginásio do Krahe": {
    modality: "Futsal",
    text: "Quadra coberta, turmas novas abertas e sábado de manhã para os pequenos.",
    photo: "Foto: quadra do Ginásio do Krahe com alunos treinando",
  },
  "Arena Biguá": {
    modality: "Society",
    text: "Gramado sintético para quem quer jogar no campo, do Sub-13 ao Sub-17.",
    photo: "Foto: gramado da Arena Biguá",
  },
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Metodologia oficial do Inter",
    text: "O mesmo padrão de treino das Escolas Oficiais do Internacional, adaptado para cada idade.",
  },
  {
    icon: Users,
    title: "Turmas pela idade",
    text: "Cada criança treina com quem tem a mesma idade e o mesmo ritmo, do Sub-05 ao Sub-17.",
  },
  {
    icon: HeartHandshake,
    title: "Formação além do campo",
    text: "Respeito, disciplina e trabalho em equipe fazem parte de todo treino.",
  },
  {
    icon: Trophy,
    title: "Professores que acompanham",
    text: "Professores formados que conhecem cada aluno pelo nome e conversam com a família.",
  },
];

const STEPS = [
  {
    title: "Agende online",
    text: "Informe a data de nascimento e escolha o dia. Leva 2 minutos.",
  },
  {
    title: "Venha treinar",
    text: "Seu filho faz 1 hora de treino com a turma da idade dele.",
  },
  {
    title: "Converse com a gente",
    text: "Depois do treino, tiramos as dúvidas sobre horários, uniforme e matrícula.",
  },
];

const TESTIMONIALS = [
  {
    quote: "[Depoimento de um pai ou mãe sobre a evolução do filho]",
    author: "[Nome], pai do [Nome], Sub-09",
  },
  {
    quote: "[Depoimento sobre o cuidado dos professores]",
    author: "[Nome], mãe da [Nome], Sub-11",
  },
  {
    quote: "[Depoimento sobre a experiência de jogar pelo Inter]",
    author: "[Nome], pai do [Nome], Sub-13",
  },
];

/* =========================================================
 * PÁGINA
 * =======================================================*/

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    supabase
      .from("locations")
      .select("id, name, address")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setLocations(data ?? []));

    supabase
      .from("categories")
      .select("id, name, min_age, max_age")
      .eq("active", true)
      .order("order_index")
      .then(({ data }) =>
        setCategories((data ?? []).filter((category) => category.min_age != null)),
      );
  }, []);

  const whatsappUrl = SCHOOL.whatsapp
    ? `https://wa.me/${SCHOOL.whatsapp}?text=${encodeURIComponent(
        "Olá! Vim pelo site e quero saber mais sobre a Escola do Inter.",
      )}`
    : null;

  const nav = [
    { href: "#por-que", label: "A escola" },
    { href: "#locais", label: "Onde treinamos" },
    { href: "#turmas", label: "Turmas" },
    { href: "#como-funciona", label: "Aula experimental" },
    { href: "#duvidas", label: "Dúvidas" },
  ];

  return (
    <div className="bg-white text-neutral-900">
      {/* TOPO */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#inicio" className="shrink-0">
            <img
              src="/logo-vermelho.png"
              alt="Escola do Inter Viamão"
              className="h-12 w-32 object-cover"
            />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-neutral-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={CTA_TO}
              className="hidden rounded-full bg-inter-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-inter-red-dark sm:inline-flex"
            >
              Agendar aula experimental
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-neutral-700 lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-neutral-100 px-4 pb-4 lg:hidden">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-medium text-neutral-700"
              >
                {item.label}
              </a>
            ))}

            <Link
              to={CTA_TO}
              className="mt-2 block rounded-xl bg-inter-red px-5 py-3 text-center font-semibold text-white"
            >
              Agendar aula experimental
            </Link>
          </nav>
        )}
      </header>

      <main id="inicio">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-inter-red">
              Escola Oficial do Inter · Viamão
            </p>

            <h1 className="mt-4 font-display text-6xl uppercase leading-[0.85] sm:text-7xl lg:text-8xl">
              Seu filho jogando
              <span className="block text-inter-red">com a camisa do Inter</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-600">
              Futsal no Ginásio do Krahe e society na Arena Biguá, com turmas pela
              idade e a metodologia das Escolas Oficiais do Internacional.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={CTA_TO}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-inter-red px-7 py-4 font-semibold text-white transition hover:bg-inter-red-dark"
              >
                Agendar aula experimental
                <ArrowRight size={18} />
              </Link>

              <a
                href="#turmas"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-7 py-4 font-semibold text-neutral-800 transition hover:border-neutral-900"
              >
                Qual é a turma do meu filho?
              </a>
            </div>

            <p className="mt-5 text-sm text-neutral-500">
              Agendamento em 2 minutos · confirmação pelo WhatsApp
            </p>
          </div>

          <PhotoSlot
            label="Foto principal: crianças treinando com o uniforme do Inter"
            className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]"
          />
        </section>

        {/* NÚMEROS */}
        <section className="border-y border-neutral-100 bg-neutral-50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
            <Stat value="[X]" label="alunos treinando hoje" />
            <Stat value="[X] anos" label="de escola em Viamão" />
            <Stat value="2" label="locais: Krahe e Biguá" />
            <Stat value="Sub-05 a Sub-17" label="turmas por idade" />
          </div>
        </section>

        {/* POR QUE */}
        <section id="por-que" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Por que a Escola do Inter"
            title="Mais do que treino de futebol"
            text="A criança aprende o jogo, faz amigos e cresce com valores. A família acompanha de perto."
          />

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white p-7">
                <Icon size={26} className="text-inter-red" />
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LOCAIS */}
        <section id="locais" className="scroll-mt-20 bg-neutral-950 py-20 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              dark
              eyebrow="Onde treinamos"
              title="Dois locais em Viamão"
              text="Escolha o mais perto de casa e a modalidade que seu filho prefere."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {(locations.length
                ? locations
                : Object.keys(LOCATION_DETAILS).map((name) => ({ id: name, name }))
              ).map((location) => {
                const details = LOCATION_DETAILS[location.name] ?? {};

                return (
                  <article
                    key={location.id}
                    className="overflow-hidden rounded-3xl bg-neutral-900"
                  >
                    <PhotoSlot
                      dark
                      label={details.photo ?? `Foto: ${location.name}`}
                      className="aspect-[16/10] rounded-none"
                    />

                    <div className="p-6">
                      {details.modality && (
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                          {details.modality}
                        </p>
                      )}

                      <h3 className="mt-2 font-display text-4xl uppercase leading-none">
                        {location.name}
                      </h3>

                      {details.text && (
                        <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                          {details.text}
                        </p>
                      )}

                      {location.address && (
                        <a
                          href={mapsUrl(location.name, location.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
                        >
                          <MapPin size={16} />
                          {location.address}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* TURMAS */}
        <section id="turmas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Turmas por idade"
                title="Qual é a turma do meu filho?"
                text="A turma é definida pelo ano de nascimento. Escolha o ano e veja na hora."
              />

              <CategoryFinder categories={categories} />
            </div>

            <div className="grid grid-cols-2 gap-3 self-start sm:grid-cols-3">
              {categories.map((category) => {
                const years = birthYearsOf(category);

                return (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-neutral-200 p-4"
                  >
                    <p className="font-display text-3xl uppercase leading-none">
                      {category.name}
                    </p>

                    {years && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Nascidos em{" "}
                        {years.from === years.to ? years.from : `${years.from}–${years.to}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 border-y border-neutral-100 bg-neutral-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Aula experimental"
              title="Venha conhecer antes de decidir"
              text="Seu filho treina com a turma, e vocês conhecem a escola de perto."
            />

            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-3xl bg-white p-7">
                  <span className="font-display text-5xl leading-none text-inter-red">
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 text-center">
              <Link
                to={CTA_TO}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-inter-red px-8 py-4 font-semibold text-white transition hover:bg-inter-red-dark"
              >
                <CalendarCheck size={18} />
                Escolher o dia da aula
              </Link>
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS + GALERIA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Quem já treina"
            title="O que as famílias dizem"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item.author} className="rounded-3xl border border-neutral-200 p-7">
                <blockquote className="text-neutral-700">“{item.quote}”</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-neutral-900">
                  {item.author}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              "Foto: treino Sub-05/07",
              "Foto: comemoração de gol",
              "Foto: professor orientando",
              "Foto: time com o uniforme",
            ].map((label) => (
              <PhotoSlot key={label} label={label} className="aspect-square" />
            ))}
          </div>
        </section>

        {/* DÚVIDAS */}
        <section id="duvidas" className="scroll-mt-20 border-t border-neutral-100 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading center eyebrow="Dúvidas" title="Perguntas frequentes" />
            <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {item.q}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-neutral-400 transition group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 leading-relaxed text-neutral-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-inter-red py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="font-display text-5xl uppercase leading-[0.9] sm:text-7xl">
              A primeira aula é o melhor jeito de conhecer
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
              Agende em 2 minutos. A gente confirma pelo WhatsApp.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={CTA_TO}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-inter-red transition hover:bg-neutral-100"
              >
                Agendar aula experimental
                <ArrowRight size={18} />
              </Link>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-4 font-semibold text-white transition hover:border-white"
                >
                  <MessageCircle size={18} />
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="bg-neutral-950 py-12 text-sm text-neutral-400">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-display text-3xl uppercase leading-none text-white">
              Escola do Inter Viamão
            </p>
            <p className="mt-3">Escola Oficial do Sport Club Internacional.</p>
          </div>

          <div>
            <p className="font-semibold text-white">Locais</p>
            <ul className="mt-3 space-y-2">
              {locations.map((location) => (
                <li key={location.id}>
                  {location.name}
                  {location.address ? ` · ${location.address}` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">Contato</p>
            <ul className="mt-3 space-y-2">
              {whatsappUrl && (
                <li>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    WhatsApp
                  </a>
                </li>
              )}
              <li>[Instagram]</li>
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-neutral-600 sm:px-6">
          © {currentYear()} Escola do Inter Viamão
        </p>
      </footer>

      {/* CTA FIXO NO CELULAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link
          to={CTA_TO}
          className="block rounded-full bg-inter-red py-3.5 text-center font-semibold text-white"
        >
          Agendar aula experimental
        </Link>
      </div>
      <div className="h-20 sm:hidden" />
    </div>
  );
}

/* =========================================================
 * COMPONENTES
 * =======================================================*/

function SectionHeading({ eyebrow, title, text, dark = false, center = false }) {
  return (
    <div className={center ? "text-center" : "max-w-2xl"}>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-red-400" : "text-inter-red"
        }`}
      >
        {eyebrow}
      </p>

      <h2 className="mt-3 font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
        {title}
      </h2>

      {text && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
          {text}
        </p>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-4xl uppercase leading-none sm:text-5xl">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

/*
 * Espaço reservado para foto (trocar por <img> quando as fotos
 * chegarem). Fotos de crianças só com autorização de imagem.
 */
function PhotoSlot({ label, className = "", dark = false }) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl p-6 text-center text-xs font-medium ${
        dark ? "bg-neutral-800 text-neutral-500" : "bg-neutral-100 text-neutral-400"
      } ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,.025) 14px 28px)",
      }}
    >
      {label}
    </div>
  );
}

function CategoryFinder({ categories }) {
  const year = currentYear();
  const years = Array.from({ length: 16 }, (_, index) => year - 3 - index);

  const [birthYear, setBirthYear] = useState("");

  const category = useMemo(() => {
    if (!birthYear) return null;

    const age = year - Number(birthYear);

    return categories.find(
      (item) => item.min_age <= age && item.max_age >= age,
    ) ?? false;
  }, [birthYear, categories, year]);

  return (
    <div className="mt-8 rounded-3xl border border-neutral-200 p-6">
      <label className="text-sm font-semibold text-neutral-700" htmlFor="birth-year">
        Ano de nascimento
      </label>

      <select
        id="birth-year"
        value={birthYear}
        onChange={(event) => setBirthYear(event.target.value)}
        className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-inter-red"
      >
        <option value="">Selecione</option>
        {years.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {category && (
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="text-sm text-neutral-500">Turma</span>
            <span className="block font-display text-5xl uppercase leading-none text-inter-red">
              {category.name}
            </span>
          </p>

          <Link
            to={CTA_TO}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-inter-red px-6 py-3 font-semibold text-white transition hover:bg-inter-red-dark"
          >
            Ver horários
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {category === false && (
        <p className="mt-5 text-sm text-neutral-600">
          Ainda não temos turma para esse ano.{" "}
          <Link to={CTA_TO} className="font-semibold text-inter-red underline">
            Deixe seu contato
          </Link>{" "}
          e avisamos quando abrir.
        </p>
      )}
    </div>
  );
}
