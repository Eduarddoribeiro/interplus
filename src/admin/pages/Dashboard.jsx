import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  ListChecks,
  MapPin,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";

import { getDashboardData } from "../../services/dashboard";
import { EXPERIMENTAL_STATUS_LABEL } from "../../constants/experimentalStatus";
import { createWhatsAppUrl } from "../../helpers/contactPresentation";

// Status da agenda: só um ponto discreto
const SESSION_DOT = {
  pending_confirmation: "bg-amber-400",
  confirmed: "bg-neutral-900",
  attended: "bg-neutral-300",
  no_show: "bg-red-600",
};

const formatTime = (time) => time?.slice(0, 5) ?? "";

function formatDayTitle(iso, isToday) {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  return isToday ? `Hoje · ${label}` : label;
}

function formatShortDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function monthName(key) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
}

/*
 * Visão geral = o que precisa ser feito hoje.
 *
 * 1. Pendências (clicáveis, somem quando zeram)
 * 2. Agenda de hoje e do próximo dia com experimental, por local
 * 3. Retornos vencidos
 * 4. Resultado do mês
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      setData(await getDashboardData());
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Não foi possível carregar a visão geral.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-neutral-500">
        Carregando visão geral...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{error}</p>

        <button
          type="button"
          onClick={loadDashboard}
          className="mt-4 rounded-xl bg-inter-red px-5 py-2 font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { pending } = data;

  const pendingCards = [
    {
      key: "overdue",
      urgent: true,
      value: pending.overdue,
      title: "Presença sem baixa",
      text: "Experimentais que já passaram sem 'veio' ou 'faltou'.",
      to: "/admin/experimentals?filtro=overdue",
    },
    {
      key: "toConfirm",
      value: pending.toConfirm,
      title: "Confirmar experimentais",
      text: "Nas próximas 48h e ainda não confirmadas.",
      to: "/admin/experimentals?filtro=future",
    },
    {
      key: "followUpsDue",
      urgent: true,
      value: pending.followUpsDue,
      title: "Retornos vencidos",
      text: "Data de retorno é hoje ou já passou.",
      to: "/admin/follow-ups",
    },
    {
      key: "waitingNow",
      value: pending.waitingNow,
      title: "Lista: podem agendar agora",
      text: "Famílias da lista de interesse com vaga aberta.",
      to: "/admin/waiting-list",
    },
    {
      key: "triage",
      value: pending.triage,
      title: "Contatos para triagem",
      text: "Entraram pelo WhatsApp ou estão sem nome.",
      to: "/admin/contacts?aba=triage",
    },
  ].filter((card) => card.value > 0);

  return (
    <div className="space-y-10">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Visão Geral"
          description="O que precisa ser feito hoje."
        />

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* PENDÊNCIAS */}
      {/* Uma faixa só, neutra; o vermelho marca apenas o que está atrasado */}
      {pendingCards.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-neutral-700">
          <CheckCircle2 size={20} className="text-neutral-400" />
          <p className="font-medium">Tudo em dia. Nenhuma pendência agora.</p>
        </div>
      ) : (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Pendências
          </p>

          <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:grid-cols-2 xl:auto-cols-fr xl:grid-flow-col xl:grid-cols-none">
            {pendingCards.map(({ key, value, title, text, to, urgent }, index) => (
              <Link
                key={key}
                to={to}
                className={`group flex flex-col justify-between px-6 py-5 transition-colors hover:bg-neutral-50 ${
                  index > 0 ? "border-t border-neutral-100 sm:border-t-0 xl:border-l" : ""
                } ${index % 2 === 1 ? "sm:border-l" : ""} ${index > 1 ? "sm:border-t xl:border-t-0" : ""}`}
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                    {urgent && <span className="h-1.5 w-1.5 rounded-full bg-red-600" />}
                    {title}
                  </p>

                  <p
                    className={`mt-2 font-display text-5xl leading-none ${
                      urgent ? "text-red-700" : "text-neutral-900"
                    }`}
                  >
                    {value}
                  </p>
                </div>

                <p className="mt-4 flex items-end justify-between gap-3 text-xs leading-relaxed text-neutral-400">
                  <span>{text}</span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-700"
                  />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-3">
        {/* AGENDA */}
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-neutral-900">Agenda de experimentais</h2>

            <Link
              to="/admin/experimentals"
              className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline"
            >
              <ListChecks size={16} />
              Lista dos professores
            </Link>
          </div>

          {data.agenda.map((day) => (
            <div key={day.date} className="rounded-2xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
                <p className="font-bold capitalize text-neutral-900">
                  {formatDayTitle(day.date, day.isToday)}
                </p>

                <span className="text-sm text-neutral-500">
                  {day.total} experimenta{day.total === 1 ? "l" : "is"}
                </span>
              </div>

              {day.total === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-500">
                  Nenhuma experimental neste dia.
                </p>
              ) : (
                day.locations.map((location) => (
                  <div key={location.name} className="px-5 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      <MapPin size={13} className="text-red-600" />
                      {location.name}
                    </p>

                    <ul className="mt-2 divide-y divide-neutral-100">
                      {location.items.map((session) => (
                        <li key={session.id} className="flex items-center gap-3 py-2 text-sm">
                          <span className="w-12 font-bold text-red-600">
                            {formatTime(session.experimental_time || session.schedule?.start_time)}
                          </span>

                          <Link
                            to={`/admin/contacts/${session.contact_id}`}
                            className="min-w-0 flex-1 truncate font-semibold text-neutral-900 hover:underline"
                          >
                            {session.contact?.child_name || "Sem nome"}
                          </Link>

                          <span className="hidden text-neutral-500 sm:inline">
                            {session.category?.name}
                          </span>

                          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                SESSION_DOT[session.status] ?? "bg-neutral-300"
                              }`}
                            />
                            {EXPERIMENTAL_STATUS_LABEL[session.status] ?? session.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          ))}
        </section>

        {/* RETORNOS */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-neutral-900">Retornos de hoje</h2>

            <Link
              to="/admin/follow-ups"
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white">
            {data.followUpsDue.length === 0 ? (
              <p className="px-5 py-6 text-sm text-neutral-500">
                Nenhum retorno vencido. 👍
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.followUpsDue.slice(0, 8).map((contact) => {
                  const whatsappUrl = createWhatsAppUrl(contact.phone);
                  const late = String(contact.follow_up_date).slice(0, 10) < data.today;

                  return (
                    <li key={contact.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/contacts/${contact.id}`}
                          className="block truncate font-semibold text-neutral-900 hover:underline"
                        >
                          {contact.child_name || contact.responsible_name || "Sem nome"}
                        </Link>

                        <p className={`text-xs ${late ? "font-semibold text-orange-700" : "text-neutral-500"}`}>
                          {late ? `Vencido em ${formatShortDate(contact.follow_up_date)}` : "Hoje"}
                          {contact.category?.name ? ` · ${contact.category.name}` : ""}
                        </p>
                      </div>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                          className="rounded-lg border border-green-200 bg-green-50 p-2 text-green-800 hover:bg-green-100"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {(data.followUpsDue.length > 8 || data.followUpsUpcoming > 0) && (
              <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
                {data.followUpsDue.length > 8 && `+${data.followUpsDue.length - 8} vencidos · `}
                {data.followUpsUpcoming} nos próximos 7 dias
              </p>
            )}
          </div>
        </section>
      </div>

      {/* RESULTADO DO MÊS */}
      <MonthResult month={data.month} previous={data.previousMonth} />
    </div>
  );
}

function Delta({ current, previous }) {
  const diff = current - previous;

  if (!diff) return <span className="text-xs text-neutral-400">= mês anterior</span>;

  return (
    <span className={`text-xs font-semibold ${diff > 0 ? "text-green-700" : "text-red-600"}`}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)} vs. mês anterior
    </span>
  );
}

function MonthResult({ month, previous }) {
  const steps = [
    { key: "leads", label: "Novos leads" },
    { key: "scheduled", label: "Experimentais" },
    { key: "attended", label: "Compareceram" },
    { key: "enrolled", label: "Matrículas" },
  ];

  const maxSource = month.sources[0]?.count ?? 0;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
            Resultado do mês
          </p>

          <h2 className="mt-1 text-xl font-bold capitalize text-neutral-900">
            {monthName(month.key)}
          </h2>
        </div>

        <Link
          to="/admin/reports"
          className="text-sm font-semibold text-red-700 hover:underline"
        >
          Relatórios completos
        </Link>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        {/* FUNIL */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.key} className="relative rounded-xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold text-neutral-500">{step.label}</p>

                <p className="mt-1 font-display text-4xl leading-none text-neutral-900">
                  {month[step.key]}
                </p>

                <div className="mt-2">
                  <Delta current={month[step.key]} previous={previous[step.key]} />
                </div>

                {index < steps.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-neutral-300 sm:block"
                  />
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-neutral-600">
            Conversão (matrículas ÷ compareceram):{" "}
            <strong className="text-neutral-900">
              {month.conversion === null ? "—" : `${month.conversion}%`}
            </strong>
            {previous.conversion !== null && (
              <span className="text-neutral-400">
                {" "}· mês anterior {previous.conversion}%
              </span>
            )}
          </p>
        </div>

        {/* ORIGENS */}
        <div>
          <p className="text-sm font-semibold text-neutral-900">De onde vieram os leads</p>

          {month.sources.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Nenhum lead novo neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {month.sources.slice(0, 5).map((source) => (
                <li key={source.label}>
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>{source.label}</span>
                    <span className="font-semibold">{source.count}</span>
                  </div>

                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-red-600"
                      style={{ width: `${(source.count / maxSource) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
