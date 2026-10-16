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
  AlertCircle,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
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

  const filteredContacts = useMemo(() => {
  if (period === "all") {
    return contacts;
  }

  const limit = new Date();

  limit.setDate(
    limit.getDate() - Number(period)
  );

  limit.setHours(0, 0, 0, 0);

  return contacts.filter((contact) => {
    let contactDate = null;

    if (contact.first_contact_at) {
      contactDate = new Date(
        `${contact.first_contact_at}T00:00:00`
      );
    } else if (contact.created_at) {
      contactDate = new Date(
        contact.created_at
      );
    }

    if (!contactDate) {
      return false;
    }

    return contactDate >= limit;
  });
}, [contacts, period]);

  const report = useMemo(
    () => buildReport(filteredContacts),
    [filteredContacts]
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-500">
        Carregando relatórios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">
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
    <div className="space-y-10">
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-5
          xl:flex-row
          xl:items-end
          xl:justify-between
        "
      >
        <SectionTitle
          title="Relatórios"
          description="Acompanhe aquisição, conversão e oportunidades comerciais."
        />

        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                setPeriod(item.value)
              }
              className={`
                rounded-xl
                px-4
                py-2
                text-sm
                font-semibold
                transition
                ${
                  period === item.value
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRINCIPAIS INDICADORES */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
      </div>

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

          <div className="mt-7 rounded-2xl bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <p className="text-xs leading-5 text-amber-800">
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

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Potencial aberto
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  Oportunidades não encerradas
                </p>
              </div>

              <strong className="text-4xl font-bold text-neutral-900">
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
  icon: Icon,
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            {title}
          </p>

          <p className="mt-3 text-4xl font-bold text-neutral-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-neutral-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-inter-red">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ReportBox({
  title,
  description,
  children,
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7">
      <h3 className="text-lg font-bold text-neutral-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-neutral-500">
        {description}
      </p>

      <div className="mt-7">
        {children}
      </div>
    </div>
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
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-neutral-700">
            {label}
          </span>

          {helper && (
            <p className="mt-1 text-xs text-neutral-400">
              {helper}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <strong className="text-lg text-neutral-900">
            {value}
          </strong>

          <span className="w-12 text-right text-xs font-semibold text-neutral-500">
            {valuePercentage}%
          </span>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-inter-red transition-all"
          style={{
            width: `${Math.min(
              valuePercentage,
              100
            )}%`,
          }}
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
    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4">
      <span className="text-sm font-medium text-neutral-600">
        {label}
      </span>

      <strong className="text-xl text-neutral-900">
        {value}
      </strong>
    </div>
  );
}

function Ranking({
  items,
  empty,
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center">
        <p className="text-sm text-neutral-400">
          {empty}
        </p>
      </div>
    );
  }

  const maximum =
    items[0]?.value || 1;

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const width =
          (item.value / maximum) *
          100;

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-neutral-700">
                {item.label}
              </span>

              <strong className="text-sm text-neutral-900">
                {item.value}
              </strong>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-inter-red"
                style={{
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmallMetric({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
        <Icon size={21} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold text-neutral-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-neutral-400">
          {description}
        </p>
      </div>
    </div>
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