import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";

import ProgressBar from "./components/ProgressBar";
import AthleteForm from "./components/AthleteForm";
import ScheduleSelector from "./components/ScheduleSelector";
import ResponsibleForm from "./components/ResponsibleForm";
import ReviewCard from "./components/ReviewCard";
import SuccessScreen from "./components/SuccessScreen";

import { submitPublicRegistration } from "../../services/publicRegistration";
import { getSourceFromUrl } from "../../constants/school";

const INITIAL_FORM = {
  child_name: "",
  birth_date: "",

  modality: null,
  category: null,

  unit: null,
  location: null,
  training_group: null,
  schedule: null,

  experimental_date: "",
  experimental_time: "",

  responsible_name: "",
  phone: "",
  neighborhood: "",

  // LGPD: autorização obrigatória; website é o campo anti-robô
  consent: false,
  website: "",

  trained_elsewhere: false,
  previous_club: "",

  preferred_position: "",
  coach_notes: "",

  // Vem do link (?origem=instagram); senão o responsável escolhe
  source: "",

  // Lista de Interesse (Cenário 1 e 2)
  interest_reason: null,
  preferred_location: null,
  preferred_shift: "any",
  observations: "",
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    source: getSourceFromUrl(),
  }));

  const topRef = useRef(null);
  const firstRender = useRef(true);

  /*
   * No celular, cada etapa nova começa do topo do formulário.
   * O foco vai para o título da etapa, para o leitor de tela
   * anunciar a mudança.
   */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    topRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    const heading = topRef.current?.querySelector("h2");

    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }, [step, success]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // Irmãos: recomeça pelo atleta, mantendo os dados do responsável
  function handleRestart() {
    setForm((prev) => ({
      ...INITIAL_FORM,
      source: prev.source,
      responsible_name: prev.responsible_name,
      phone: prev.phone,
      neighborhood: prev.neighborhood,
      consent: prev.consent,
    }));
    setSuccess(null);
    setStep(1);
  }

  function handleJoinInterestList() {
    setStep(3);
  }

  async function handleFinish() {
    if (submitting) return;

    const isInterestList = !!form.interest_reason;

    const common = {
      child_name: form.child_name,
      birth_date: form.birth_date,

      responsible_name: form.responsible_name,
      phone: form.phone,
      neighborhood: form.neighborhood,

      source: form.source || null,

      consent: form.consent,
      website: form.website,

      category_id: form.category?.id,
    };

    /*
     * Status, canal de entrada, horário, unidade, local, turma e
     * modalidade são definidos pela função public_register a
     * partir do horário escolhido — o site público não grava
     * direto nas tabelas.
     */
    const payload = isInterestList
      ? {
          ...common,
          location_id: form.preferred_location?.id || null,
          preferred_shift: form.preferred_shift || null,
          observations: form.observations || null,
          waiting_list_reason: form.interest_reason,
        }
      : {
          ...common,
          trained_elsewhere: form.trained_elsewhere,
          previous_club: form.trained_elsewhere ? form.previous_club : null,
          preferred_position: form.preferred_position,
          coach_notes: form.coach_notes,
          experimental_date: form.experimental_date,
          training_group_schedule_id: form.schedule?.schedule_id,
        };

    try {
      setSubmitting(true);
      setSubmitError("");

      const type = await submitPublicRegistration(payload);

      setSuccess(type);
    } catch (error) {
      console.error("Erro ao enviar cadastro:", error);

      // As mensagens da função já vêm em português e são para o responsável
      setSubmitError(
        error?.message && !/fetch|network/i.test(error.message)
          ? error.message
          : "Não foi possível enviar agora. Verifique sua internet e tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <div ref={topRef} className="scroll-mt-4">
      {success ? (
        <SuccessScreen type={success} form={form} onRestart={handleRestart} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-5 pt-5 sm:px-8 sm:pt-7">
            <ProgressBar current={step} total={4} />
          </div>

          <div className="p-5 sm:p-8">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
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
                  submitting={submitting}
                  error={submitError}
                  onBack={() => {
                    setSubmitError("");
                    setStep(3);
                  }}
                  onFinish={handleFinish}
                />
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
    </MotionConfig>
  );
}
