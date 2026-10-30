import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Dialog, DialogActions, Panel, inputClass } from "../ui";
import { toast } from "../components/common/Toaster";
import { Field } from "../components/students/FieldsDialog";

import { createEvent, getEvents } from "../../services/events";
import { EVENT_STATUS_OPEN } from "../../constants/eventStatus";
import { errorMessage } from "../../helpers/errorMessage";

const formatDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "");

/*
 * Eventos que o Sogni não controla: Taça Gaúcha e rodadas,
 * passeios, copas. Cada evento guarda quem participa e se pagou.
 */
export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();

    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function load() {
    try {
      setError("");
      setEvents(await getEvents());
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setError(errorMessage(err, "Não foi possível carregar os eventos."));
    } finally {
      setLoading(false);
    }
  }

  // Evento principal com as rodadas somadas
  const seasons = useMemo(() => {
    const main = events.filter((event) => !event.parent_id);

    const rows = main.map((event) => {
      const rounds = events.filter((child) => child.parent_id === event.id);
      // Quem saiu da escola não conta (fica escondido na tela do evento)
      const stillActive = (participant) => participant.students?.status !== "left";
      const participants = (event.event_participants ?? []).filter(stillActive);
      const open = [event, ...rounds]
        .flatMap((item) => item.event_participants ?? [])
        .filter((participant) => stillActive(participant) && EVENT_STATUS_OPEN.has(participant.status)).length;

      return { event, rounds, total: participants.length, open };
    });

    return [...new Set(rows.map((row) => row.event.season))]
      .sort((a, b) => b - a)
      .map((season) => ({ season, rows: rows.filter((row) => row.event.season === season) }));
  }, [events]);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Eventos"
        summary="Campeonatos, rodadas, passeios e copas: quem participa e quem já pagou."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={18} aria-hidden="true" />
            Novo evento
          </Button>
        }
      />

      {loading ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando eventos…
        </p>
      ) : error ? (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>
          <Button className="mt-3" onClick={load}>
            Tentar de novo
          </Button>
        </Panel>
      ) : seasons.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">Nenhum evento ainda.</p>
          <p className="mt-1 text-sm text-muted">
            A importação da planilha cria a Taça Gaúcha e as rodadas. Ou cadastre um evento novo.
          </p>
        </Panel>
      ) : (
        seasons.map(({ season, rows }) => (
          <section key={season} aria-labelledby={`season-${season}`} className="space-y-2">
            <h2 id={`season-${season}`} className="font-display text-2xl font-semibold">
              {season}
            </h2>
            <Panel as="ul" className="overflow-hidden">
              {rows.map(({ event, rounds, total, open }) => (
                <li key={event.id} className="border-t border-line first:border-t-0">
                  <Link to={`/admin/events/${event.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-canvas">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{event.name}</span>
                      <span className="block text-sm text-muted">
                        {[
                          event.event_date ? formatDate(event.event_date) : null,
                          rounds.length ? `${rounds.length} rodada${rounds.length === 1 ? "" : "s"}` : null,
                          `${total} aluno${total === 1 ? "" : "s"}`,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                    {open > 0 && (
                      <span className="shrink-0 text-sm font-medium text-attention-text">
                        {open} para cobrar ou devolver
                      </span>
                    )}
                    <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-neutral-300" />
                  </Link>
                </li>
              ))}
            </Panel>
          </section>
        ))
      )}

      <NewEventDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function NewEventDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ name: "", season: String(new Date().getFullYear()), date: "", fee: "", rounds: "0" });
    setError("");
  }, [open]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();

    const season = Number(form.season);
    const rounds = Number(form.rounds) || 0;

    if (!form.name.trim()) return setError("Informe o nome do evento.");
    if (!(season >= 2020 && season <= 2100)) return setError("Informe a temporada (ano).");
    if (rounds < 0 || rounds > 20) return setError("Use de 0 a 20 rodadas.");

    try {
      setSaving(true);
      setError("");

      const created = await createEvent({
        name: form.name.trim(),
        season,
        event_date: form.date || null,
        fee: form.fee ? Number(form.fee.replace(",", ".")) : null,
      });

      for (let index = 1; index <= rounds; index += 1) {
        await createEvent({ name: `Rodada ${index}`, season, parent_id: created.id, position: index });
      }

      toast("Evento criado. Agora adicione os alunos.", { type: "success" });
      onClose();
      navigate(`/admin/events/${created.id}`);
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      setError(errorMessage(err, "Não foi possível criar o evento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      title="Criar evento"
      description="Campeonato, passeio ou copa. Rodadas viram colunas na tabela do evento."
      footer={
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="new-event" disabled={saving}>
            {saving ? "Criando…" : "Criar evento"}
          </Button>
        </DialogActions>
      }
    >
      <form id="new-event" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *" className="sm:col-span-2">
          <input value={form.name ?? ""} onChange={update("name")} placeholder="Ex.: Taça Gaúcha" className={inputClass} data-autofocus />
        </Field>
        <Field label="Temporada *">
          <input type="number" inputMode="numeric" value={form.season ?? ""} onChange={update("season")} className={inputClass} />
        </Field>
        <Field label="Data">
          <input type="date" value={form.date ?? ""} onChange={update("date")} className={inputClass} />
        </Field>
        <Field label="Taxa (R$)">
          <input inputMode="decimal" value={form.fee ?? ""} onChange={update("fee")} placeholder="Ex.: 80,00" className={inputClass} />
        </Field>
        <Field label="Rodadas">
          <input type="number" inputMode="numeric" min="0" max="20" value={form.rounds ?? ""} onChange={update("rounds")} className={inputClass} />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert-text sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
