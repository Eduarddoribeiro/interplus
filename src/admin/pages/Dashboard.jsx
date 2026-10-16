import { useEffect, useState } from "react";

import {
  CalendarDays,
  CircleHelp,
  GraduationCap,
  PhoneCall,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/common/StatCard";
import SectionTitle from "../components/common/SectionTitle";
import ExperimentalCard from "../components/dashboard/ExperimentalCard";
import FollowUpCard from "../components/dashboard/FollowUpCard";

import { getDashboardData } from "../../services/dashboard";

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

      const dashboardData = await getDashboardData();

      setData(dashboardData);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);

      setError("Não foi possível carregar a visão geral.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-500">
        Carregando visão geral...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          {error}
        </p>

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

  const stats = [
    {
      title: "Experimentais Hoje",
      value: data.stats.todayExperimentals,
      subtitle: "Agendadas para hoje",
      icon: CalendarDays,
    },
    {
      title: "Aguardando Confirmação",
      value: data.stats.pendingConfirmation,
      subtitle: "Precisam de contato",
      icon: CircleHelp,
    },
    {
      title: "Retornos Pendentes",
      value: data.stats.pendingFollowUps,
      subtitle: "Precisam de atenção",
      icon: PhoneCall,
    },
    {
      title: "Matrículas no Mês",
      value: data.stats.monthEnrollments,
      subtitle: "Conversões no mês",
      icon: GraduationCap,
    },
  ];

  return (
    <>
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Visão Geral"
          description="Veja o que precisa da sua atenção hoje."
        />

        <button
          type="button"
          onClick={loadDashboard}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-50"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* INDICADORES */}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            {...item}
          />
        ))}
      </div>

      {/* ÁREA OPERACIONAL */}

      <div className="mt-14 grid gap-10 lg:grid-cols-2">

        {/* AGENDA */}

        <section>
          <SectionTitle
            title="Agenda de Hoje"
            description="Aulas experimentais programadas para hoje."
          />

          <div className="space-y-5">
            {data.todayExperimentals.length > 0 ? (
              data.todayExperimentals.map((item) => (
                <ExperimentalCard
                  key={item.id}
                  {...item}
                />
              ))
            ) : (
              <EmptyMessage>
                Nenhuma aula experimental agendada para hoje.
              </EmptyMessage>
            )}
          </div>
        </section>

        {/* RETORNOS */}

        <section>
          <SectionTitle
            title="Retornos Pendentes"
            description="Famílias que precisam de acompanhamento."
          />

          <div className="space-y-5">
            {data.followUps.length > 0 ? (
              data.followUps.map((item) => (
                <FollowUpCard
                  key={item.id}
                  {...item}
                />
              ))
            ) : (
              <EmptyMessage>
                Nenhum retorno pendente. Tudo em dia.
              </EmptyMessage>
            )}
          </div>
        </section>

      </div>
    </>
  );
}

function EmptyMessage({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
      <p className="text-sm text-neutral-500">
        {children}
      </p>
    </div>
  );
}