import { useState } from "react";
import { Check, MessageCircle, SkipForward } from "lucide-react";

import { buttonClass, Dialog } from "../../ui";

/*
 * "Chamar todos desta célula": passa pelas famílias uma a uma.
 *
 * Cada clique abre o WhatsApp com a mensagem pronta e marca a
 * família como chamada. A página já tira da fila quem foi chamado
 * nos últimos 7 dias.
 */
export default function WaitingListCallQueue({
  title,
  contacts,
  buildMessage,
  buildUrl,
  onCalled,
  onClose,
}) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState([]);
  const [error, setError] = useState("");

  const contact = contacts[index];
  const finished = index >= contacts.length;

  async function handleCall() {
    const url = buildUrl(contact);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    try {
      setError("");
      await onCalled(contact);
      setDone((current) => [...current, contact.id]);
      setIndex((current) => current + 1);
    } catch (err) {
      console.error("Erro ao marcar como chamado:", err);
      setError("Abriu o WhatsApp, mas não foi possível marcar como chamado.");
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Chamar pelo WhatsApp"
      description={`${title}: ${Math.min(index + 1, contacts.length)} de ${contacts.length}, ${done.length} ${done.length === 1 ? "chamada" : "chamadas"}`}
    >
        <div>
          {finished ? (
            <div className="py-6 text-center">
              <Check size={36} className="mx-auto text-ok" />

              <p className="mt-3 font-semibold text-ink">
                Fila concluída
              </p>

              <p className="mt-1 text-sm text-muted">
                {done.length} família{done.length === 1 ? "" : "s"} chamada
                {done.length === 1 ? "" : "s"}.
              </p>

              <button
                type="button"
                onClick={onClose}
                className={`mt-5 ${buttonClass("primary")}`}
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className="font-bold text-ink">
                {contact.child_name || "Sem nome"}
              </p>

              <p className="text-sm text-muted">
                {contact.responsible_name || "Responsável não informado"} · {contact.phone}
              </p>

              <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-canvas p-4 font-sans text-sm leading-6 text-ink">
                {buildMessage(contact)}
              </pre>

              {error && (
                <p className="mt-3 rounded-lg bg-alert-soft p-3 text-sm text-alert-text">{error}</p>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCall}
                  className={`flex-1 ${buttonClass("primary")} !bg-whatsapp hover:!brightness-95`}
                >
                  <MessageCircle size={17} />
                  Abrir WhatsApp e marcar
                </button>

                <button
                  type="button"
                  onClick={() => setIndex((current) => current + 1)}
                  className={buttonClass("secondary")}
                >
                  <SkipForward size={17} />
                  Pular
                </button>
              </div>
            </>
          )}
        </div>
    </Dialog>
  );
}
