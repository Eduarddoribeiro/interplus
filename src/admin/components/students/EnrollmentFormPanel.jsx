import { useState } from "react";
import { Copy, MessageCircle, Send } from "lucide-react";

import { Button, Dialog, DialogActions, Panel } from "../../ui";
import { toast } from "../common/Toaster";

import { createEnrollmentInvite, inviteStatus } from "../../../services/enrollmentForms";
import { LINK_DAYS } from "../../../constants/enrollmentForm";
import { createWhatsAppUrl } from "../../../helpers/contactPresentation";
import { errorMessage } from "../../../helpers/errorMessage";

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
const firstName = (name) => String(name ?? "").trim().split(/\s+/)[0] ?? "";
const newest = (items, field) => [...(items ?? [])].sort((a, b) => b[field].localeCompare(a[field]))[0] ?? null;

/*
 * Ficha de matrícula pela família: gera o link individual (7 dias,
 * uso único) e abre o WhatsApp do responsável com a mensagem pronta.
 */
export default function EnrollmentFormPanel({ student, guardian, onChange }) {
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState(null);

  const invite = newest(student.enrollment_invites, "created_at");
  const consent = newest(student.enrollment_consents, "accepted_at");
  const status = inviteStatus(invite);

  async function create() {
    try {
      setCreating(true);
      setLink(await createEnrollmentInvite(student.id));
      onChange();
    } catch (err) {
      console.error("Erro ao criar o link:", err);
      toast(errorMessage(err, "Não foi possível criar o link. Tente de novo."));
    } finally {
      setCreating(false);
    }
  }

  const text = {
    none: "A família ainda não recebeu a ficha de matrícula.",
    replaced: "A família ainda não recebeu a ficha de matrícula.",
    open: `Enviado em ${formatDate(invite?.created_at)}. O link vale até ${formatDate(invite?.expires_at)}.`,
    expired: `O link enviado em ${formatDate(invite?.created_at)} venceu sem resposta.`,
    used: `Preenchida pela família em ${formatDate(invite?.used_at)}.`,
  }[status];

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-display text-2xl font-semibold leading-none">Ficha pela família</h2>
        <Button size="sm" variant={status === "used" ? "quiet" : "secondary"} onClick={create} disabled={creating}>
          <Send size={15} aria-hidden="true" />
          {creating ? "Criando link…" : status === "none" || status === "replaced" ? "Enviar formulário" : "Enviar de novo"}
        </Button>
      </div>

      <div className="space-y-1 px-4 py-3 text-sm">
        <p>{text}</p>
        {consent && (
          <p className="text-muted">
            Autorização aceita por {consent.accepted_by} em {formatDate(consent.accepted_at)} (versão {consent.version}).
          </p>
        )}
        {status === "open" && (
          <p className="text-muted">Enviar de novo cria outro link, e o anterior deixa de valer.</p>
        )}
      </div>

      <LinkDialog link={link} student={student} guardian={guardian} onClose={() => setLink(null)} />
    </Panel>
  );
}

function LinkDialog({ link, student, guardian, onClose }) {
  const message = link
    ? `Olá, ${firstName(guardian?.name)}! Para concluir a matrícula de ${firstName(student.name)} na Escola Oficial do Inter Viamão, preencha a ficha neste link:\n\n${link.url}\n\nO link vale por ${LINK_DAYS} dias.`
    : "";
  const whatsappUrl = guardian?.phone ? createWhatsAppUrl(guardian.phone) : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast("Mensagem com o link copiada.", { type: "success" });
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie à mão.");
    }
  }

  return (
    <Dialog
      open={Boolean(link)}
      onClose={onClose}
      title="Enviar ficha de matrícula"
      description={student.name}
      footer={
        <DialogActions>
          <Button onClick={copy}>
            <Copy size={16} aria-hidden="true" />
            Copiar mensagem
          </Button>
          {whatsappUrl && (
            <a
              href={`${whatsappUrl}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 text-sm font-semibold text-white touch:h-11 hover:opacity-90"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Abrir WhatsApp de {firstName(guardian.name)}
            </a>
          )}
        </DialogActions>
      }
    >
      <p className="text-sm">
        Link criado. Vale por {LINK_DAYS} dias e serve uma vez só. Ele aparece só agora: se perder, envie de novo.
      </p>
      <p className="mt-3 whitespace-pre-line break-all rounded-lg bg-canvas p-3 text-sm">{message}</p>
      {!whatsappUrl && (
        <p className="mt-3 text-sm text-muted">O responsável não tem telefone na ficha. Copie a mensagem e envie por onde preferir.</p>
      )}
    </Dialog>
  );
}
