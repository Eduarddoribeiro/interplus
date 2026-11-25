import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button, Dialog, DialogActions, inputClass } from "../../ui";
import { toast } from "../common/Toaster";

import { BRAND } from "../../../constants/brand";
import { formatPhone } from "../../../helpers/phoneHelpers";
import { errorMessage } from "../../../helpers/errorMessage";

const formatDate = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "");

function formatCpf(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 11 ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}` : value;
}

/*
 * Os dados da ficha campo a campo, na ordem do cadastro, para passar
 * ao sistema financeiro sem abrir "Editar". Cada linha copia o valor
 * num toque. No fim, dá para guardar o código e dar baixa na pendência.
 */
export default function SogniCopyDialog({ open, onClose, student, guardians, enrollment, sogniTask, onDone }) {
  const [copied, setCopied] = useState(null);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCopied(null);
      setCode(student?.sogni_id ?? "");
    }
  }, [open, student]);

  if (!student) return null;

  const sections = [
    {
      title: "Aluno",
      rows: [
        ["Nome", student.name],
        ["Nascimento", formatDate(student.birth_date)],
        ["Sexo", student.gender],
        ["CPF", formatCpf(student.cpf)],
        ["RG", student.rg],
        ["Celular", student.phone ? formatPhone(student.phone) : ""],
        ["Escola", student.school],
        ["Instituição", student.school_type],
      ],
    },
    ...guardians.map((guardian) => ({
      title: guardian.position === 1 ? "Responsável principal" : "Segundo responsável",
      rows: [
        ["Nome", guardian.name],
        ["Parentesco", guardian.relationship],
        ["CPF", formatCpf(guardian.cpf)],
        ["RG", guardian.rg],
        ["Sexo", guardian.gender],
        ["Telefone", guardian.phone ? formatPhone(guardian.phone) : ""],
        ["E-mail", guardian.email],
        ["Profissão", guardian.profession],
        ["CEP", guardian.zip_code],
        ["Rua e número", guardian.address],
        ["Complemento", guardian.complement],
        ["Bairro", guardian.neighborhood],
        ["Cidade", guardian.city],
        ["UF", guardian.state],
      ],
    })),
    enrollment && {
      title: `Matrícula ${enrollment.season}`,
      rows: [
        ["Categoria", enrollment.categories?.name],
        ["Turma", enrollment.training_groups?.name],
        ["Início", formatDate(enrollment.start_date)],
        ["Vencimento", enrollment.due_day ? `Dia ${enrollment.due_day}` : ""],
        ["Uniforme", enrollment.uniform_size],
      ],
    },
  ].filter(Boolean);

  async function copy(key, label, value) {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    } catch {
      toast(`Não foi possível copiar ${label.toLowerCase()}. Selecione o texto e copie.`);
    }
  }

  async function markDone() {
    try {
      setSaving(true);
      await onDone(code.trim());
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Não foi possível salvar. Tente de novo."));
    } finally {
      setSaving(false);
    }
  }

  const pending = sogniTask && sogniTask.status === "pending";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title="Copiar dados da ficha"
      description={`${student.name}. Toque numa linha para copiar.`}
      footer={
        <div className="space-y-3">
          {pending && (
            <div>
              <label htmlFor="sogni-code" className="mb-1.5 block text-sm font-medium text-ink">
                Código no {BRAND.financeSystem} (opcional)
              </label>
              <input
                id="sogni-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={inputClass}
                placeholder="O número que o cadastro gerou"
              />
            </div>
          )}
          <DialogActions>
            <Button onClick={onClose} disabled={saving}>
              Fechar
            </Button>
            {pending && (
              <Button variant="primary" onClick={markDone} disabled={saving}>
                {saving ? "Salvando…" : `Marcar como cadastrado no ${BRAND.financeSystem}`}
              </Button>
            )}
          </DialogActions>
        </div>
      }
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-1.5 text-sm font-semibold text-ink">{section.title}</h3>
            <div className="overflow-hidden rounded-lg border border-line">
              {section.rows.map(([label, value]) => {
                const key = `${section.title}-${label}`;
                const filled = value != null && String(value).trim() !== "";
                const done = copied === key;

                return (
                  <div key={key} className="border-t border-line first:border-t-0">
                    {filled ? (
                      <button
                        type="button"
                        onClick={() => copy(key, label, value)}
                        aria-label={`Copiar ${label}: ${value}`}
                        className="grid w-full grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none sm:grid-cols-[9rem_minmax(0,1fr)_auto] touch:min-h-11"
                      >
                        <span className="text-muted">{label}</span>
                        <span className="min-w-0 break-words font-medium text-ink">{value}</span>
                        <span
                          aria-hidden="true"
                          className={`inline-flex items-center gap-1 text-xs font-medium ${done ? "text-ok" : "text-muted"}`}
                        >
                          {done ? <Check size={15} /> : <Copy size={15} />}
                          <span className="hidden sm:inline">{done ? "Copiado" : "Copiar"}</span>
                        </span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-3 py-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
                        <span className="text-muted">{label}</span>
                        <span className="text-muted">Não preenchido</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
