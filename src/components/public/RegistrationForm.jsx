import { useState } from "react";
import { motion } from "framer-motion";

import ProgressBar from "./components/ProgressBar";
import AthleteForm from "./components/AthleteForm";
import ScheduleSelector from "./components/ScheduleSelector";
import ResponsibleForm from "./components/ResponsibleForm";
import ReviewCard from "./components/ReviewCard";
import SuccessScreen from "./components/SuccessScreen";
import { createContact } from "../../services/contacts";

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    // Atleta
    child_name: "",
    birth_date: "",

    // Categoria encontrada automaticamente
    category: null,

    // Aula experimental
    experimental_date: "",
    experimental_time: "",

    // Responsável
    responsible_name: "",
    phone: "",
    email: "",
    neighborhood: "",

    // Histórico
    trained_elsewhere: false,
    previous_club: "",

    // Origem
    source: "Instagram",
    observations: "",
  });

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  if (success) {
    return <SuccessScreen type={success} />;
  }

  async function handleFinish() {
    try {
      const isWaitingList =
        form.category?.trial_status === "waiting_list";

      await createContact({
        child_name: form.child_name,
        birth_date: form.birth_date,

        responsible_name: form.responsible_name,
        phone: form.phone,
        email: form.email,
        neighborhood: form.neighborhood,

        source: form.source,

        trained_elsewhere: form.trained_elsewhere,
        previous_club: form.previous_club,

        observations: form.observations,

        category_id: form.category?.id,

        experimental_date: isWaitingList
          ? null
          : form.experimental_date,

        experimental_time: isWaitingList
          ? null
          : form.experimental_time,

        status: isWaitingList
          ? "waiting_list"
          : "pending_confirmation",

        unit: "Viamão",
      });

      setSuccess(
        isWaitingList
          ? "waiting_list"
          : "scheduled"
      );
    } catch (error) {
      console.error(error);
      alert(
        "Não foi possível enviar sua solicitação. Tente novamente."
      );
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,.18)]">
      {/* HEADER */}
      <div
        className="relative overflow-hidden border-b border-white/10 px-10 py-10 text-white"
        style={{
          background:
            "linear-gradient(135deg,#170507 0%,#2a0810 45%,#8b0a1c 100%)",
        }}
      >
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-500/20 blur-[120px]" />

        <div className="relative z-10">
          <span className="text-xs uppercase tracking-[0.25em] text-white/60">
            AULA EXPERIMENTAL
          </span>

          <h2 className="mt-3 font-display text-5xl font-black uppercase leading-none">
            Agendamento
          </h2>

          <p className="mt-4 max-w-2xl text-white/70">
            Informe os dados do atleta, escolha uma data disponível para a aula
            experimental e finalize sua solicitação. Nossa equipe confirmará o
            agendamento pelo WhatsApp.
          </p>

          <div className="mt-10">
            <ProgressBar current={step} total={4} />
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="bg-neutral-50 p-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
        >
          {step === 1 && (
            <AthleteForm
              form={form}
              updateField={updateField}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <ScheduleSelector
              form={form}
              updateField={updateField}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <ResponsibleForm
              form={form}
              updateField={updateField}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <ReviewCard
              form={form}
              onBack={() => setStep(3)}
              onFinish={handleFinish}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}