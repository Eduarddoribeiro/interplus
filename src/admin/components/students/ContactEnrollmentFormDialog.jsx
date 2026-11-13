import { useEffect, useRef, useState } from "react";

import { Button, Dialog, DialogActions } from "../../ui";
import { EnrollmentLinkDialog } from "./EnrollmentFormPanel";

import { getStudentForContact, guardiansOf } from "../../../services/students";
import { createEnrollmentInvite, inviteStatus } from "../../../services/enrollmentForms";
import { latestInvite } from "../../../helpers/familyForms";
import { errorMessage } from "../../../helpers/errorMessage";

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

/*
 * Ficha de matrícula a partir de um contato (ex.: na tela de
 * Experimentais, logo depois do "Matriculado"), sem passar pela
 * página do contato e pela do aluno.
 *
 * Se ainda não há link valendo, cria e mostra a mensagem pronta.
 * Se já há um link aberto, pergunta antes de trocar (o anterior
 * deixa de valer). Se a família já preencheu, não cria outro.
 */
export default function ContactEnrollmentFormDialog({ contactId, onClose }) {
  const [state, setState] = useState({ phase: "loading" });
  // Um link só por abertura (o StrictMode roda o efeito duas vezes no dev)
  const started = useRef(false);

  async function createLink(student, guardian) {
    setState({ phase: "creating", student, guardian });
    const link = await createEnrollmentInvite(student.id);
    setState({ phase: "link", student, guardian, link });
  }

  useEffect(() => {
    if (started.current) return undefined;
    started.current = true;
    let active = true;

    (async () => {
      try {
        const student = await getStudentForContact(contactId);
        if (!active) return;

        const guardian = guardiansOf(student)[0] ?? null;
        const invite = latestInvite(student.enrollment_invites);
        const status = inviteStatus(invite);

        if (status === "open" || status === "used") {
          setState({ phase: status, student, guardian, invite });
        } else {
          await createLink(student, guardian);
        }
      } catch (err) {
        console.error("Erro ao preparar a ficha de matrícula:", err);
        if (active) setState({ phase: "error", message: errorMessage(err, "Não foi possível criar o link. Tente de novo.") });
      }
    })();

    return () => {
      active = false;
    };
  }, [contactId]);

  const { phase, student, guardian, invite } = state;

  if (phase === "link") {
    return <EnrollmentLinkDialog link={state.link} student={student} guardian={guardian} onClose={onClose} />;
  }

  const busy = phase === "loading" || phase === "creating";

  async function resend() {
    try {
      await createLink(student, guardian);
    } catch (err) {
      console.error("Erro ao criar o link:", err);
      setState({ phase: "error", message: errorMessage(err, "Não foi possível criar o link. Tente de novo.") });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={busy}
      title="Enviar ficha de matrícula"
      description={student?.name}
      footer={
        <DialogActions>
          {phase === "open" && (
            <>
              <Button variant="quiet" onClick={onClose}>
                Manter o link enviado
              </Button>
              <Button onClick={resend}>Enviar de novo</Button>
            </>
          )}
          {phase === "used" && (
            <>
              <Button variant="quiet" onClick={onClose}>
                Fechar
              </Button>
              <Button to={`/admin/students/${student.id}`}>Abrir ficha do aluno</Button>
            </>
          )}
          {(phase === "error" || busy) && (
            <Button variant="quiet" onClick={onClose} disabled={busy}>
              Fechar
            </Button>
          )}
        </DialogActions>
      }
    >
      {busy && (
        <p role="status" className="text-sm text-muted">
          Criando o link…
        </p>
      )}

      {phase === "open" && (
        <p className="text-sm">
          A família já recebeu o link em {formatDate(invite.created_at)}, e ele vale até {formatDate(invite.expires_at)}.
          Enviar de novo cria outro link, e o anterior deixa de valer.
        </p>
      )}

      {phase === "used" && (
        <p className="text-sm">
          A família já preencheu a ficha em {formatDate(invite.used_at)}.
          {invite.reviewed_at ? " Ela já foi conferida." : " Falta conferir na ficha do aluno."}
        </p>
      )}

      {phase === "error" && (
        <p role="alert" className="text-sm font-medium text-alert-text">
          {state.message}
        </p>
      )}
    </Dialog>
  );
}
