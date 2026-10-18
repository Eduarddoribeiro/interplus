import { useState } from "react";
import { Check, MessageCircle, SkipForward, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              Chamar pelo WhatsApp
            </p>

            <h2 className="mt-1 text-xl font-bold text-neutral-900">{title}</h2>

            <p className="mt-1 text-sm text-neutral-500">
              {Math.min(index + 1, contacts.length)} de {contacts.length} · {done.length} chamad
              {done.length === 1 ? "a" : "as"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {finished ? (
            <div className="py-6 text-center">
              <Check size={36} className="mx-auto text-green-600" />

              <p className="mt-3 font-semibold text-neutral-900">
                Fila concluída
              </p>

              <p className="mt-1 text-sm text-neutral-500">
                {done.length} família{done.length === 1 ? "" : "s"} chamada
                {done.length === 1 ? "" : "s"}.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className="font-bold text-neutral-900">
                {contact.child_name || "Sem nome"}
              </p>

              <p className="text-sm text-neutral-500">
                {contact.responsible_name || "Responsável não informado"} · {contact.phone}
              </p>

              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-neutral-50 p-4 font-sans text-sm leading-6 text-neutral-800">
                {buildMessage(contact)}
              </pre>

              {error && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCall}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageCircle size={17} />
                  Abrir WhatsApp e marcar
                </button>

                <button
                  type="button"
                  onClick={() => setIndex((current) => current + 1)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <SkipForward size={17} />
                  Pular
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
