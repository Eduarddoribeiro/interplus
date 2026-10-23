import {
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  Users,
  CalendarDays,
  UserCheck,
  GraduationCap,
  TrendingUp,
  Clock3,
  Target,
  Info,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Panel, Tabs } from "../ui";
import { getReportsData } from "../../services/reports";
import { WAITING_REASON_LABELS } from "../../constants/waitingListReasons";

const PERIODS = [
  {
    value: "30",
    label: "30 dias",
  },
  {
    value: "90",
    label: "90 dias",
  },
  {
    value: "365",
    label: "12 meses",
  },
  {
    value: "all",
    label: "Todo período",
  },
];

const SOURCE_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  franchisor_site: "Site da Franqueadora",
  unit_site: "Site da Unidade",
  referral: "Indicação",
  presential: "Presencial",
  facebook: "Facebook",
  google: "Google",
  other: "Outro",
};



const LOST_LABELS = {
  no_response: "Não respondeu",
  price: "Preço",
  schedule: "Horário",
  distance: "Distância",
  chose_competitor: "Escolheu outra escola",
  no_interest: "Sem interesse",
  other: "Outro",
};

export default function Reports() {
  const [contacts, setContacts] = useState([]);
  const [period, setPeriod] = useState("all");
  const [location, setLocation] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const data = await getReportsData();

      setContacts(data);
    } catch (err) {
      console.error(
        "Erro ao carregar relatórios:",
        err
      );

      setError(
        "Não foi possível carregar os relatórios."
      );
    } finally {
      setLoading(false);
    }
  }

  // Locais presentes nos contatos (Krahe, Biguá...)
  const locations = useMemo(() => {
    const map = new Map();

    contacts.forEach((contact) => {
      if (contact.location?.id) {
        map.set(String(contact.location.id), contact.location.name);
      }
    });

    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const byLocation =
      location === "all"
        ? contacts
        : contacts.filter((contact) =>
            location === "none"
              ? !contact.location_id
              : String(contact.location_id) === location
          );

    if (period === "all") {
      return byLocation;
    }

    const limit = new Date();

    limit.setDate(
      limit.getDate() - Number(period)
    );

    limit.setHours(0, 0, 0, 0);

    return byLocation.filter((contact) => {
      const raw =
        contact.first_contact_at ||
        contact.created_at;

      if (!raw) {
        return false;
      }

      // Data pura ("2026-10-18") ou data com hora
      const contactDate = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(`${raw}T00:00:00`)
        : new Date(raw);

      return contactDate >= limit;
    });
  }, [contacts, period, location]);

  const report = useMemo(
    () => buildReport(filteredContacts),
    [filteredContacts]
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-muted">
        Carregando relatórios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-alert/30 bg-alert-soft p-6">
        <p className="font-semibold text-alert-text">
          {error}
        </p>

        <button
          type="button"
          onClick={loadReports}
          className="mt-4 rounded-xl bg-inter-red px-5 py-3 font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <SectionTitle
        title="Relatórios"
        actions={
          locations.length > 0 && (
            <select
              aria-label="Local"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus:border-ink"
            >
              <option value="all">Todos os locais</option>

              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}

              <option value="none">Sem local definido</option>
            </select>
          )
        }
      />

      <Tabs label="Período" value={period} onChange={setPeriod} items={PERIODS} />

      {/* PRINCIPAIS INDICADORES */}

      <Panel as="dl" className="grid grid-cols-2 gap-px overflow-hidden bg-line xl:grid-cols-4">
        <MetricCard
          title="Contatos"
          value={report.total}
          subtitle="No período selecionado"
          icon={Users}
        />

        <MetricCard
          title="Experimentais"
          value={report.experimentals}
          subtitle="Aulas registradas"
          icon={CalendarDays}
        />

        <MetricCard
          title="Compareceram"
          value={report.attended}
          subtitle="Presenças registradas"
          icon={UserCheck}
        />

        <MetricCard
          title="Matrículas"
          value={report.enrolled}
          subtitle="Total registrado"
          icon={GraduationCap}
        />
      </Panel>

      {/* FUNIL + OPORTUNIDADES */}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <ReportBox
          title="Funil comercial"
          description="Conversão entre cada etapa da jornada comercial."
        >
          <div className="space-y-6">
            <FunnelRow
              label="Contatos"
              value={report.total}
              percentage={100}
              helper="Base de contatos do período"
            />

            <FunnelRow
              label="Experimentais agendados"
              value={report.experimentals}
              percentage={percentage(
                report.experimentals,
                report.total
              )}
              helper={`${percentage(
                report.experimentals,
                report.total
              )}% dos contatos chegaram ao agendamento`}
            />

            <FunnelRow
              label="Compareceram"
              value={report.attended}
              percentage={percentage(
                report.attended,
                report.experimentals
              )}
              helper={`${percentage(
                report.attended,
                report.experimentals
              )}% dos experimentais compareceram`}
            />

            <FunnelRow
              label="Matricularam"
              value={
                report.enrolledAfterExperimental
              }
              percentage={percentage(
                report.enrolledAfterExperimental,
                report.attended
              )}
              helper={`${percentage(
                report.enrolledAfterExperimental,
                report.attended
              )}% dos que compareceram se matricularam`}
            />
          </div>

          <div className="mt-7 rounded-lg bg-canvas p-4">
            <div className="flex gap-3">
              <Info
                size={18}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-muted"
              />

              <p className="text-sm leading-6 text-muted">
                Matrículas históricas sem experimental
                registrada não entram na conversão
                pós-aula. Assim, os dados importados não
                distorcem a taxa comercial.
              </p>
            </div>
          </div>
        </ReportBox>

        <ReportBox
          title="Oportunidades abertas"
          description="Famílias que ainda podem avançar."
        >
          <div className="space-y-3">
            <Opportunity
              label="Novos contatos"
              value={report.newContacts}
            />

            <Opportunity
              label="Retornos"
              value={report.followUps}
            />

            <Opportunity
              label="Lista de interesse"
              value={report.waitingList}
            />

            <Opportunity
              label="Experimentais ativos"
              value={
                report.activeExperimentals
              }
            />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-muted">
                  Potencial aberto
                </p>

                <p className="mt-1 text-sm text-muted">
                  Oportunidades não encerradas
                </p>
              </div>

              <strong className="text-4xl font-bold text-ink">
                {report.openOpportunities}
              </strong>
            </div>
          </div>
        </ReportBox>
      </div>

      {/* ORIGEM + CATEGORIAS */}

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBox
          title="Origem dos contatos"
          description="De onde chegam as oportunidades."
        >
          <Ranking
            items={report.sources}
            empty="Ainda não existem origens registradas."
          />
        </ReportBox>

        <ReportBox
          title="Demanda por categoria"
          description="Categorias com maior volume de contatos."
        >
          <Ranking
            items={report.categories}
            empty="Nenhuma categoria registrada."
          />
        </ReportBox>
      </div>

      {/* INTERESSE + PERDAS */}

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBox
          title="Lista de interesse"
          description="Motivos das famílias que estão aguardando."
        >
          <Ranking
            items={report.waitingReasons}
            empty="Nenhum contato em lista de interesse."
          />
        </ReportBox>

        <ReportBox
          title="Motivos de perda"
          description="Por que oportunidades não avançaram."
        >
          <Ranking
            items={report.lostReasons}
            empty="Nenhum motivo de perda registrado."
          />
        </ReportBox>
      </div>

      {/* INDICADORES SECUNDÁRIOS */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <SmallMetric
          icon={TrendingUp}
          label="Conversão pós-experimental"
          value={`${percentage(
            report.enrolledAfterExperimental,
            report.attended
          )}%`}
          description="Matrículas entre quem compareceu"
        />

        <SmallMetric
          icon={Target}
          label="Comparecimento"
          value={`${percentage(
            report.attended,
            report.experimentals
          )}%`}
          description="Presenças sobre experimentais"
        />

        <SmallMetric
          icon={Clock3}
          label="Em acompanhamento"
          value={
            report.followUps +
            report.waitingList
          }
          description="Retornos + lista de interesse"
        />
      </div>
    </div>
  );
}

/* =========================
   CÁLCULO DO RELATÓRIO
========================= */

function buildReport(contacts) {
  const total = contacts.length;

  /*
   * Qualquer contato com data de experimental
   * registrada conta como experimental agendado.
   */
  const experimentals = contacts.filter(
    (contact) =>
      Boolean(contact.experimental_date)
  ).length;

  /*
   * Comparecimento.
   *
   * Só entra aqui quem possui uma experimental
   * registrada e evidência de que compareceu.
   *
   * Não consideramos automaticamente todo
   * "enrolled" como presença, pois existem
   * matrículas históricas importadas.
   */
  const attended = contacts.filter(
    (contact) => {
      if (!contact.experimental_date) {
        return false;
      }

      return (
        contact.status === "attended" ||
        contact.experimental_result ===
          "enrolled" ||
        contact.experimental_result ===
          "follow_up" ||
        contact.experimental_result ===
          "lost"
      );
    }
  ).length;

  /*
   * Total de matrículas existentes.
   *
   * Inclui matrículas históricas importadas.
   * Serve como indicador absoluto.
   */
  const enrolled = contacts.filter(
    (contact) =>
      contact.status === "enrolled"
  ).length;

  /*
   * Matrículas atribuíveis a uma experimental
   * registrada no CRM.
   *
   * É esse número que usamos para calcular
   * conversão pós-experimental.
   */
  const enrolledAfterExperimental =
    contacts.filter((contact) => {
      if (!contact.experimental_date) {
        return false;
      }

      return (
        contact.experimental_result ===
          "enrolled" ||
        contact.status === "enrolled"
      );
    }).length;

  /*
   * Novos contatos ainda sem avanço
   * para outra etapa do funil.
   */
  const newContacts = contacts.filter(
    (contact) =>
      contact.status === "new_contact"
  ).length;

  /*
   * Contatos com retorno programado.
   */
  const followUps = contacts.filter(
    (contact) =>
      contact.status === "follow_up"
  ).length;

  /*
   * Famílias aguardando vaga,
   * horário ou abertura de turma.
   */
  const waitingList = contacts.filter(
    (contact) =>
      contact.status === "waiting_list"
  ).length;

  /*
   * Experimentais ainda em andamento:
   * aguardando confirmação ou confirmados.
   */
  const activeExperimentals =
    contacts.filter((contact) =>
      [
        "pending_confirmation",
        "confirmed",
      ].includes(contact.status)
    ).length;

  /*
   * Todas as oportunidades que ainda
   * não foram encerradas comercialmente.
   */
  const openOpportunities =
    newContacts +
    followUps +
    waitingList +
    activeExperimentals;

  return {
    total,
    experimentals,
    attended,
    enrolled,
    enrolledAfterExperimental,
    newContacts,
    followUps,
    waitingList,
    activeExperimentals,
    openOpportunities,

    sources: groupRanking(
      contacts.filter(
        (contact) => contact.source
      ),
      (contact) =>
        SOURCE_LABELS[contact.source] ||
        contact.source
    ),

    categories: groupRanking(
      contacts.filter(
        (contact) =>
          contact.category?.name
      ),
      (contact) =>
        contact.category.name
    ),

    waitingReasons: groupRanking(
      contacts.filter(
        (contact) =>
          contact.status ===
            "waiting_list" &&
          contact.waiting_list_reason
      ),
      (contact) =>
        WAITING_REASON_LABELS[contact.waiting_list_reason]||
        contact.waiting_list_reason
    ),

    lostReasons: groupRanking(
      contacts.filter(
        (contact) =>
          contact.status === "lost" &&
          contact.lost_reason
      ),
      (contact) =>
        LOST_LABELS[
          contact.lost_reason
        ] ||
        contact.lost_reason
    ),
  };
}

/* =========================
   AGRUPAMENTO
========================= */

function groupRanking(
  items,
  getLabel
) {
  const groups = {};

  items.forEach((item) => {
    const label =
      getLabel(item) ||
      "Não informado";

    groups[label] =
      (groups[label] || 0) + 1;
  });

  return Object.entries(groups)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort(
      (a, b) =>
        b.value - a.value
    );
}

/* =========================
   COMPONENTES
========================= */

function MetricCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="text-sm text-muted">{title}</dt>
      <dd className="font-display text-5xl font-semibold leading-tight tabular-nums">{value}</dd>
      <dd className="text-sm text-muted">{subtitle}</dd>
    </div>
  );
}

function ReportBox({
  title,
  description,
  children,
}) {
  return (
    <Panel className="p-5">
      <h3 className="font-semibold">{title}</h3>

      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}

      <div className="mt-5">{children}</div>
    </Panel>
  );
}

function FunnelRow({
  label,
  value,
  percentage: valuePercentage,
  helper,
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-semibold">{label}</span>

          {helper && <p className="text-sm text-muted">{helper}</p>}
        </div>

        <div className="flex shrink-0 items-baseline gap-3 tabular-nums">
          <strong className="text-lg">{value}</strong>
          <span className="w-12 text-right text-sm text-muted">{valuePercentage}%</span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-ink"
          style={{ width: `${Math.min(valuePercentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Opportunity({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <span className="text-sm">{label}</span>
      <strong className="text-lg tabular-nums">{value}</strong>
    </div>
  );
}

function Ranking({
  items,
  empty,
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  }

  const maximum = items[0]?.value || 1;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
            <span>{item.label}</span>
            <strong className="tabular-nums">{item.value}</strong>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(item.value / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallMetric({
  label,
  value,
  description,
}) {
  return (
    <Panel className="px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-4xl font-semibold leading-tight tabular-nums">{value}</p>
      <p className="text-sm text-muted">{description}</p>
    </Panel>
  );
}

function percentage(
  value,
  total
) {
  if (!total) {
    return 0;
  }

  return Math.round(
    (value / total) * 100
  );
}