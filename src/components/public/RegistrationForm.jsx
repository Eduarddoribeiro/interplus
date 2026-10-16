import { useState } from "react";
import { motion } from "framer-motion";

import ProgressBar from "./components/ProgressBar";
import AthleteForm from "./components/AthleteForm";
import ScheduleSelector from "./components/ScheduleSelector";
import ResponsibleForm from "./components/ResponsibleForm";
import ReviewCard from "./components/ReviewCard";
import SuccessScreen from "./components/SuccessScreen";

import { submitPublicRegistration } from "../../services/publicRegistration";

const INITIAL_FORM = {
  child_name: "",
  birth_date: "",

  modality: null,
  category: null,

  unit: null,
  training_group: null,
  schedule: null,

  experimental_date: "",
  experimental_time: "",

  responsible_name: "",
  phone: "",
  email: "",
  neighborhood: "",

  trained_elsewhere: false,
  previous_club: "",

  preferred_position: "",
  coach_notes: "",

  source: "instagram",

  // Lista de Interesse (Cenário 1 e 2)
  interest_reason: null,
  preferred_shift: "any",
  observations: "",
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }
  function handleJoinInterestList() {
    setStep(3);
  }

   async function handleFinish() {
    const isInterestList = !!form.interest_reason;

    /*
     * Status, canal de entrada e horário da experimental são
     * definidos pela função public_register no banco — o site
     * público não grava direto nas tabelas.
     */
    try {
      if (isInterestList) {
        const type = await submitPublicRegistration({
          child_name: form.child_name,
          birth_date: form.birth_date,

          responsible_name: form.responsible_name,
          phone: form.phone,
          email: form.email,
          neighborhood: form.neighborhood,

          modality_id: form.modality?.id,

          category_id: form.category?.id,

          unit_id: form.unit?.id || null,
          unit: form.unit?.name || null,

          preferred_shift: form.preferred_shift || null,
          observations: form.observations || null,

          waiting_list_reason: form.interest_reason,
        });

        setSuccess(type);
        return;
      }

      const type = await submitPublicRegistration({
        child_name: form.child_name,
        birth_date: form.birth_date,

        responsible_name: form.responsible_name,
        phone: form.phone,
        email: form.email,
        neighborhood: form.neighborhood,

        trained_elsewhere: form.trained_elsewhere,

        previous_club: form.trained_elsewhere
          ? form.previous_club
          : null,

        preferred_position: form.preferred_position,

        coach_notes: form.coach_notes,

        modality_id: form.modality?.id,

        category_id: form.category?.id,

        experimental_date: form.experimental_date,

        training_group_schedule_id: form.schedule?.id,
      });

      setSuccess(type);
    } catch (error) {
      console.error("Erro completo:", error);

      alert(
        `${error?.message || "Erro desconhecido"}\n\n` +
        `${error?.details || ""}`
      );
    }
  }

  if (success) {
    return <SuccessScreen type={success} />;
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
            Informe os dados do atleta, escolha a modalidade, a turma e o
            horário disponíveis para a aula experimental e finalize sua
            solicitação. Nossa equipe confirmará o agendamento pelo
            WhatsApp.
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
              onInterestList={handleJoinInterestList}
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