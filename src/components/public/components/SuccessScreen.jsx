import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";

import { WEEKDAY_LABELS } from "../../../constants/weekdays";
import { SCHOOL } from "../../../constants/school";
import { downloadIcs, googleCalendarUrl, mapsUrl } from "../../../utils/calendar";

const formatTime = (time) => time?.slice(0, 5);

function formatDate(iso) {
  if (!iso) return "";

  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

// O calçado muda conforme o piso
function whatToBring(modalityName = "") {
  const isFutsal = /futsal/i.test(modalityName);

  return [
    "Roupa confortável para treinar",
    isFutsal
      ? "Tênis de futsal (sola lisa) ou tênis comum"
      : "Chuteira society ou tênis",
    "Garrafinha de água",
    "Chegar 10 minutos antes",
  ];
}

export default function SuccessScreen({ type = "scheduled", form, onRestart }) {
  const isWaitingList = type === "waiting_list";
  const firstName = form?.child_name?.trim().split(" ")[0];

  const schedule = form?.schedule;
  const location = form?.location;

  const event = schedule && {
    title: `Aula experimental — ${firstName ?? "Escola do Inter"}`,
    date: form.experimental_date,
    start: schedule.start_time,
    end: schedule.end_time,
    location: [location?.name, location?.address].filter(Boolean).join(", "),
    details: `${SCHOOL.name}\n${form.training_group?.name ?? ""}\nLeve: ${whatToBring(form.modality?.name).join(", ")}.`,
  };

  const whatsappUrl = SCHOOL.whatsapp
    ? `https://wa.me/${SCHOOL.whatsapp}?text=${encodeURIComponent(
        `Olá! Acabei de agendar a aula experimental de ${firstName ?? "meu filho"}.`,
      )}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
    >
      {/* CABEÇALHO */}
      <div className="px-5 pt-8 text-center sm:px-8">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-green-600" />

        <h2 className="mt-4 text-2xl font-bold text-neutral-900 outline-none sm:text-3xl">
          {isWaitingList ? "Interesse registrado!" : "Aula solicitada!"}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-neutral-600">
          {isWaitingList
            ? `Assim que abrir vaga para ${form?.category?.name ?? "a categoria"}, avisamos pelo WhatsApp.`
            : "Vamos confirmar pelo WhatsApp informado. Enquanto isso, já deixe na agenda."}
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-8">

        {/* RESUMO DA AULA */}
        {!isWaitingList && schedule && (
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              {form.modality?.name} · {form.category?.name}
            </p>

            <ul className="mt-3 space-y-2 text-neutral-800">
              <li className="flex items-center gap-2">
                <CalendarDays size={17} aria-hidden="true" className="text-neutral-400" />
                <span className="font-semibold">
                  {WEEKDAY_LABELS[schedule.weekday]}, {formatDate(form.experimental_date)}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <Clock size={17} aria-hidden="true" className="text-neutral-400" />
                {formatTime(schedule.start_time)} às {formatTime(schedule.end_time)}
              </li>

              <li className="flex items-start gap-2">
                <MapPin size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-neutral-400" />
                <span>
                  <span className="font-semibold">{location?.name}</span>
                  {location?.address && (
                    <span className="block text-sm text-neutral-600">
                      {location.address}
                    </span>
                  )}
                </span>
              </li>
            </ul>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                <CalendarPlus size={16} aria-hidden="true" />
                Google Agenda
              </a>

              <button
                type="button"
                onClick={() => downloadIcs(event)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                <CalendarPlus size={16} aria-hidden="true" />
                Agenda do iPhone
              </button>

              <a
                href={mapsUrl(location?.name, location?.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                <Navigation size={16} aria-hidden="true" />
                Como chegar
              </a>
            </div>
          </div>
        )}

        {/* O QUE LEVAR */}
        {!isWaitingList && (
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-bold text-neutral-900">O que levar</h3>

            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {whatToBring(form?.modality?.name).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} aria-hidden="true" className="shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Falar com a escola no WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mx-auto block rounded text-sm font-semibold text-neutral-600 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-red-600/30"
        >
          {isWaitingList ? "Registrar outro atleta" : "Agendar outro atleta"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          Para irmãos: seus dados de contato já ficam preenchidos.
        </p>

      </div>
    </motion.div>
  );
}
