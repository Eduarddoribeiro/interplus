import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, Users, Check } from "lucide-react";

import { Dialog, buttonClass, inputClass } from "../../ui";
import { buildCoachLinkUrl, getOrCreateCoachLink } from "../../../services/coachLinks";
import { createCoachWhatsAppText } from "../../../helpers/coachListText";

export default function CoachListModal({
  experimentals,
  initialDate,
  locationId,
  onClose,
}) {
  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [copied, setCopied] =
    useState(false);

  // Link para o professor marcar presença (sem login)
  const [linkUrl, setLinkUrl] =
    useState("");

  const [linkError, setLinkError] =
    useState("");

  const sessions = useMemo(() => {
    return experimentals
      .filter(
        (item) =>
          item.experimental_date ===
            selectedDate &&
          [
            "pending_confirmation",
            "confirmed",
          ].includes(item.status)
      )
      .sort((a, b) => {
        const timeA =
          a.experimental_time ||
          a.schedule?.start_time ||
          "00:00";

        const timeB =
          b.experimental_time ||
          b.schedule?.start_time ||
          "00:00";

        return timeA.localeCompare(
          timeB
        );
      });
  }, [
    experimentals,
    selectedDate,
  ]);

  useEffect(() => {
    let cancelled = false;

    setLinkUrl("");
    setLinkError("");

    if (!sessions.length) return undefined;

    getOrCreateCoachLink(selectedDate, locationId)
      .then((token) => {
        if (!cancelled) setLinkUrl(buildCoachLinkUrl(token));
      })
      .catch((err) => {
        console.error("Erro ao gerar link dos professores:", err);
        if (!cancelled) {
          setLinkError(
            "Não foi possível gerar o link de presença. Feche e abra a lista de novo."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, locationId, sessions.length]);

  const text = useMemo(() => {
    const list = createCoachWhatsAppText(
      selectedDate,
      sessions
    );

    return list && linkUrl
      ? `${list}\n\n✅ Marcar quem veio: ${linkUrl}`
      : list;
  }, [selectedDate, sessions, linkUrl]);

  async function copyList() {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Erro ao copiar:",
        err
      );

      fallbackCopy(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Lista dos professores"
      description="Experimentais do dia, prontas para enviar no grupo do WhatsApp."
    >
      <div>
        <label className="text-sm font-medium text-ink">
          Dia do treino
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(
              event.target.value
            );
            setCopied(false);
          }}
          className={`mt-1.5 ${inputClass}`}
        />

        <div className="mt-5 flex items-center justify-between rounded-lg bg-canvas px-4 py-3">
          <span className="text-sm text-neutral-600">
            Experimentais na lista
          </span>

          <strong className="text-lg text-ink">
            {sessions.length}
          </strong>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
            <Users
              size={30}
              className="mx-auto text-neutral-300"
            />

            <p className="mt-3 font-semibold text-neutral-700">
              Nenhuma experimental ativa
              neste dia.
            </p>

            <p className="mt-1 text-sm text-muted">
              A lista considera aulas
              aguardando confirmação ou
              confirmadas.
            </p>
          </div>
        ) : (
          <>
            {linkError && (
              <p className="mt-5 rounded-lg bg-alert-soft p-3 text-sm text-alert-text">
                {linkError}
              </p>
            )}

            {linkUrl && (
              <p className="mt-5 rounded-lg bg-ok-soft p-3 text-xs text-ok">
                O link no fim da mensagem abre a lista no celular do
                professor para marcar quem veio, sem login. Vale até
                o fim do dia seguinte.
              </p>
            )}

            <div className="mt-5">
              <p className="text-sm font-semibold text-ink">
                Prévia da mensagem
              </p>

              <div className="mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-line bg-canvas p-5">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-ink">
                  {text}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={copyList}
              className={`mt-5 w-full ${buttonClass(copied ? "secondary" : "primary")}`}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Lista copiada
                </>
              ) : (
                <>
                  <ClipboardCopy
                    size={18}
                  />
                  Copiar lista para
                  WhatsApp
                </>
              )}
            </button>
          </>
        )}
      </div>
    </Dialog>
  );
}

function fallbackCopy(text) {
  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value = text;

  textarea.style.position =
    "fixed";

  textarea.style.opacity = "0";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  document.execCommand("copy");

  document.body.removeChild(
    textarea
  );
}
