import { WEEKDAY_LABELS } from "../../../constants/weekdays";

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

  return (
    <div className="space-y-6">

            {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          {form.interest_reason
            ? "Revise seus dados"
            : "Revise sua solicitação"}
        </h2>

        <p className="mt-2 max-w-2xl text-neutral-500">
          {form.interest_reason
            ? "Confira se todas as informações estão corretas antes de entrar na lista de interesse."
            : "Confira se todas as informações estão corretas antes de confirmar sua solicitação."}
        </p>
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

            {/* AULA EXPERIMENTAL / LISTA DE INTERESSE */}
      {form.interest_reason ? (
        <Section title="Lista de Interesse">

          <Info
            label="Local de preferência"
            value={form.preferred_location?.name || "Qualquer local"}
          />

          <Info
            label="Turno de preferência"
            value={
              {
                morning: "Manhã",
                afternoon: "Tarde",
                evening: "Noite",
                any: "Indiferente",
              }[form.preferred_shift] || "-"
            }
          />

        </Section>
      ) : (
        <Section title="Aula Experimental">

          <Info
            label="Modalidade"
            value={form.modality?.name}
          />

          <Info
            label="Local"
            value={form.location?.name}
          />

          <Info
            label="Turma"
            value={form.training_group?.name}
          />

          <Info
            label="Horário"
            value={
              form.schedule
                ? `${WEEKDAY_LABELS[form.schedule.weekday]} • ${formatTime(
                    form.schedule.start_time
                  )} às ${formatTime(form.schedule.end_time)}`
                : "-"
            }
          />

          <Info
            label="Data"
            value={formatExperimentalDate(
              form.experimental_date
            )}
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
      {form.interest_reason
        ? form.observations && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                Observações
              </p>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                {form.observations}
              </p>

            </div>
          )
        : form.coach_notes && (
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
    {form.interest_reason
      ? "Após finalizar, você entrará em nossa lista de interesse e avisaremos pelo WhatsApp assim que houver disponibilidade."
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
          {form.interest_reason
            ? "Entrar na lista de interesse"
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