import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { MapPin, MessageCircle, Plus } from "lucide-react";

import { supabase } from "../lib/supabase";
import { SCHOOL } from "../constants/school";
import { WEEKDAY_LABELS } from "../constants/weekdays";
import { birthYearsOf, currentYear } from "../helpers/categoryAge";
import { mapsUrl } from "../utils/calendar";
import {
  getCategoryLocations,
  getTrialOptions,
  groupTrialOptions,
} from "../services/publicRegistration";

/*
 * Landing page da escola (endereço principal "/").
 *
 * Público principal: pais de crianças de 8 a 11 anos (Sub-09 e
 * Sub-11). O tom é de confiança de escola; o elemento central é o
 * localizador de turma, que mostra na hora a turma, o local e os
 * horários abertos a partir do ano de nascimento.
 *
 * Nada aqui é inventado: sem preços, sem nomes de professores e sem
 * depoimentos até existirem reais. Fotos e vídeo entram em MEDIA.
 */

const CTA_TO = "/experimental";
const CTA_LABEL = "Agendar aula experimental";

/*
 * Fotos e vídeo reais (crianças só com autorização de imagem).
 * Coloque o arquivo em public/landing/ e o caminho aqui, ex.:
 * heroVideo: "/landing/treino.mp4". Vazio = espaço reservado.
 */
const MEDIA = {
  heroVideo: "",
  heroPoster: "",
  coaches: "",
  training: "",
  locations: {
    "Ginásio do Krahe": "",
    "Arena Biguá": "",
  },
};

const LOCATION_DETAILS = {
  "Ginásio do Krahe": {
    modality: "Futsal",
    text: "Quadra coberta. Vá de tênis de futsal ou tênis comum.",
  },
  "Arena Biguá": {
    modality: "Society",
    text: "Gramado sintético. Vá de chuteira society ou tênis.",
  },
};

const TRUST = [
  {
    title: "Metodologia oficial do Inter",
    text: "Celeiro de Ases, o método das Escolas Oficiais do Sport Club Internacional, adaptado para cada idade.",
  },
  {
    title: "Seguro atleta",
    text: "Todo aluno tem seguro de R$ 15 mil, válido 24 horas por dia.",
  },
  {
    title: "Professores capacitados",
    text: "Eles orientam as crianças durante todo o treino.",
  },
  {
    title: "Evolução acompanhada",
    text: "Acompanhamos o desenvolvimento técnico e humano de cada atleta, respeitando o ritmo dele.",
  },
  {
    title: "Disciplina e cidadania",
    text: "Além do futebol, a criança aprende a respeitar, a se organizar e a jogar em equipe.",
  },
  {
    title: "Família por perto",
    text: "Você pode assistir aos treinos, e a comunicação com as famílias é organizada.",
  },
];

const FUNDAMENTALS = ["Passe", "Domínio", "Condução", "Finalização", "Posicionamento"];

const STEPS = [
  {
    title: "Agende online",
    text: "Escolha a turma e o dia. Leva 2 minutos, e a confirmação chega pelo WhatsApp.",
  },
  {
    title: "Venha treinar",
    text: "Seu filho treina 1 hora com a turma da idade dele. Você pode ficar assistindo.",
  },
  {
    title: "A gente conversa",
    text: "No fim, tiramos suas dúvidas sobre horários, uniforme e matrícula.",
  },
];

/*
 * Depoimentos reais de pais. Enquanto a lista estiver vazia, a
 * seção não aparece. Formato:
 * { quote: "…", author: "Mãe do Pedro, Sub-09" }
 */
const TESTIMONIALS = [];

const FAQ = [
  {
    q: "Com que idade meu filho pode começar?",
    a: "A partir do Sub‑05. A turma é definida pelo ano de nascimento: escolha o ano no topo da página para ver a turma e os horários.",
  },
  {
    q: "Ele precisa já saber jogar?",
    a: "Não. O treino respeita a idade e o nível de cada atleta, e o professor orienta durante toda a aula.",
  },
  {
    q: "Posso assistir ao treino?",
    a: "Pode. Os pais podem acompanhar os treinos, inclusive a aula experimental.",
  },
  {
    q: "Os alunos têm seguro?",
    a: "Sim. Todo aluno tem seguro atleta de R$ 15 mil, válido 24 horas por dia.",
  },
  {
    q: "Tem jogos e campeonatos?",
    a: "Tem. Neste momento nossas turmas disputam uma competição, e outras vão acontecer ao longo do ano.",
  },
  {
    q: "O que levar na aula experimental?",
    a: "Roupa confortável, garrafinha de água e tênis de futsal (Krahe) ou chuteira society (Biguá). Chegue uns 10 minutos antes.",
  },
  {
    q: "Quanto custa?",
    a: "Valores, uniforme e matrícula a gente explica pelo WhatsApp ou pessoalmente, depois da aula experimental.",
  },
];

const INSTAGRAM_URL = "https://www.instagram.com/escoladointerviamao/";

// "18:00:00" -> "18h", "18:30:00" -> "18h30"
function formatTime(time) {
  const [hour, minute] = time.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

function formatDay(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/* =========================================================
 * PÁGINA
 * =======================================================*/

export default function Landing() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  // id do local -> nomes das categorias que treinam lá
  const [categoriesByLocation, setCategoriesByLocation] = useState({});

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

  useEffect(() => {
    if (!categories.length) return;

    Promise.all(
      categories.map((category) =>
        getCategoryLocations(category.id)
          .then((rows) => rows.map((row) => [row.id, category.name]))
          .catch(() => []),
      ),
    ).then((pairs) => {
      const map = {};

      pairs.flat().forEach(([locationId, categoryName]) => {
        (map[locationId] ??= []).push(categoryName);
      });

      setCategoriesByLocation(map);
    });
  }, [categories]);

  const whatsappUrl = SCHOOL.whatsapp
    ? `https://wa.me/${SCHOOL.whatsapp}?text=${encodeURIComponent(
        "Olá! Vim pelo site e quero saber mais sobre a Escola do Inter.",
      )}`
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white text-[17px] text-grafite">
        <Header whatsappUrl={whatsappUrl} />

        <main id="inicio">
          {/* HERO + LOCALIZADOR */}
          <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-14 lg:pb-24 lg:pt-14">
            <div>
              <h1 className="font-display text-[3.4rem] font-semibold leading-[0.88] sm:text-7xl lg:text-[5.6rem]">
                Futebol com método para o seu filho, em Viamão.
              </h1>

              <p className="mt-5 max-w-xl leading-relaxed text-neutral-600">
                Escola Oficial do Inter, com a metodologia Celeiro de Ases. Turmas
                pela idade, do Sub‑05 ao Sub‑17, no Ginásio do Krahe e na Arena
                Biguá.
              </p>
            </div>

            <div className="lg:row-span-2">
              <ClassFinder categories={categories} whatsappUrl={whatsappUrl} />
            </div>

            <MediaSlot
              video={MEDIA.heroVideo}
              poster={MEDIA.heroPoster}
              label="Vídeo curto de um treino, sem som"
              className="aspect-video"
            />
          </section>

          {/* POR QUE CONFIAR */}
          <section id="a-escola" className="scroll-mt-20 bg-quadra py-16 lg:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
                  Por que os pais confiam na escola
                </h2>

                <MediaSlot
                  image={MEDIA.coaches}
                  label="Foto dos professores com uma turma"
                  className="mt-8 aspect-[4/3]"
                />
              </div>

              <dl className="self-start divide-y divide-neutral-300 border-y border-neutral-300">
                {TRUST.map((item) => (
                  <div key={item.title} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                    <dt className="font-semibold">{item.title}</dt>
                    <dd className="leading-relaxed text-neutral-600">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* O TREINO */}
          <section id="o-treino" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
            <div>
              <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
                O que acontece em uma hora de treino
              </h2>

              <p className="mt-5 max-w-xl leading-relaxed text-neutral-600">
                No Sub‑09 e no Sub‑11, o treino desenvolve as habilidades do
                futebol respeitando a idade e o nível de cada atleta. As crianças
                trabalham os fundamentos:
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-display text-4xl font-semibold leading-tight text-inter-red sm:text-5xl">
                {FUNDAMENTALS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className="mt-6 max-w-xl leading-relaxed text-neutral-600">
                E colocam tudo em prática em atividades e jogos orientados. O
                objetivo é evoluir na técnica, aprender a jogar em equipe e ganhar
                disciplina e confiança, no ritmo de cada criança.
              </p>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-500">
                O tempo de cada atividade varia conforme o planejamento do
                professor.
              </p>
            </div>

            <MediaSlot
              image={MEDIA.training}
              label="Foto de crianças do Sub-09 ou Sub-11 treinando"
              className="aspect-[4/5]"
            />
          </section>

          {/* LOCAIS */}
          <section id="locais" className="scroll-mt-20 bg-quadra py-16 lg:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
                Onde treinamos
              </h2>

              <p className="mt-4 max-w-xl leading-relaxed text-neutral-600">
                Dois lugares em Viamão. O ano de nascimento define a turma, e cada
                turma treina em um deles ou nos dois.
              </p>

              <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-8">
                {locations.map((location) => {
                  const details = LOCATION_DETAILS[location.name] ?? {};
                  const groups = categoriesByLocation[location.id] ?? [];

                  return (
                    <article key={location.id}>
                      <MediaSlot
                        image={MEDIA.locations[location.name]}
                        label={`Foto: ${location.name}`}
                        className="aspect-[16/10]"
                      />

                      <h3 className="mt-5 font-display text-4xl font-semibold leading-none">
                        {location.name}
                      </h3>

                      <p className="mt-2 leading-relaxed text-neutral-600">
                        {details.modality && (
                          <span className="font-semibold text-grafite">
                            {details.modality}.{" "}
                          </span>
                        )}
                        {details.text}
                      </p>

                      {groups.length > 0 && (
                        <p className="mt-2 text-neutral-600">
                          Turmas aqui: {groups.join(", ")}.
                        </p>
                      )}

                      {location.address && (
                        <>
                          <p className="mt-2 text-sm text-neutral-500">{location.address}</p>

                          <a
                            href={mapsUrl(location.name, location.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-4 inline-flex min-h-12 items-center gap-2 rounded-[10px] border border-neutral-300 bg-white px-4 font-semibold transition-colors hover:border-grafite ${FOCUS_RING} focus-visible:outline-inter-red`}
                          >
                            <MapPin size={18} aria-hidden="true" className="text-inter-red" />
                            Como chegar
                            <span className="sr-only"> ao {location.name}</span>
                          </a>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ESCOLA NOVA */}
          <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
              Uma escola nova, com o padrão do Inter
            </h2>

            <p className="mt-5 text-xl leading-relaxed text-neutral-700">
              Abrimos em 9 de maio de 2026 e já somos cerca de 90 alunos. Neste
              momento, nossas turmas disputam a primeira competição, e outras
              vêm por aí.
            </p>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-flex min-h-12 items-center font-semibold text-inter-red underline decoration-2 underline-offset-4 hover:text-inter-red-dark ${FOCUS_RING} focus-visible:outline-inter-red`}
            >
              Acompanhe os treinos no Instagram @escoladointerviamao
            </a>
          </section>

          {/* DEPOIMENTOS (só com depoimentos reais) */}
          {TESTIMONIALS.length > 0 && (
            <section className="border-t border-neutral-200">
              <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
                <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
                  O que dizem as famílias
                </h2>

                <div className="mt-10 grid gap-8 md:grid-cols-3">
                  {TESTIMONIALS.map((item) => (
                    <figure key={item.author} className="border-l-4 border-inter-red pl-5">
                      <blockquote className="text-lg leading-relaxed">
                        “{item.quote}”
                      </blockquote>
                      <figcaption className="mt-3 text-sm font-semibold text-neutral-500">
                        {item.author}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* AULA EXPERIMENTAL */}
          <section id="aula-experimental" className="scroll-mt-20 bg-quadra py-16 lg:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
                Como é a aula experimental
              </h2>

              <ol className="mt-10 grid gap-8 md:grid-cols-3">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="border-t-4 border-inter-red pt-5">
                    <span className="font-display text-5xl font-semibold leading-none text-inter-red">
                      {index + 1}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-neutral-600">{step.text}</p>
                  </li>
                ))}
              </ol>

              <PrimaryLink className="mt-10 w-full sm:w-auto">{CTA_LABEL}</PrimaryLink>
            </div>
          </section>

          {/* DÚVIDAS */}
          <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="font-display text-5xl font-semibold leading-[0.9] sm:text-6xl">
              Perguntas dos pais
            </h2>

            <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {FAQ.map((item) => (
                <details key={item.q} className="group">
                  <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold ${FOCUS_RING} focus-visible:outline-inter-red [&::-webkit-details-marker]:hidden`}>
                    {item.q}
                    <Plus
                      size={20}
                      aria-hidden="true"
                      className="shrink-0 text-inter-red transition-transform group-open:rotate-45 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="max-w-2xl pb-5 leading-relaxed text-neutral-600">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* FECHAMENTO */}
          <section className="bg-inter-red text-white">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
              <h2 className="max-w-3xl font-display text-5xl font-semibold leading-[0.9] sm:text-7xl">
                Venha ver um treino de perto
              </h2>

              <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
                A aula experimental é o melhor jeito de conhecer a escola. Seu
                filho treina, e você assiste.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={CTA_TO}
                  className={`inline-flex min-h-12 items-center justify-center rounded-[10px] bg-white px-7 py-3.5 font-semibold text-inter-red transition-colors hover:bg-neutral-100 ${FOCUS_RING} focus-visible:outline-white`}
                >
                  {CTA_LABEL}
                </Link>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-white/60 px-7 py-3.5 font-semibold transition-colors hover:border-white ${FOCUS_RING} focus-visible:outline-white`}
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            </div>
          </section>
        </main>

        <Footer locations={locations} whatsappUrl={whatsappUrl} />

        {/* AÇÃO FIXA NO CELULAR */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
          <PrimaryLink className="w-full">{CTA_LABEL}</PrimaryLink>
        </div>
        <div className="h-20 sm:hidden" />
      </div>
    </MotionConfig>
  );
}

/* =========================================================
 * COMPONENTES
 * =======================================================*/

function PrimaryLink({ children, className = "" }) {
  return (
    <Link
      to={CTA_TO}
      className={`inline-flex min-h-12 items-center justify-center rounded-[10px] bg-inter-red px-7 py-3.5 font-semibold text-white transition-colors hover:bg-inter-red-dark ${FOCUS_RING} focus-visible:outline-inter-red ${className}`}
    >
      {children}
    </Link>
  );
}

function Header({ whatsappUrl }) {
  const nav = [
    { href: "#a-escola", label: "A escola" },
    { href: "#o-treino", label: "O treino" },
    { href: "#locais", label: "Locais" },
    { href: "#duvidas", label: "Dúvidas" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <a href="#inicio" className="shrink-0">
          <img
            src="/logo-vermelho.png"
            alt="Escola do Inter Viamão"
            width={128}
            height={48}
            className="h-12 w-32 object-cover"
          />
        </a>

        <nav aria-label="Seções" className="hidden items-center gap-7 font-medium text-neutral-600 lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-grafite">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              className={`inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-[10px] px-3 font-semibold text-whatsapp transition-colors hover:bg-neutral-100 ${FOCUS_RING} focus-visible:outline-inter-red`}
            >
              <MessageCircle size={20} aria-hidden="true" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          <PrimaryLink className="hidden sm:inline-flex">{CTA_LABEL}</PrimaryLink>
        </div>
      </div>
    </header>
  );
}

/*
 * O elemento central da página: o pai escolhe o ano de nascimento
 * e vê a turma, onde treina e os próximos horários abertos.
 */
function ClassFinder({ categories, whatsappUrl }) {
  const year = currentYear();

  const years = useMemo(() => {
    if (!categories.length) return [];

    const oldest = year - Math.max(...categories.map((item) => item.max_age));
    const youngest = year - Math.min(...categories.map((item) => item.min_age));

    return Array.from({ length: youngest - oldest + 1 }, (_, index) => oldest + index);
  }, [categories, year]);

  const [birthYear, setBirthYear] = useState(null);
  const [result, setResult] = useState({ status: "idle" });
  const resultRef = useRef(null);

  // No celular a resposta fica abaixo dos anos: traz para a tela
  useEffect(() => {
    if (!birthYear) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    resultRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [birthYear, result.status]);

  const category = useMemo(() => {
    if (!birthYear) return null;

    const age = year - birthYear;

    return categories.find((item) => item.min_age <= age && item.max_age >= age) ?? null;
  }, [birthYear, categories, year]);

  useEffect(() => {
    if (!category) return;

    let cancelled = false;

    setResult({ status: "loading" });

    getTrialOptions(category.id)
      .then((options) => {
        if (!cancelled) setResult({ status: "done", groups: groupTrialOptions(options) });
      })
      .catch(() => {
        if (!cancelled) setResult({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="rounded-[28px] bg-inter-red p-5 text-white sm:p-7">
      <h2 id="finder-title" className="font-display text-4xl font-semibold leading-none sm:text-5xl">
        Em que ano seu filho nasceu?
      </h2>

      <p className="mt-2 text-white/90">
        Escolha o ano e veja a turma, onde ela treina e os próximos horários.
      </p>

      <div
        role="group"
        aria-labelledby="finder-title"
        className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5"
      >
        {years.length === 0 &&
          Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              className="h-12 animate-pulse rounded-[10px] bg-white/15 motion-reduce:animate-none"
            />
          ))}

        {years.map((item) => {
          const selected = item === birthYear;

          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => setBirthYear(item)}
              className={`h-12 rounded-[10px] pt-1 font-display text-2xl font-semibold leading-none transition-colors ${FOCUS_RING} focus-visible:outline-white ${
                selected
                  ? "bg-white text-inter-red"
                  : "bg-inter-red-dark text-white hover:bg-[#7f0a1c]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {birthYear && (
          <motion.div
            ref={resultRef}
            key={birthYear}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-6 scroll-mb-24 rounded-[18px] bg-white p-5 text-grafite"
          >
            {category ? (
              <FinderResult category={category} result={result} />
            ) : (
              <div>
                <p className="font-semibold">
                  Ainda não temos turma para quem nasceu em {birthYear}.
                </p>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-12 items-center gap-2 font-semibold text-whatsapp underline underline-offset-4"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Pergunte no WhatsApp quando abre
                  </a>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FinderResult({ category, result }) {
  const birthYears = birthYearsOf(category);
  const groups = result.groups ?? [];
  const noOpenClass = result.status === "done" && groups.length === 0;

  return (
    <div>
      <p className="font-display text-5xl font-semibold leading-none text-inter-red">
        {category.name}
      </p>

      {birthYears && (
        <p className="mt-1 text-sm text-neutral-500">
          Turma de quem nasceu em {birthYears.from} e {birthYears.to}
        </p>
      )}

      {result.status === "loading" && (
        <p className="mt-4 text-neutral-500">Buscando horários…</p>
      )}

      {result.status === "error" && (
        <p className="mt-4 text-neutral-600">
          Não conseguimos carregar os horários agora. Você vê todos ao agendar.
        </p>
      )}

      {noOpenClass && (
        <p className="mt-4 leading-relaxed text-neutral-600">
          Esta turma está sem vaga para aula experimental agora. Entre na lista
          de interesse e avisamos quando abrir.
        </p>
      )}

      {result.status === "done" && groups.length > 0 && (
        <ul className="mt-4 space-y-4">
          {groups.map((group) => (
            <li key={group.id}>
              <p className="font-semibold">
                {group.location?.name}
                {group.modality?.name && (
                  <span className="font-normal text-neutral-500">
                    , {group.modality.name.toLowerCase()}
                  </span>
                )}
              </p>

              <ul className="mt-1 text-neutral-700">
                {group.schedules.map((schedule) => (
                  <li key={schedule.schedule_id}>
                    {WEEKDAY_LABELS[schedule.weekday]}, {formatTime(schedule.start_time)} às{" "}
                    {formatTime(schedule.end_time)}
                    {schedule.spots_left === 0 ? (
                      <span className="text-neutral-500"> (sem vaga nesta data)</span>
                    ) : (
                      schedule.next_date && (
                        <span className="text-neutral-500">
                          . Próxima aula: {formatDay(schedule.next_date)}
                        </span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <PrimaryLink className="mt-5 w-full">
        {noOpenClass ? "Entrar na lista de interesse" : CTA_LABEL}
      </PrimaryLink>
    </div>
  );
}

/*
 * Foto ou vídeo real; sem arquivo, mostra um espaço reservado com a
 * descrição do que deve entrar ali.
 */
function MediaSlot({ image, video, poster, label, className = "" }) {
  const [reduceMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  if (video) {
    return (
      <video
        src={video}
        poster={poster || undefined}
        muted
        loop
        playsInline
        autoPlay={!reduceMotion}
        controls={reduceMotion}
        aria-label={label}
        className={`w-full rounded-[20px] object-cover ${className}`}
      />
    );
  }

  if (image) {
    return (
      <img
        src={image}
        alt={label}
        loading="lazy"
        className={`w-full rounded-[20px] object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-[20px] border-2 border-dashed border-neutral-300 bg-white/60 p-6 text-center text-sm text-neutral-500 ${className}`}
    >
      {label}
    </div>
  );
}

function Footer({ locations, whatsappUrl }) {
  return (
    <footer className="bg-grafite py-12 text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold leading-none text-white">
            Escola do Inter Viamão
          </p>
          <p className="mt-3">Escola Oficial do Sport Club Internacional.</p>
        </div>

        <div>
          <p className="font-semibold text-white">Onde treinamos</p>
          <ul className="mt-3 space-y-3">
            {locations.map((location) => (
              <li key={location.id}>
                {location.name}
                {location.address && (
                  <span className="block text-sm text-neutral-400">{location.address}</span>
                )}
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
                  WhatsApp (51) 99647-6999
                </a>
              </li>
            )}
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram @escoladointerviamao
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-neutral-500 sm:px-6">
        © {currentYear()} Escola do Inter Viamão
      </p>
    </footer>
  );
}
