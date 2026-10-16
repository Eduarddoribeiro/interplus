import {
  AlertTriangle,
  Clock3,
  RotateCcw,
} from "lucide-react";

import {
  getFollowUpState,
} from "../../../helpers/followUpRules";

export default function FollowUpProgress({
  contact,
}) {
  const state = getFollowUpState(contact);

  if (state.limitReached) {
    return (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="font-semibold text-red-900">
              Limite de acompanhamento atingido
            </p>

            <p className="mt-1 text-sm leading-5 text-red-700">
              Este contato precisa de uma decisão
              comercial antes de continuar.
            </p>
          </div>
        </div>

        <FollowUpMetrics state={state} />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Clock3
          size={17}
          className="text-neutral-500"
        />

        <p className="text-sm font-semibold text-neutral-800">
          Ciclo de acompanhamento
        </p>
      </div>

      <FollowUpMetrics state={state} />
    </div>
  );
}

function FollowUpMetrics({ state }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Metric
        icon={RotateCcw}
        label="Tentativas"
        value={`${state.attempts} de ${state.maxAttempts}`}
        helper={
          state.remainingAttempts === 1
            ? "1 tentativa restante"
            : `${state.remainingAttempts} tentativas restantes`
        }
      />

      <Metric
        icon={Clock3}
        label="Tempo de acompanhamento"
        value={`${state.elapsedDays} de ${state.maxCycleDays} dias`}
        helper={
          state.remainingDays === 1
            ? "1 dia restante"
            : `${state.remainingDays} dias restantes`
        }
      />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon size={15} />

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-neutral-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-neutral-400">
        {helper}
      </p>
    </div>
  );
}