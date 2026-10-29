import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  ListPlus,
  Loader2,
  UserPlus,
} from "lucide-react";

import { buttonClass, Dialog, DialogActions, inputClass } from "../../ui";

import { getCategoryByBirthDate } from "../../../services/categories";
import { createContact } from "../../../services/contacts";
import { getActiveLocations } from "../../../services/administration/locations";
import TrialSlotPicker from "../experimentals/TrialSlotPicker";
import { WEEKDAY_LABELS } from "../../../constants/weekdays";
import { WAITING_LIST_REASONS } from "../../../constants/waitingListReasons";
import { PREFERRED_SHIFT_OPTIONS } from "../../../constants/preferredShift";
import DaySelector from "../common/DaySelector";
import { errorMessage } from "../../../helpers/errorMessage";

const SOURCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  {
    value: "franchisor_site",
    label: "Site da Franqueadora",
  },
  {
    value: "unit_site",
    label: "Site da Unidade",
  },
  { value: "referral", label: "Indicação" },
  { value: "presential", label: "Presencial" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "other", label: "Outro" },
];

const DESTINATIONS = [
  {
    value: "contact",
    title: "Apenas cadastrar",
    description: "Salvar como novo contato",
    icon: UserPlus,
  },
  {
    value: "experimental",
    title: "Agendar experimental",
    description: "Marcar uma aula agora",
    icon: GraduationCap,
  },
  {
    value: "waiting_list",
    title: "Lista de interesse",
    description: "Aguardar vaga ou turma",
    icon: ListPlus,
  },
];

export default function NewContactModal({ open, onClose, onCreated }) {
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [phone, setPhone] = useState("");

  const [source, setSource] = useState("whatsapp");
  const [trainedElsewhere, setTrainedElsewhere] = useState(false);
  const [previousClub, setPreviousClub] = useState("");

  const [firstContactAt, setFirstContactAt] = useState(getTodayISO());

  const [destination, setDestination] = useState("contact");

  const [category, setCategory] = useState(null);

  const [categoryLoading, setCategoryLoading] = useState(false);

  // Turma + horário + data escolhidos no TrialSlotPicker
  const [slot, setSlot] = useState(null);

  const [locations, setLocations] = useState([]);

  const [preferredLocationId, setPreferredLocationId] = useState("");

  const [waitingReason, setWaitingReason] = useState("");

  const [waitingNotes, setWaitingNotes] = useState("");

  const [preferredShift, setPreferredShift] = useState("");

  const [preferredDays, setPreferredDays] = useState([]);

  const [internalNotes, setInternalNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
   * Experimental exige cadastro completo.
   *
   * Contato simples e lista de interesse
   * podem ser cadastrados mesmo com dados
   * ainda desconhecidos.
   */
  const requiresCompleteData = destination === "experimental";

  /*
   * Limpa formulário quando abre.
   */
  useEffect(() => {
    if (!open) return;

    resetForm();

    getActiveLocations()
      .then(setLocations)
      .catch((err) => console.error("Erro ao carregar locais:", err));
  }, [open]);

  /*
   * Identifica categoria automaticamente
   * quando houver nascimento.
   */
  useEffect(() => {
    if (!open) return;

    setSlot(null);

    if (!birthDate) {
      setCategory(null);
      return;
    }

    findCategoryByBirthDate(birthDate);
  }, [birthDate, open]);

  async function findCategoryByBirthDate(date) {
    try {
      setCategoryLoading(true);
      setCategory(null);

      // Mesma regra do formulário público: idade que completa no ano
      const data = await getCategoryByBirthDate(date);

      setCategory(data || null);
    } catch (err) {
      console.error("Erro ao identificar categoria:", err);

      setCategory(null);
    } finally {
      setCategoryLoading(false);
    }
  }

  /*
   * Detecta se o cadastro está incompleto.
   *
   * Isso NÃO impede contato simples
   * nem lista de interesse.
   */
  const missingData = useMemo(() => {
    const fields = [];

    if (!childName.trim()) {
      fields.push("nome do atleta");
    }

    if (!birthDate) {
      fields.push("data de nascimento");
    }

    if (!responsibleName.trim()) {
      fields.push("nome do responsável");
    }

    return fields;
  }, [childName, birthDate, responsibleName]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    /*
     * =====================================================
     * OBRIGATÓRIO PARA QUALQUER LEAD
     * =====================================================
     */

    if (!phone.trim()) {
      setError("Informe o WhatsApp do contato.");
      return;
    }

    if (!source) {
      setError("Informe a origem do contato.");
      return;
    }

    if (!firstContactAt) {
      setError("Informe a data do primeiro contato.");
      return;
    }

    /*
     * =====================================================
     * EXPERIMENTAL EXIGE CADASTRO COMPLETO
     * =====================================================
     */

    if (destination === "experimental") {
      if (!childName.trim()) {
        setError("Para agendar uma experimental, informe o nome do atleta.");
        return;
      }

      if (!birthDate) {
        setError(
          "Para agendar uma experimental, informe a data de nascimento.",
        );
        return;
      }

      if (!responsibleName.trim()) {
        setError(
          "Para agendar uma experimental, informe o nome do responsável.",
        );
        return;
      }

      if (!category) {
        setError(
          "Não foi possível identificar uma categoria ativa para este atleta.",
        );
        return;
      }

      if (!slot) {
        setError("Escolha a turma, o horário e a data da experimental.");
        return;
      }
    }

    /*
     * =====================================================
     * LISTA DE INTERESSE
     * =====================================================
     */

    if (destination === "waiting_list" && !waitingReason) {
      setError("Informe o motivo da lista de interesse.");
      return;
    }

    try {
      setSaving(true);

      /*
       * Campos desconhecidos são enviados
       * como NULL.
       *
       * Nunca usamos "Não informado" como
       * dado artificial no banco.
       */
      const payload = {
        child_name: childName.trim() || null,

        birth_date: birthDate || null,

        responsible_name: responsibleName.trim() || null,

        phone: normalizePhone(phone),

        source,

        first_contact_at: firstContactAt,

        entry_channel: "admin",

        category_id: category?.id || null,

        preferred_shift: preferredShift || null,

        preferred_days: preferredDays,

        internal_notes: internalNotes.trim() || null,
      };

      /*
       * ===================================================
       * APENAS CADASTRAR
       * ===================================================
       */

      if (destination === "contact") {
        payload.status = "new_contact";

        payload.experimental_date = null;
        payload.experimental_time = null;

        payload.waiting_list_reason = null;
        payload.waiting_list_notes = null;
        payload.waiting_list_at = null;
      }

      /*
       * ===================================================
       * AGENDAR EXPERIMENTAL
       * ===================================================
       */

      if (destination === "experimental") {
        payload.status = "pending_confirmation";

        // Horário, turma e local vêm do horário escolhido (createContact)
        payload.training_group_schedule_id = slot.scheduleId;

        payload.experimental_date = slot.date;

        payload.waiting_list_reason = null;
        payload.waiting_list_notes = null;
        payload.waiting_list_at = null;
      }

      /*
       * ===================================================
       * LISTA DE INTERESSE
       * ===================================================
       */

      if (destination === "waiting_list") {
        payload.status = "waiting_list";

        payload.waiting_list_reason = waitingReason;

        payload.waiting_list_notes = waitingNotes.trim() || null;

        payload.waiting_list_at = new Date().toISOString();

        payload.location_id = preferredLocationId || null;

        payload.experimental_date = null;
        payload.experimental_time = null;
      }

      const created = await createContact(payload);

      setSuccess(true);

      if (onCreated) {
        onCreated(created);
      }

      window.setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error("Erro ao criar contato:", err);

      setError(errorMessage(err, "Não foi possível cadastrar o contato."));
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setChildName("");
    setBirthDate("");
    setResponsibleName("");
    setPhone("");

    setSource("whatsapp");

    setFirstContactAt(getTodayISO());

    setDestination("contact");

    setCategory(null);
    setCategoryLoading(false);

    setPreferredShift("");
    setPreferredDays([]);

    setSlot(null);
    setPreferredLocationId("");

    setWaitingReason("");
    setWaitingNotes("");
    setPreferredShift("");

    setInternalNotes("");

    setSaving(false);
    setError("");
    setSuccess(false);
  }

  function handleClose() {
    if (saving) return;

    onClose();
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Novo contato"
      description="Cadastre uma família interessada."
      size="lg"
      busy={saving}
    >
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* DADOS DO ATLETA */}

            <FormSection
              number="01"
              title="Dados do atleta"
              description={
                requiresCompleteData
                  ? "Obrigatórios para agendar a experimental."
                  : "Preencha o que já souber. Você poderá completar depois."
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome do atleta" required={requiresCompleteData}>
                  <input
                    type="text"
                    value={childName}
                    onChange={(event) => setChildName(event.target.value)}
                    placeholder={
                      requiresCompleteData ? "Nome completo" : "Opcional"
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Data de nascimento"
                  required={requiresCompleteData}
                >
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* AVISO DE CADASTRO INCOMPLETO */}

              {!requiresCompleteData && missingData.length > 0 && (
                <div
                  className="
                      mt-5
                      flex
                      items-start
                      gap-3
                      rounded-lg
                      border
                      border-attention/40
                      bg-attention-soft
                      p-4
                    "
                >
                  <AlertTriangle
                    size={19}
                    className="
                        mt-0.5
                        shrink-0
                        text-attention-text
                      "
                  />

                  <div>
                    <p className="text-sm font-semibold text-attention-text">
                      Cadastro incompleto
                    </p>

                    <p className="mt-1 text-xs leading-5 text-attention-text">
                      Faltando: {missingData.join(", ")}. Isso não impede salvar
                      o contato.
                    </p>
                  </div>
                </div>
              )}

              {/* CATEGORIA AUTOMÁTICA */}

              {birthDate && (
                <div className="mt-5">
                  {categoryLoading ? (
                    <div className="flex items-center gap-3 rounded-lg bg-canvas p-4 text-sm text-muted">
                      <Loader2 size={18} className="animate-spin" />
                      Identificando categoria...
                    </div>
                  ) : category ? (
                    <div
                      className="
                        flex
                        flex-col
                        gap-3
                        rounded-lg
                        border
                        border-alert/30
                        bg-alert-soft
                        p-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div>
                        <p className="text-sm font-medium text-muted">
                          Categoria identificada
                        </p>

                        <p className="mt-1 text-lg font-bold text-ink">
                          {category.name}
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="rounded-lg border border-attention/40 bg-attention-soft p-4">
                      <p className="text-sm font-semibold text-attention-text">
                        Nenhuma categoria ativa encontrada para esta data de
                        nascimento.
                      </p>

                      <p className="mt-1 text-xs text-attention-text">
                        Ainda é possível cadastrar o contato ou adicioná-lo à
                        lista de interesse.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            {/* RESPONSÁVEL */}

            <FormSection
              number="02"
              title="Responsável"
              description="Dados para contato com a família."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nome do responsável"
                  required={requiresCompleteData}
                >
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(event) => setResponsibleName(event.target.value)}
                    placeholder={
                      requiresCompleteData ? "Nome completo" : "Opcional"
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="WhatsApp" required>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(formatPhoneInput(event.target.value))
                    }
                    placeholder="(51) 99999-9999"
                    className={inputClass}
                  />
                </Field>
              </div>

              <p className="mt-3 text-xs text-muted">
                O WhatsApp é obrigatório porque identifica a família e permite
                retomar o contato.
              </p>
            </FormSection>

            {/* ORIGEM */}

            <FormSection
              number="03"
              title="Origem"
              description="Como e quando essa família chegou até nós?"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Origem do contato" required>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className={inputClass}
                  >
                    {SOURCES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Data do primeiro contato" required>
                  <input
                    type="date"
                    max={getTodayISO()}
                    value={firstContactAt}
                    onChange={(event) => setFirstContactAt(event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <p className="mt-3 text-xs text-muted">
                Para contatos antigos, use a data da primeira conversa encontrada
                no WhatsApp.
              </p>
            </FormSection>

            {/* DESTINO */}

            <FormSection
              number="04"
              title="Próximo passo"
              description="O que deseja fazer com este contato?"
            >
              <div className="grid gap-3 md:grid-cols-3">
                {DESTINATIONS.map((item) => {
                  const Icon = item.icon;

                  const active = destination === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setDestination(item.value);

                        setError("");
                      }}
                      className={`
                          rounded-lg
                          border
                          p-4
                          text-left
                          transition-colors
                          ${
                            active
                              ? "border-ink bg-white ring-1 ring-ink"
                              : "border-line bg-white hover:border-neutral-400"
                          }
                        `}
                    >
                      <div
                        className={`
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              active
                                ? "bg-ink text-white"
                                : "bg-neutral-100 text-muted"
                            }
                          `}
                      >
                        <Icon size={19} />
                      </div>

                      <p className="mt-4 font-bold text-ink">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* EXPERIMENTAL */}

              {destination === "experimental" && (
                <div
                  className="
                    mt-5
                    rounded-lg
                    border
                    border-line
                    bg-canvas
                    p-5
                  "
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-inter-red" />

                    <h4 className="font-bold text-ink">
                      Agendar experimental
                    </h4>
                  </div>

                  {!birthDate ? (
                    <div className="mt-4 rounded-lg border border-attention/40 bg-attention-soft p-4">
                      <p className="text-sm font-semibold text-attention-text">
                        Informe a data de nascimento para identificar a
                        categoria.
                      </p>
                    </div>
                  ) : categoryLoading ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={17} className="animate-spin" />
                      Identificando categoria...
                    </div>
                  ) : !category ? (
                    <div className="mt-4 rounded-lg border border-attention/40 bg-attention-soft p-4">
                      <p className="text-sm font-semibold text-attention-text">
                        Não existe categoria ativa compatível.
                      </p>

                      <p className="mt-1 text-xs text-attention-text">
                        Considere colocar este contato na Lista de Interesse.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <TrialSlotPicker
                        categoryId={category.id}
                        value={slot}
                        onChange={setSlot}
                      />

                      {slot && (
                        <p className="mt-4 rounded-lg bg-white p-3 text-sm text-neutral-700">
                          Selecionado:{" "}
                          <strong>
                            {slot.group.location?.name},{" "}
                            {WEEKDAY_LABELS[slot.weekday]}{" "}
                            {formatDate(slot.date)} às{" "}
                            {formatTime(slot.start_time)}
                          </strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE INTERESSE */}

              {destination === "waiting_list" && (
                <div
                  className="
                    mt-5
                    rounded-lg
                    border
                    border-line
                    bg-canvas
                    p-5
                  "
                >
                  <div className="flex items-center gap-2">
                    <ListPlus size={18} className="text-ink" />

                    <h4 className="font-bold text-ink">
                      Lista de interesse
                    </h4>
                  </div>

                  <p className="mt-2 text-sm text-muted">
                    Use quando existe interesse real, mas ainda não é possível
                    avançar para uma experimental.
                  </p>

                  <div className="mt-5">
                    <Field label="Motivo" required>
                      <select
                        value={waitingReason}
                        onChange={(event) =>
                          setWaitingReason(event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Selecione</option>

                        {WAITING_LIST_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {locations.length > 1 && (
                    <div className="mt-5">
                      <Field label="Local de preferência">
                        <select
                          value={preferredLocationId}
                          onChange={(event) =>
                            setPreferredLocationId(event.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="">Qualquer local</option>

                          {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}

                  <div className="mt-5">
                    <Field label="Turno preferido">
                      <select
                        value={preferredShift}
                        onChange={(event) =>
                          setPreferredShift(event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Não informado</option>

                        {PREFERRED_SHIFT_OPTIONS.map((shift) => (
                          <option key={shift.value} value={shift.value}>
                            {shift.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="mt-5">
  <DaySelector
    value={preferredDays}
    onChange={setPreferredDays}
  />
</div>
                  </div>

                  <div className="mt-5">
                    <Field label="Detalhes">
                      <textarea
                        value={waitingNotes}
                        onChange={(event) =>
                          setWaitingNotes(event.target.value)
                        }
                        rows={3}
                        placeholder="Ex.: Filho tinha 3 anos no primeiro contato. Família demonstrou interesse em futura turma Kids."
                        className={`${inputClass} resize-none`}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </FormSection>

            {/* OBSERVAÇÕES */}

            <FormSection
              number="05"
              title="Observações"
              description="Informações internas e histórico relevante."
            >
              <Field label="Observação interna">
                <textarea
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  rows={4}
                  placeholder="Ex.: Entrou em contato em março perguntando idade mínima. Reativar para confirmar interesse e completar cadastro."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </FormSection>

            {/* ERRO */}

            {error && (
              <div className="rounded-lg border border-alert/30 bg-alert-soft p-4">
                <p className="text-sm font-semibold text-alert-text">{error}</p>
              </div>
            )}

            {/* SUCESSO */}

            {success && (
              <div className="flex items-center gap-3 rounded-lg border border-ok/30 bg-ok-soft p-4">
                <CheckCircle2 size={20} className="shrink-0 text-ok" />

                <p className="text-sm font-semibold text-ok">
                  Contato cadastrado com sucesso.
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="sticky -bottom-5 -mx-5 -mb-5 mt-8 border-t border-line bg-white px-5 py-4">
            <DialogActions>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={buttonClass("secondary")}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || success}
              className={buttonClass("primary")}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Salvar contato
                </>
              )}
            </button>
            </DialogActions>
          </div>
        </form>
    </Dialog>
  );
}

/*
 * =========================================================
 * COMPONENTES AUXILIARES
 * =========================================================
 */

function FormSection({ number, title, description, children }) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <span
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-ink
            text-xs
            font-bold
            text-white
          "
        >
          {number}
        </span>

        <div>
          <h3 className="font-bold text-ink">{title}</h3>

          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </div>

      <div className="sm:pl-11">{children}</div>
    </section>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {label}

        {required && <span className="ml-1 text-inter-red">*</span>}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function formatPhoneInput(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return numbers.replace(/(\d{2})(\d+)/, "($1) $2");
  }

  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }

  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

function formatTime(time) {
  if (!time) return "-";

  return time.slice(0, 5);
}

// "2026-10-20" -> "20/10"
function formatDate(iso) {
  const [, month, day] = iso.split("-");

  return `${day}/${month}`;
}

function getTodayISO() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
