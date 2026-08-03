import { WEEKDAY_LABEL } from "../../../utils/generateAvailableDates";

const SOURCE_LABEL = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  whatsapp: "WhatsApp",
  event: "Evento",
  walk_in: "Passou em frente à escola",
  other: "Outro",
};

const POSITION_LABEL = {
  goalkeeper: "Goleiro",
  fixo: "Fixo",
  ala: "Ala",
  pivo: "Pivô",
};

export default function ReviewCard({
  form,
  onBack,
  onFinish,
}) {
  const formatTime = (time) => time?.slice(0, 5);

  function formatBirthDate(dateString) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatExperimentalDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const isWaitingList =
    form.category?.trial_status === "waiting_list";

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          Revise sua solicitação
        </h2>

        <p className="mt-2 max-w-2xl text-neutral-500">
Confira se todas as informações estão corretas antes de confirmar sua solicitação.        </p>
      </div>

      {/* ATLETA */}
      <Section title="Atleta">

        <Info
          label="Nome"
          value={form.child_name}
        />

        <Info
          label="Nascimento"
          value={formatBirthDate(form.birth_date)}
        />

        <Info
          label="Categoria"
          value={form.category?.name}
          highlight
        />

<Info
  label="Já treinou anteriormente"
  value={form.trained_elsewhere ? "Sim" : "Não"}
/>

{form.trained_elsewhere && form.previous_club && (
  <Info
    label="Treinou anteriormente em"
    value={form.previous_club}
  />
)}

{form.preferred_position && (
  <Info
    label="Posição preferida"
    value={
  POSITION_LABEL[form.preferred_position] ??
  form.preferred_position
}
  />
)}

      </Section>

      {/* AULA EXPERIMENTAL */}
      {!isWaitingList && (
        <Section title="Aula Experimental">

          <Info
            label="Data"
            value={formatExperimentalDate(
              form.experimental_date
            )}
          />

          <Info
  label="Horário"
  value={
    form.category
      ? `${WEEKDAY_LABEL[form.category.weekday]} • ${formatTime(
          form.category.start_time
        )} às ${formatTime(form.category.end_time)}`
      : "-"
  }
/>

        </Section>
      )}

      {/* LISTA DE INTERESSE */}
      {isWaitingList && (
        <Section title="Turma">

          <Info
            label="Categoria"
            value={form.category?.name}
          />

          <Info
            label="Situação"
            value="Nova turma em formação"
            highlight
          />

        </Section>
      )}

      {/* RESPONSÁVEL */}
      <Section title="Responsável">

        <Info
          label="Nome"
          value={form.responsible_name}
        />

        <Info
          label="WhatsApp"
          value={form.phone}
        />

        {form.email && (
          <Info
            label="E-mail"
            value={form.email}
          />
        )}

        {form.neighborhood && (
          <Info
            label="Bairro"
            value={form.neighborhood}
          />
        )}

        {form.source && (
  <Info
    label="Como conheceu a escola"
    value={SOURCE_LABEL[form.source]}
  />
)}



      </Section>

      {/* OBSERVAÇÕES */}
      {form.coach_notes && (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">

    <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
      Informações importantes para o professor
    </p>

    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
      {form.coach_notes}
    </p>

  </div>
)}

   <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-5">

  <p className="text-sm leading-relaxed text-neutral-600">
    {isWaitingList
      ? "Seu interesse será registrado e nossa equipe entrará em contato assim que houver uma nova turma disponível para esta categoria."
      : "Após finalizar, nossa equipe receberá sua solicitação e entrará em contato pelo WhatsApp para confirmar a aula experimental."}
  </p>

</div>

      {/* BOTÕES */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 sm:w-auto"
        >
          {isWaitingList
            ? "Registrar interesse"
            : "Confirmar solicitação"}
        </button>

      </div>

    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      {/* Título */}
      <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">

        <h3 className="text-base font-bold text-neutral-900">
          {title}
        </h3>

      </div>

      {/* Informações */}
      <div className="divide-y divide-neutral-100 px-5 sm:px-6">
        {children}
      </div>

    </section>
  );
}

function Info({
  label,
  value,
  highlight = false,
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-4">

      <p className="shrink-0 text-sm text-neutral-500">
        {label}
      </p>

      <p
        className={`min-w-0 max-w-[65%] break-all text-right text-sm font-semibold ${
          highlight
            ? "text-red-600"
            : "text-neutral-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}