import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, CheckCircle2, Loader2, MapPin, X } from "lucide-react";

import {
  getCoachSessionList,
  markCoachAttendance,
} from "../services/coachLinks";
import { errorMessage } from "../helpers/errorMessage";

const formatTime = (time) => time?.slice(0, 5) ?? "";

function formatDate(iso) {
  if (!iso) return "";

  const text = new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function joinNames(names) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

const isMarked = (session) => ["attended", "no_show"].includes(session.status);

/*
 * Página do professor (sem login), aberta no celular, na quadra:
 * experimentais do dia/local do link, agrupadas por horário, com
 * Veio / Faltou grandes e a avaliação interna depois do Veio.
 */
export default function CoachSession() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setSessions(await getCoachSessionList(token));
      } catch (err) {
        console.error("Erro ao carregar a aula:", err);
        setError(
          errorMessage(err, "Não foi possível abrir a lista. Confira a internet e tente de novo."),
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  function updateSession(sessionId, changes) {
    setSessions((current) =>
      current.map((session) =>
        session.session_id === sessionId ? { ...session, ...changes } : session,
      ),
    );
  }

  const groups = useMemo(() => {
    const byTime = new Map();

    sessions.forEach((session) => {
      const time = formatTime(session.experimental_time);
      if (!byTime.has(time)) byTime.set(time, []);
      byTime.get(time).push(session);
    });

    return [...byTime.entries()];
  }, [sessions]);

  const first = sessions[0];
  const locations = [...new Set(sessions.map((session) => session.location_name).filter(Boolean))];
  const marked = sessions.filter(isMarked).length;
  const canMarkAny = sessions.some((session) => session.can_mark);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-lg px-4 pb-4 pt-5">
          <img
            src="/logo-recorte-vermelho.svg"
            alt="Escola Oficial do Inter, Viamão"
            width={112}
            height={46}
            className="h-auto w-28"
          />

          <h1 className="mt-4 font-display text-[2.4rem] font-semibold leading-[0.9]">
            Experimentais do dia
          </h1>

          {first && (
            <p className="mt-1.5 text-sm text-muted">
              {formatDate(first.session_date)}
              {locations.length > 0 && (
                <span className="mt-0.5 flex items-center gap-1.5 text-ink">
                  <MapPin size={15} aria-hidden="true" className="shrink-0 text-muted" />
                  {joinNames(locations)}
                </span>
              )}
            </p>
          )}

          {sessions.length > 0 && canMarkAny && (
            <div className="mt-4">
              <p className="text-sm font-medium tabular-nums" aria-live="polite">
                {marked === sessions.length
                  ? "Tudo marcado. Obrigado!"
                  : `${marked} de ${sessions.length} marcadas`}
              </p>

              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-label="Presenças marcadas"
                aria-valuemin={0}
                aria-valuemax={sessions.length}
                aria-valuenow={marked}
              >
                <div
                  className="h-full rounded-full bg-ok transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${(marked / sessions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-12 pt-5">
        {loading && (
          <p role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            Abrindo a lista…
          </p>
        )}

        {!loading && error && (
          <p role="alert" className="rounded-xl border border-line bg-white p-5 text-center">
            <span className="block font-semibold text-alert-text">{error}</span>
            <span className="mt-1 block text-sm text-muted">
              Se o link for de outro dia, peça um novo à coordenação.
            </span>
          </p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-muted">
            Nenhuma experimental marcada para este dia.
          </p>
        )}

        {!loading && !error && sessions.length > 0 && marked === sessions.length && (
          <p className="mb-5 flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
            <CheckCircle2 size={18} aria-hidden="true" className="shrink-0" />
            Todas as presenças marcadas. A coordenação já vê no painel.
          </p>
        )}

        <div className="space-y-6">
          {groups.map(([time, items]) => (
            <section key={time} aria-labelledby={`hora-${time}`}>
              <h2
                id={`hora-${time}`}
                className="mb-2 flex items-baseline gap-2 font-display text-[1.75rem] font-semibold leading-none tabular-nums"
              >
                {time}
                <span className="font-sans text-sm font-normal text-muted">
                  {items.length} {items.length === 1 ? "criança" : "crianças"}
                </span>
              </h2>

              <div className="space-y-3">
                {items.map((session) => (
                  <SessionCard
                    key={session.session_id}
                    token={token}
                    session={session}
                    onChange={(changes) => updateSession(session.session_id, changes)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function SessionCard({ token, session, onChange }) {
  const [saving, setSaving] = useState(null); // "attended" | "no_show" | "feedback"
  const [feedback, setFeedback] = useState(session.coach_feedback ?? "");
  const [savedFeedback, setSavedFeedback] = useState(session.coach_feedback ?? "");
  const [error, setError] = useState("");

  const attended = session.status === "attended";
  const noShow = session.status === "no_show";
  const feedbackId = `avaliacao-${session.session_id}`;

  const meta = [
    session.age != null ? `${session.age} anos` : null,
    session.category_name,
    session.group_name,
  ].filter(Boolean);

  async function mark(value) {
    try {
      setSaving(value ? "attended" : "no_show");
      setError("");

      const status = await markCoachAttendance(token, session.session_id, value);

      onChange({ status });
    } catch (err) {
      console.error("Erro ao marcar presença:", err);
      setError(errorMessage(err, "Não foi possível salvar. Confira a internet e toque de novo."));
    } finally {
      setSaving(null);
    }
  }

  async function saveFeedback() {
    try {
      setSaving("feedback");
      setError("");

      await markCoachAttendance(token, session.session_id, null, feedback);

      setSavedFeedback(feedback);
      onChange({ coach_feedback: feedback });
    } catch (err) {
      console.error("Erro ao salvar avaliação:", err);
      setError(errorMessage(err, "Não foi possível salvar a avaliação. Tente de novo."));
    } finally {
      setSaving(null);
    }
  }

  const choiceClass = (selected, tone) =>
    `flex h-12 items-center justify-center gap-2 rounded-lg border text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60 ${
      selected
        ? tone === "ok"
          ? "border-ok bg-ok text-white"
          : "border-ink bg-ink text-white"
        : "border-line bg-white text-ink hover:border-neutral-400"
    }`;

  const feedbackChanged = feedback.trim() !== savedFeedback.trim();

  return (
    <article className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-lg font-semibold leading-tight">{session.child_label}</h3>
      {meta.length > 0 && <p className="mt-0.5 text-sm text-muted">{meta.join(", ")}</p>}

      {session.coach_notes && (
        <p className="mt-3 border-l-2 border-line pl-3 text-sm">
          <span className="block text-muted">Recado da coordenação</span>
          {session.coach_notes}
        </p>
      )}

      {session.can_mark ? (
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={`Presença de ${session.child_label}`}>
          <button
            type="button"
            aria-pressed={attended}
            disabled={saving !== null}
            onClick={() => mark(true)}
            className={choiceClass(attended, "ok")}
          >
            {saving === "attended" ? (
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            ) : (
              <Check size={18} aria-hidden="true" />
            )}
            Veio
          </button>

          <button
            type="button"
            aria-pressed={noShow}
            disabled={saving !== null}
            onClick={() => mark(false)}
            className={choiceClass(noShow, "ink")}
          >
            {saving === "no_show" ? (
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            ) : (
              <X size={18} aria-hidden="true" />
            )}
            Faltou
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">A presença pode ser marcada no dia da aula.</p>
      )}

      {attended && (
        <div className="mt-4 border-t border-line pt-4">
          <label htmlFor={feedbackId} className="text-sm font-medium">
            Como foi? <span className="font-normal text-muted">(só a coordenação vê)</span>
          </label>

          <textarea
            id={feedbackId}
            rows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Ex.: Bom passe, um pouco tímido. Gostou do treino."
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-neutral-500 focus:border-ink focus:outline-none focus:ring-2 focus:ring-neutral-200"
          />

          {feedbackChanged ? (
            <button
              type="button"
              disabled={saving !== null || !feedback.trim()}
              onClick={saveFeedback}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-base font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
            >
              {saving === "feedback" && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
              {saving === "feedback" ? "Salvando…" : "Salvar avaliação"}
            </button>
          ) : (
            savedFeedback.trim() && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ok">
                <Check size={16} aria-hidden="true" />
                Avaliação salva
              </p>
            )
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-alert-soft p-3 text-sm font-medium text-alert-text">
          {error}
        </p>
      )}
    </article>
  );
}
