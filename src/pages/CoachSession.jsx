import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Clock, Loader2, MapPin, X } from "lucide-react";

import {
  getCoachSessionList,
  markCoachAttendance,
} from "../services/coachLinks";

const formatTime = (time) => time?.slice(0, 5);

function formatDate(iso) {
  if (!iso) return "";

  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

/*
 * Página do professor (sem login): experimentais do dia/local do
 * link, com "Veio / Faltou" e avaliação interna.
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
        setError(err?.message || "Não foi possível abrir a lista.");
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

  const first = sessions[0];
  const locations = [...new Set(sessions.map((session) => session.location_name).filter(Boolean))];
  const pending = sessions.filter(
    (session) => !["attended", "no_show"].includes(session.status),
  ).length;

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6">
      <div className="mx-auto max-w-lg">
        <header className="text-center">
          <img
            src="/logo-vermelho.png"
            alt="Escola do Inter Viamão"
            className="mx-auto h-14 w-40 object-cover"
          />

          <h1 className="mt-3 text-2xl font-bold text-neutral-900">
            Experimentais do dia
          </h1>

          {first && (
            <p className="mt-1 capitalize text-neutral-600">
              {formatDate(first.session_date)}
            </p>
          )}

          {locations.length > 0 && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-neutral-700">
              <MapPin size={15} className="text-red-600" />
              {locations.join(" · ")}
            </p>
          )}
        </header>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-neutral-500">
              <Loader2 size={18} className="animate-spin" />
              Carregando...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
              Nenhuma experimental marcada para este dia.
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <p className="text-center text-sm text-neutral-500">
              {pending === 0
                ? "Tudo marcado. Obrigado! 🙌"
                : `${pending} para marcar`}
            </p>
          )}

          {sessions.map((session) => (
            <SessionCard
              key={session.session_id}
              token={token}
              session={session}
              onChange={(changes) => updateSession(session.session_id, changes)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function SessionCard({ token, session, onChange }) {
  const [saving, setSaving] = useState(null); // "attended" | "no_show" | "feedback"
  const [feedback, setFeedback] = useState(session.coach_feedback ?? "");
  const [savedFeedback, setSavedFeedback] = useState(session.coach_feedback ?? "");
  const [error, setError] = useState("");

  const attended = session.status === "attended";
  const noShow = session.status === "no_show";

  async function mark(value) {
    try {
      setSaving(value ? "attended" : "no_show");
      setError("");

      const status = await markCoachAttendance(token, session.session_id, value);

      onChange({ status });
    } catch (err) {
      console.error("Erro ao marcar presença:", err);
      setError(err?.message || "Não foi possível salvar.");
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
      setError(err?.message || "Não foi possível salvar a avaliação.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <article
      className={`rounded-2xl border bg-white p-4 ${
        attended ? "border-green-300" : noShow ? "border-red-200" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <Clock size={14} />
            {formatTime(session.experimental_time)} · {session.category_name}
          </p>

          <h2 className="mt-1 text-xl font-bold text-neutral-900">{session.child_label}</h2>

          <p className="text-sm text-neutral-500">
            {session.age != null ? `${session.age} anos` : ""}
            {session.group_name ? ` · ${session.group_name}` : ""}
          </p>
        </div>

        {(attended || noShow) && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              attended ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
            }`}
          >
            {attended ? "Veio" : "Faltou"}
          </span>
        )}
      </div>

      {session.coach_notes && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          📝 {session.coach_notes}
        </p>
      )}

      {session.can_mark ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => mark(true)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition ${
              attended
                ? "bg-green-600 text-white"
                : "border border-green-300 text-green-800 hover:bg-green-50"
            } disabled:opacity-60`}
          >
            {saving === "attended" ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Veio
          </button>

          <button
            type="button"
            disabled={saving !== null}
            onClick={() => mark(false)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition ${
              noShow
                ? "bg-red-600 text-white"
                : "border border-red-200 text-red-700 hover:bg-red-50"
            } disabled:opacity-60`}
          >
            {saving === "no_show" ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            Faltou
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-center text-sm text-neutral-500">
          A presença pode ser marcada no dia da aula.
        </p>
      )}

      {attended && (
        <div className="mt-4">
          <label className="text-sm font-semibold text-neutral-800">
            Como foi? <span className="font-normal text-neutral-400">(só a equipe vê)</span>
          </label>

          <textarea
            rows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Ex.: Bom nível, um pouco tímido. Gostou do treino."
            className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-base outline-none focus:border-red-500"
          />

          {feedback.trim() !== savedFeedback.trim() && (
            <button
              type="button"
              disabled={saving !== null || !feedback.trim()}
              onClick={saveFeedback}
              className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving === "feedback" ? "Salvando..." : "Salvar avaliação"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
      )}
    </article>
  );
}
