import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Loader2, Lock } from "lucide-react";

import { getEnrollmentForm, submitEnrollmentForm } from "../services/enrollmentForms";
import { buildPayload, initialForm, maskCep, maskCpf, maskPhone, validateStep } from "../helpers/enrollmentForm";
import {
  BLOOD_TYPE_OPTIONS,
  DUE_DAY_OPTIONS,
  GENDER_OPTIONS,
  HEALTH_QUESTIONS,
  HOW_FOUND_OPTIONS,
  HEALTH_TEXT,
  PURPOSE_ACCEPT,
  PURPOSE_TEXT,
  SCHOOL_TYPE_OPTIONS,
  STATE_OPTIONS,
  UNIFORM_SIZE_OPTIONS,
  UNIFORM_SIZES,
} from "../constants/enrollmentForm";
import { getTodayISO } from "../helpers/contactPresentation";
import { errorMessage } from "../helpers/errorMessage";
import { BRAND } from "../constants/brand";

const STEPS = [
  { value: "student", label: "Aluno" },
  { value: "guardians", label: "Responsáveis" },
  { value: "health", label: "Saúde" },
  { value: "confirm", label: "Enviar" },
];

const LINK_PROBLEM = {
  invalid: "Este link não é válido.",
  replaced: "A escola enviou um link mais novo. Use o da mensagem mais recente.",
  used: "Este formulário já foi enviado. Obrigado!",
  expired: "Este link venceu.",
};

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-neutral-500 focus:border-ink focus:outline-none focus:ring-2 focus:ring-neutral-200 aria-[invalid=true]:border-alert";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) : "";

const fieldId = (key) => `campo-${key.replace(/\./g, "-")}`;

/*
 * Ficha de matrícula que a família preenche pelo link individual
 * (sem login). Quatro etapas curtas, pensadas para o celular.
 */
export default function EnrollmentForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sent, setSent] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getEnrollmentForm(token);
        if (data?.status !== "ok") {
          setProblem(LINK_PROBLEM[data?.status] ?? LINK_PROBLEM.invalid);
          return;
        }
        setInfo(data);
        setForm(initialForm(data));
      } catch (err) {
        console.error("Erro ao abrir o formulário:", err);
        setProblem(errorMessage(err, "Não foi possível abrir o formulário. Confira a internet e tente de novo."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  // Avisa antes de sair com o formulário pela metade
  useEffect(() => {
    if (!form || sent) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, sent]);

  function update(path, value) {
    setForm((current) => {
      const next = structuredClone(current);
      const keys = path.split(".");
      let target = next;
      keys.slice(0, -1).forEach((key) => {
        target = target[key];
      });
      target[keys.at(-1)] = value;
      return next;
    });

    if (errors[path]) setErrors(({ [path]: _removed, ...rest }) => rest);
  }

  function goTo(index) {
    setStep(index);
    setErrors({});
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  }

  function next(event) {
    event.preventDefault();

    const found = validateStep(STEPS[step].value, form, getTodayISO());
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }

    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }

    send();
  }

  async function send() {
    try {
      setSending(true);
      setSendError("");
      await submitEnrollmentForm(token, buildPayload(form));
      setSent(true);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
    } catch (err) {
      console.error("Erro ao enviar a matrícula:", err);
      setSendError(errorMessage(err, "Não foi possível enviar. Confira a internet e toque em Enviar de novo."));
    } finally {
      setSending(false);
    }
  }

  const studentName = form?.student.name.trim().split(/\s+/)[0] || "o aluno";
  const field = (key, props = {}) => ({
    id: fieldId(key),
    error: errors[key],
    ...props,
  });

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header ref={topRef} className="scroll-mt-0 border-b border-line bg-white">
        <div className="mx-auto max-w-lg px-4 pb-4 pt-5">
          <img
            src={BRAND.logo}
            alt={BRAND.logoAlt}
            width={112}
            height={46}
            className="h-auto w-28"
          />

          <h1 className="mt-4 font-display text-[2.4rem] font-semibold leading-[0.9]">Ficha de matrícula</h1>

          {info && !sent && (
            <>
              <p className="mt-1.5 text-sm text-muted">
                {[info.student?.name, info.category].filter(Boolean).join(", ")}. O link vale até{" "}
                {formatDate(info.expires_at)}.
              </p>

              <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Etapas">
                {STEPS.map((item, index) => (
                  <li key={item.value} aria-current={index === step ? "step" : undefined}>
                    <span className={`block h-1.5 rounded-full ${index <= step ? "bg-ink" : "bg-line"}`} />
                    <span className={`mt-1 block text-xs ${index === step ? "font-semibold text-ink" : "text-muted"}`}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-5">
        {loading && (
          <p role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            Abrindo o formulário…
          </p>
        )}

        {!loading && problem && (
          <div role="alert" className="rounded-xl border border-line bg-white p-5 text-center">
            <p className="font-semibold">{problem}</p>
            <p className="mt-1 text-sm text-muted">Se precisar, peça um novo link à escola pelo WhatsApp.</p>
          </div>
        )}

        {sent && (
          <div role="status" className="rounded-xl border border-line bg-white p-6 text-center">
            <CheckCircle2 size={36} aria-hidden="true" className="mx-auto text-ok" />
            <p className="mt-3 text-lg font-semibold">Matrícula enviada. Obrigado!</p>
            <p className="mt-1 text-sm text-muted">
              A escola vai conferir os dados e falar com você pelo WhatsApp sobre o contrato e o uniforme.
            </p>
          </div>
        )}

        {form && !sent && (
          <form onSubmit={next} noValidate className="space-y-5">
            {step === 0 && (
              <>
                <Section title="Dados do aluno">
                  <TextField
                    label="Nome completo do aluno"
                    autoComplete="off"
                    value={form.student.name}
                    onChange={(value) => update("student.name", value)}
                    {...field("student.name", { required: true })}
                  />
                  <TextField
                    label="Data de nascimento"
                    type="date"
                    value={form.student.birth_date}
                    onChange={(value) => update("student.birth_date", value)}
                    {...field("student.birth_date", { required: true })}
                  />
                  <Choice
                    label="Sexo"
                    options={GENDER_OPTIONS}
                    value={form.student.gender}
                    onChange={(value) => update("student.gender", value)}
                    {...field("student.gender", { required: true })}
                  />
                  <TextField
                    label="CPF do aluno"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.student.cpf}
                    onChange={(value) => update("student.cpf", maskCpf(value))}
                    {...field("student.cpf", { required: true })}
                  />
                  <TextField
                    label="RG do aluno"
                    hint="Se tiver."
                    value={form.student.rg}
                    onChange={(value) => update("student.rg", value)}
                    {...field("student.rg")}
                  />
                  <TextField
                    label="Celular do aluno"
                    hint="Se tiver."
                    type="tel"
                    inputMode="tel"
                    placeholder="(51) 99999-9999"
                    value={form.student.phone}
                    onChange={(value) => update("student.phone", maskPhone(value))}
                    {...field("student.phone")}
                  />
                </Section>

                <Section title="Escola">
                  <TextField
                    label="Escola onde estuda"
                    value={form.student.school}
                    onChange={(value) => update("student.school", value)}
                    {...field("student.school", { required: true })}
                  />
                  <Choice
                    label="Instituição"
                    options={SCHOOL_TYPE_OPTIONS}
                    value={form.student.school_type}
                    onChange={(value) => update("student.school_type", value)}
                    {...field("student.school_type", { required: true })}
                  />
                </Section>

                <Section title="Futebol">
                  <TextField
                    label="Qual posição que atua?"
                    value={form.student.field_position}
                    onChange={(value) => update("student.field_position", value)}
                    {...field("student.field_position")}
                  />
                  <TextField
                    label="Qual time?"
                    value={form.student.club_team}
                    onChange={(value) => update("student.club_team", value)}
                    {...field("student.club_team")}
                  />
                  <TextField
                    label="Qual jogador atual preferido?"
                    value={form.student.favorite_player}
                    onChange={(value) => update("student.favorite_player", value)}
                    {...field("student.favorite_player")}
                  />
                  <TextField
                    label="Qual ídolo?"
                    value={form.student.idol}
                    onChange={(value) => update("student.idol", value)}
                    {...field("student.idol")}
                  />
                  <SelectField
                    label="Como nos conheceu?"
                    options={HOW_FOUND_OPTIONS}
                    value={form.student.how_found}
                    onChange={(value) => update("student.how_found", value)}
                    {...field("student.how_found")}
                  />
                </Section>

                <Section title="Uniforme e mensalidade">
                  <div className="space-y-2">
                    <SelectField
                      label="Tamanho do uniforme"
                      hint="Medidas da camiseta: largura × altura."
                      options={UNIFORM_SIZE_OPTIONS}
                      value={form.enrollment.uniform_size}
                      onChange={(value) => update("enrollment.uniform_size", value)}
                      {...field("enrollment.uniform_size", { required: true })}
                    />
                    <SizeTable />
                  </div>
                  <Choice
                    label="Melhor dia de vencimento"
                    options={DUE_DAY_OPTIONS.map((day) => ({ value: String(day), label: `Dia ${day}` }))}
                    value={form.enrollment.due_day}
                    onChange={(value) => update("enrollment.due_day", value)}
                    {...field("enrollment.due_day", { required: true })}
                  />
                </Section>
              </>
            )}

            {step === 1 && (
              <>
                <GuardianFields
                  title="Responsável principal"
                  prefix="guardians.0"
                  guardian={form.guardians[0]}
                  update={update}
                  field={field}
                  full
                />
                <GuardianFields
                  title="Segundo responsável"
                  hint="Opcional. Deixe em branco se não houver."
                  prefix="guardians.1"
                  guardian={form.guardians[1]}
                  update={update}
                  field={field}
                />
              </>
            )}

            {step === 2 && (
              <Section title="Saúde">
                <p className="text-sm text-muted">{HEALTH_TEXT} Se não houver, escreva “Não”.</p>
                <SelectField
                  label="Tipo sanguíneo"
                  hint="Se não souber, escolha “Não sei”."
                  options={BLOOD_TYPE_OPTIONS}
                  value={form.health.blood_type ?? ""}
                  onChange={(value) => update("health.blood_type", value)}
                  {...field("health.blood_type")}
                />
                {HEALTH_QUESTIONS.map((question) => (
                  <TextField
                    key={question.name}
                    label={question.label}
                    multiline
                    value={form.health[question.name] ?? ""}
                    onChange={(value) => update(`health.${question.name}`, value)}
                    {...field(`health.${question.name}`, { required: true })}
                  />
                ))}
              </Section>
            )}

            {step === 3 && (
              <Section title="Autorização">
                <div className="flex gap-2 text-sm text-muted">
                  <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p>{PURPOSE_TEXT}</p>
                    <p>{HEALTH_TEXT}</p>
                  </div>
                </div>
                <Check
                  id={fieldId("accepted")}
                  checked={form.accepted}
                  onChange={(value) => update("accepted", value)}
                  label={PURPOSE_ACCEPT}
                  error={errors.accepted}
                />
                <TextField
                  label="Seu nome completo"
                  value={form.acceptedBy}
                  onChange={(value) => update("acceptedBy", value)}
                  {...field("acceptedBy", { required: true })}
                />
                <p className="text-sm text-muted">
                  Ao enviar, a ficha de {studentName} vai para a escola.
                </p>
              </Section>
            )}

            {sendError && (
              <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert-text">
                {sendError}
              </p>
            )}

            {Object.keys(errors).length > 0 && (
              <p role="alert" className="text-sm font-medium text-alert-text">
                Confira os campos marcados.
              </p>
            )}

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={sending}
                  className="inline-flex h-12 items-center justify-center gap-1 rounded-lg border border-line bg-white px-4 font-semibold hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                  Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-inter-red px-4 font-semibold text-white hover:bg-inter-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
              >
                {sending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
                {step < STEPS.length - 1 ? "Continuar" : sending ? "Enviando…" : "Enviar matrícula"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-white p-4">
      <h2 className="font-display text-[1.75rem] font-semibold leading-none">{title}</h2>
      {children}
    </section>
  );
}

function Label({ id, label, required, hint }) {
  return (
    <label htmlFor={id} className="mb-1.5 block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-muted"> (obrigatório)</span>}
      </span>
      {hint && <span className="block text-sm text-muted">{hint}</span>}
    </label>
  );
}

function ErrorText({ id, error }) {
  if (!error) return null;
  return (
    <p id={`${id}-erro`} className="mt-1 text-sm text-alert-text">
      {error}
    </p>
  );
}

function TextField({ id, label, required, hint, error, value, onChange, multiline, ...props }) {
  const Tag = multiline ? "textarea" : "input";

  return (
    <div>
      <Label id={id} label={label} required={required} hint={hint} />
      <Tag
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-erro` : undefined}
        rows={multiline ? 2 : undefined}
        className={`${inputClass} ${multiline ? "resize-y" : ""}`}
        {...props}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

function SelectField({ id, label, required, hint, error, value, onChange, options, ...props }) {
  return (
    <div>
      <Label id={id} label={label} required={required} hint={hint} />
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={inputClass}
        {...props}
      >
        <option value="">Escolher</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
      <ErrorText id={id} error={error} />
    </div>
  );
}

// Tabela de medidas do uniforme, aberta só se a família quiser comparar
function SizeTable() {
  return (
    <details className="rounded-lg border border-line bg-white text-sm">
      <summary className="cursor-pointer rounded-lg px-3 py-2.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
        Ver tabela de medidas
      </summary>
      <table className="w-full border-t border-line text-left tabular-nums">
        <caption className="sr-only">Medidas da camiseta do uniforme, em centímetros</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Tamanho</th>
            <th scope="col" className="px-3 py-2 font-medium">Largura</th>
            <th scope="col" className="px-3 py-2 font-medium">Altura</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {UNIFORM_SIZES.map((size) => (
            <tr key={size.value}>
              <th scope="row" className="px-3 py-2 font-medium">{size.label}</th>
              <td className="px-3 py-2">{size.width} cm</td>
              <td className="px-3 py-2">{size.height} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Poucas opções: botões grandes (radio) em vez de lista
function Choice({ id, label, required, error, value, onChange, options }) {
  const items = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));

  return (
    <fieldset aria-describedby={error ? `${id}-erro` : undefined}>
      <legend className="mb-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-muted"> (obrigatório)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <label
            key={item.value}
            className={`inline-flex h-11 cursor-pointer items-center rounded-lg border px-4 text-base has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
              value === item.value ? "border-ink bg-ink text-white" : "border-line bg-white"
            } ${error ? "border-alert" : ""}`}
          >
            <input
              type="radio"
              id={index === 0 ? id : undefined}
              name={id}
              value={item.value}
              checked={value === item.value}
              onChange={() => onChange(item.value)}
              className="sr-only"
            />
            {item.label}
          </label>
        ))}
      </div>
      <ErrorText id={id} error={error} />
    </fieldset>
  );
}

function Check({ id, checked, onChange, label, error }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-erro` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <span className="text-sm font-medium">{label}</span>
      </label>
      <ErrorText id={id} error={error} />
    </div>
  );
}

function GuardianFields({ title, hint, prefix, guardian, update, field, full }) {
  const key = (name) => `${prefix}.${name}`;
  const set = (name, mask) => (value) => update(key(name), mask ? mask(value) : value);
  const required = Boolean(full);

  return (
    <Section title={title}>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <TextField label="Nome completo" value={guardian.name} onChange={set("name")} {...field(key("name"), { required })} />
      <TextField
        label="Celular (WhatsApp)"
        type="tel"
        inputMode="tel"
        placeholder="(51) 99999-9999"
        value={guardian.phone}
        onChange={set("phone", maskPhone)}
        {...field(key("phone"), { required })}
      />
      <TextField
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={guardian.email}
        onChange={set("email")}
        {...field(key("email"), { required })}
      />
      <Choice label="Sexo" options={GENDER_OPTIONS} value={guardian.gender} onChange={set("gender")} {...field(key("gender"), { required })} />
      <TextField
        label="CPF"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={guardian.cpf}
        onChange={set("cpf", maskCpf)}
        {...field(key("cpf"), { required })}
      />
      <TextField label="RG" value={guardian.rg} onChange={set("rg")} {...field(key("rg"), { required })} />

      {full && (
        <>
          <TextField label="Profissão" value={guardian.profession} onChange={set("profession")} {...field(key("profession"), { required })} />
          <TextField
            label="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={guardian.zip_code}
            onChange={set("zip_code", maskCep)}
            {...field(key("zip_code"), { required })}
          />
          <TextField
            label="Endereço (rua e número)"
            autoComplete="street-address"
            value={guardian.address}
            onChange={set("address")}
            {...field(key("address"), { required })}
          />
          <TextField label="Complemento" hint="Se houver." value={guardian.complement} onChange={set("complement")} {...field(key("complement"))} />
          <TextField label="Bairro" value={guardian.neighborhood} onChange={set("neighborhood")} {...field(key("neighborhood"), { required })} />
          <TextField label="Cidade" value={guardian.city} onChange={set("city")} {...field(key("city"), { required })} />
          <SelectField label="UF" options={STATE_OPTIONS} value={guardian.state} onChange={set("state")} {...field(key("state"), { required })} />
        </>
      )}
    </Section>
  );
}
