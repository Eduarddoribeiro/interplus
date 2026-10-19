import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { CheckCircle2, ChevronRight, MessageCircle, Plus } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, urgencyRail, urgencyText } from "../ui";

import { getDashboardData } from "../../services/dashboard";
import { EXPERIMENTAL_STATUS_LABEL } from "../../constants/experimentalStatus";
import { createWhatsAppUrl } from "../../helpers/contactPresentation";

// Rótulos curtos da agenda (cabem numa linha)
const SESSION_LABEL = {
  pending_confirmation: "A confirmar",
  confirmed: "Confirmada",
  attended: "Compareceu",
  no_show: "Não compareceu",
  cancelled: "Cancelada",
};

// Status da experimental na agenda: só "a confirmar" pede atenção
const SESSION_URGENCY = {
  pending_confirmation: "attention",
  no_show: "alert",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const formatTime = (time) => time?.slice(0, 5) ?? "";

// "Segunda-feira, 19 de outubro"
function formatToday() {
  const label = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

// "Hoje, segunda-feira, 19/10" ou "Terça-feira, 20/10"
function formatDayTitle(iso, isToday) {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  return isToday ? `Hoje, ${label}` : label.charAt(0).toUpperCase() + label.slice(1);
}

// Dias entre a data de retorno e hoje (0 = hoje)
function daysLate(value, today) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  const base = new Date(`${today}T12:00:00`);

  return Math.round((base - date) / DAY_MS);
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
 * 3. Retornos para fazer (vencidos e de hoje)
 * 4. Resultado do mês
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { openNewContact, contactsVersion } = useOutletContext();

  // Recarrega ao criar contato e ao voltar para a aba do navegador
  useEffect(() => {
    loadDashboard();
  }, [contactsVersion]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") loadDashboard();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
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

  const header = (
    <SectionTitle
      title="Visão geral"
      summary={formatToday()}
      actions={
        <Button variant="primary" onClick={openNewContact}>
          <Plus size={18} aria-hidden="true" />
          Novo contato
        </Button>
      }
    />
  );

  if (loading && !data) {
    return (
      <div>
        {header}
        <p role="status" className="py-16 text-center text-muted">
          Carregando…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        <Panel className="p-6">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>

          <Button className="mt-4" onClick={loadDashboard}>
            Tentar de novo
          </Button>
        </Panel>
      </div>
    );
  }

  const { pending } = data;

  const pendingItems = [
    {
      key: "overdue",
      urgency: "alert",
      value: pending.overdue,
      title: "Presenças sem baixa",
      text: "Aulas que já passaram sem veio ou faltou",
      to: "/admin/experimentals?filtro=overdue",
    },
    {
      key: "followUpsDue",
      urgency: "alert",
      value: pending.followUpsDue,
      title: "Retornos vencidos",
      text: "Data de retorno é hoje ou já passou",
      to: "/admin/follow-ups",
    },
    {
      key: "toConfirm",
      urgency: "attention",
      value: pending.toConfirm,
      title: "Aulas para confirmar",
      text: "Nas próximas 48 horas",
      to: "/admin/experimentals?filtro=future",
    },
    {
      key: "awaitingResult",
      urgency: "attention",
      value: pending.awaitingResult,
      title: "Resultado da aula",
      text: "Vieram e a família ainda não decidiu",
      to: "/admin/experimentals?filtro=no_result",
    },
    {
      key: "waitingNow",
      value: pending.waitingNow,
      title: "Lista de interesse com vaga",
      text: "Famílias que podem agendar agora",
      to: "/admin/waiting-list",
    },
    {
      key: "triage",
      value: pending.triage,
      title: "Contatos para triagem",
      text: "Vieram pelo WhatsApp ou estão sem nome",
      to: "/admin/contacts?aba=triage",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8">
      {header}

      {/* PENDÊNCIAS */}
      {pendingItems.length === 0 ? (
        <Panel className="flex items-center gap-3 px-5 py-4">
          <CheckCircle2 size={20} aria-hidden="true" className="text-ok" />
          <p className="font-medium">Tudo em dia. Nenhuma pendência agora.</p>
        </Panel>
      ) : (
        <section aria-labelledby="pendencias">
          <h2 id="pendencias" className="sr-only">
            Pendências
          </h2>

          <Panel as="ul" className="grid gap-px overflow-hidden bg-line sm:grid-cols-2 xl:grid-cols-3">
            {pendingItems.map((item) => (
              <li key={item.key} className="bg-white">
                <Link
                  to={item.to}
                  className={`group flex h-full items-center gap-4 px-4 py-4 transition-colors hover:bg-canvas ${urgencyRail(item.urgency)}`}
                >
                  <span
                    className={`w-14 shrink-0 text-right font-display text-4xl font-semibold leading-none tabular-nums ${
                      item.urgency ? urgencyText(item.urgency) : "text-ink"
                    }`}
                  >
                    {item.value}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="block text-sm text-muted">{item.text}</span>
                  </span>

                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-neutral-300 group-hover:text-ink"
                  />
                </Link>
              </li>
            ))}
          </Panel>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        {/* AGENDA */}
        <section aria-labelledby="agenda" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="agenda" className="text-lg font-semibold">
              Agenda de experimentais
            </h2>

            <Link to="/admin/experimentals" className="text-sm font-semibold text-muted hover:text-ink">
              Ver todas
            </Link>
          </div>

          {data.agenda.map((day) => (
            <Panel key={day.date}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
                <h3 className="font-semibold">{formatDayTitle(day.date, day.isToday)}</h3>

                <span className="text-sm text-muted">
                  {day.total} {day.total === 1 ? "aula" : "aulas"}
                </span>
              </div>

              {day.total === 0 ? (
                <p className="px-4 py-5 text-sm text-muted">Nenhuma aula neste dia.</p>
              ) : (
                day.locations.map((location) => (
                  <div key={location.name}>
                    <p className="px-4 pb-1 pt-3 text-sm text-muted">{location.name}</p>

                    <ul>
                      {location.items.map((session) => {
                        const urgency = SESSION_URGENCY[session.status];

                        return (
                          <li
                            key={session.id}
                            className={`grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-3 px-4 py-2.5 text-sm sm:grid-cols-[3.5rem_1fr_5rem_10rem] ${urgencyRail(urgency)}`}
                          >
                            <span className="font-semibold tabular-nums">
                              {formatTime(session.experimental_time || session.schedule?.start_time)}
                            </span>

                            <Link
                              to={`/admin/contacts/${session.contact_id}`}
                              className="min-w-0 truncate font-medium hover:underline"
                            >
                              {session.contact?.child_name || "Sem nome"}
                            </Link>

                            <span className="hidden text-muted sm:block">
                              {session.category?.name}
                            </span>

                            <span className={`text-right ${urgency ? urgencyText(urgency) : "text-muted"}`}>
                              {SESSION_LABEL[session.status] ?? EXPERIMENTAL_STATUS_LABEL[session.status] ?? session.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </Panel>
          ))}
        </section>

        {/* RETORNOS */}
        <section aria-labelledby="retornos" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="retornos" className="text-lg font-semibold">
              Retornos para fazer
            </h2>

            <Link to="/admin/follow-ups" className="text-sm font-semibold text-muted hover:text-ink">
              Ver todos
            </Link>
          </div>

          <Panel>
            {data.followUpsDue.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">Nenhum retorno para hoje.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.followUpsDue.slice(0, 8).map((contact) => {
                  const whatsappUrl = createWhatsAppUrl(contact.phone);
                  const late = daysLate(contact.follow_up_date, data.today);
                  const urgency = late > 0 ? "alert" : "attention";
                  const name = contact.child_name || contact.responsible_name || "Sem nome";

                  return (
                    <li key={contact.id} className={`flex items-center gap-3 px-4 py-2.5 ${urgencyRail(urgency)}`}>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/contacts/${contact.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {name}
                        </Link>

                        <p className="text-sm">
                          <span className={urgencyText(urgency)}>
                            {late > 0
                              ? `Atrasado há ${late} ${late === 1 ? "dia" : "dias"}`
                              : "Para hoje"}
                          </span>
                          {contact.category?.name && (
                            <span className="text-muted">, {contact.category.name}</span>
                          )}
                        </p>
                      </div>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp de ${name}`}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-whatsapp hover:border-whatsapp"
                        >
                          <MessageCircle size={18} aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {(data.followUpsDue.length > 8 || data.followUpsUpcoming > 0) && (
              <p className="border-t border-line px-4 py-3 text-sm text-muted">
                {data.followUpsDue.length > 8 && `Mais ${data.followUpsDue.length - 8} atrasados. `}
                {data.followUpsUpcoming > 0 &&
                  `${data.followUpsUpcoming} nos próximos 7 dias.`}
              </p>
            )}
          </Panel>
        </section>
      </div>

      {/* RESULTADO DO MÊS */}
      <MonthResult month={data.month} previous={data.previousMonth} />
    </div>
  );
}

function Delta({ current, previous }) {
  const diff = current - previous;

  if (!diff) return <span className="text-sm text-muted">igual ao mês anterior</span>;

  return (
    <span className={`text-sm ${diff > 0 ? "text-ok" : "text-alert-text"}`}>
      {diff > 0 ? "+" : "−"}
      {Math.abs(diff)} que o mês anterior
    </span>
  );
}

function MonthResult({ month, previous }) {
  const steps = [
    { key: "leads", label: "Novos contatos" },
    { key: "scheduled", label: "Experimentais" },
    { key: "attended", label: "Compareceram" },
    { key: "enrolled", label: "Matrículas" },
  ];

  const maxSource = month.sources[0]?.count ?? 0;

  return (
    <section aria-labelledby="resultado" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="resultado" className="text-lg font-semibold">
          Resultado de {monthName(month.key)}
        </h2>

        <Link to="/admin/reports" className="text-sm font-semibold text-muted hover:text-ink">
          Relatórios
        </Link>
      </div>

      <Panel className="grid gap-6 p-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <dl className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {steps.map((step) => (
              <div key={step.key}>
                <dt className="text-sm text-muted">{step.label}</dt>
                <dd className="font-display text-4xl font-semibold leading-tight tabular-nums">
                  {month[step.key]}
                </dd>
                <dd>
                  <Delta current={month[step.key]} previous={previous[step.key]} />
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-sm text-muted">
            Conversão (matrículas sobre quem compareceu):{" "}
            <strong className="text-ink">
              {month.conversion === null ? "sem dados" : `${month.conversion}%`}
            </strong>
            {previous.conversion !== null && `. No mês anterior: ${previous.conversion}%.`}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">De onde vieram os contatos</h3>

          {month.sources.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum contato novo neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {month.sources.slice(0, 5).map((source) => (
                <li key={source.label}>
                  <div className="flex justify-between text-sm">
                    <span>{source.label}</span>
                    <span className="font-semibold tabular-nums">{source.count}</span>
                  </div>

                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${(source.count / maxSource) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </section>
  );
}
