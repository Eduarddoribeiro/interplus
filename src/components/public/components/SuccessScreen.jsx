import {
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SuccessScreen({ type = "scheduled" }) {
  const isWaitingList = type === "waiting_list";

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-12"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,.18)]">

        {/* HEADER */}

        <div
          className="relative overflow-hidden px-10 py-12 text-center text-white"
          style={{
            background:
              "linear-gradient(135deg,#170507 0%,#2a0810 45%,#8b0a1c 100%)",
          }}
        >
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-500/20 blur-[120px]" />

          <div className="relative z-10">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>

            <span className="mt-8 block text-xs uppercase tracking-[0.25em] text-white/60">
              {isWaitingList
                ? "INTERESSE REGISTRADO"
                : "SOLICITAÇÃO RECEBIDA"}
            </span>

            <h2 className="mt-3 font-display text-5xl font-black uppercase leading-none">
              {isWaitingList
                ? "Turma em formação"
                : "Agendamento enviado"}
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/75">
              {isWaitingList
                ? "Seu interesse foi registrado com sucesso. Assim que a nova turma estiver pronta para iniciar os treinamentos, nossa equipe entrará em contato para agendar a primeira aula experimental."
                : "Recebemos sua solicitação de aula experimental. Em breve nossa equipe entrará em contato para confirmar a disponibilidade do horário escolhido."}
            </p>

          </div>
        </div>

        {/* CONTEÚDO */}

        <div className="bg-neutral-50 p-10">

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <MessageCircle className="h-8 w-8 text-red-600" />

              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                {isWaitingList
                  ? "Entraremos em contato"
                  : "Aguarde nosso contato"}
              </h3>

              <p className="mt-3 text-sm leading-7 text-neutral-500">
                {isWaitingList
                  ? "Assim que a turma atingir o número necessário de atletas, avisaremos você pelo WhatsApp."
                  : "Nossa equipe entrará em contato pelo WhatsApp informado para confirmar seu agendamento."}
              </p>

            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <CalendarCheck className="h-8 w-8 text-red-600" />

              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                {isWaitingList
                  ? "Você terá prioridade"
                  : "Prepare-se para o treino"}
              </h3>

              <p className="mt-3 text-sm leading-7 text-neutral-500">
                {isWaitingList
                  ? "Os responsáveis que registrarem interesse serão os primeiros avisados quando a nova turma abrir."
                  : "Utilize roupas confortáveis e leve chuteira ou tênis apropriado para a atividade."}
              </p>

            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <ShieldCheck className="h-8 w-8 text-red-600" />

              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Bem-vindo à Escola
              </h3>

              <p className="mt-3 text-sm leading-7 text-neutral-500">
                Estamos felizes em receber sua família na Escola Oficial do Inter Viamão.
              </p>

            </div>

          </div>

          <div className="mt-12 flex justify-center">

            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-[0_18px_40px_rgba(200,16,46,.35)]"
            >
              {isWaitingList
                ? "Registrar outro interesse"
                : "Fazer novo agendamento"}
            </button>

          </div>

        </div>

      </div>
    </motion.div>
  );
}