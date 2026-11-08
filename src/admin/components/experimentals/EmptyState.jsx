
import { formatShortDate } from "../../../helpers/experimentalDates";

export default function EmptyState({ filter }) {
  if (
    filter?.startsWith("day:")
  ) {
    const selectedDate =
      filter.replace("day:", "");

    return (
      <div className="rounded-xl border border-line bg-white px-6 py-10 text-center">
        <h3 className="font-semibold">
          Nenhuma experimental neste dia
        </h3>

        <p className="mt-1 text-sm text-muted">
          Não existem aulas experimentais
          em{" "}
          {formatShortDate(
            selectedDate
          )}
          .
        </p>
      </div>
    );
  }

  const messages = {
    today: {
      title:
        "Nenhuma experimental hoje",
      description:
        "Não existem aulas experimentais na agenda de hoje.",
    },

    week: {
      title:
        "Nenhuma experimental nesta semana",
      description:
        "Não existem aulas experimentais na semana selecionada.",
    },

    future: {
      title:
        "Nenhuma aula futura",
      description:
        "Não existem aulas experimentais futuras agendadas.",
    },

    history: {
      title:
        "Nenhum histórico encontrado",
      description:
        "Ainda não existem experimentais anteriores registradas.",
    },

    no_result: {
      title:
        "Nenhum resultado pendente",
      description:
        "Todas as famílias que vieram na experimental já têm uma decisão registrada.",
    },

    overdue: {
      title:
        "Nenhuma presença pendente",
      description:
        "Todas as experimentais que já passaram têm 'compareceu' ou 'não compareceu'.",
    },
  };

  const content =
    messages[filter] ||
    messages.today;

  return (
    <div className="rounded-xl border border-line bg-white px-6 py-10 text-center">
      <h3 className="font-semibold">
        {content.title}
      </h3>

      <p className="mt-1 text-sm text-muted">
        {content.description}
      </p>
    </div>
  );
}
