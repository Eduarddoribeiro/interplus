import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { signIn } from "../../services/auth";
import { supabase } from "../../lib/supabase";
import { Button, inputClass } from "../ui";
import { errorMessage } from "../../helpers/errorMessage";

/*
 * Login da equipe.
 *
 * No computador, a tela se divide: o painel vermelho com o logo da
 * escola e o formulário; ali o botão Entrar fica em tinta, para não
 * competir com o painel. No celular e no tablet, o logo centralizado
 * e "Painel da equipe" ficam no topo, o formulário logo abaixo, e o
 * botão volta ao vermelho (é a única ação da tela).
 *
 * Os campos usam 16px no celular: abaixo disso o iPhone dá zoom ao
 * tocar no campo.
 *
 * Para usar uma foto no painel da marca, coloque-a em public/ e
 * preencha BRAND_PHOTO (ex.: "/login-treino.jpg"). A camada vermelha
 * por cima é forte (85%), então a foto aparece só como textura.
 */
const BRAND_PHOTO = null;

const loginInputClass = inputClass
  .replace("text-sm", "text-base lg:text-sm")
  .replace("py-2.5", "py-3 lg:py-2.5");

export default function Login() {
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quem já está logado vai direto para o painel, sem ver o formulário
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
      else setCheckingSession(false);
    });
  }, [navigate]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Entrar – Painel da equipe";

    // Adianta o download do painel, para não ficar tela em branco
    // depois de entrar
    import("../components/ProtectedRoute").catch(() => {});
    import("../layout/Layout").catch(() => {});
    import("./Dashboard").catch(() => {});

    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Foco no e-mail só no computador: no celular abriria o teclado
  // assim que a tela aparece
  useEffect(() => {
    if (!checkingSession && window.matchMedia("(min-width: 1024px)").matches) {
      emailRef.current?.focus();
    }
  }, [checkingSession]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      await signIn(email, password);

      navigate("/admin", {
        replace: true,
      });
    } catch (err) {
      setError(
        /invalid login credentials/i.test(err?.message ?? "")
          ? "E-mail ou senha incorretos."
          : errorMessage(err, "Não foi possível entrar. Confira sua conexão e tente de novo.")
      );
    } finally {
      setLoading(false);
    }
  }

  // Enter no e-mail passa para a senha (a tecla mostra "Próximo")
  function handleEmailKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  }

  if (checkingSession) {
    return <div className="min-h-screen bg-canvas" />;
  }

  const fieldError = error
    ? { "aria-invalid": true, "aria-describedby": "login-error" }
    : {};

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Painel da marca (só no computador) */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-inter-red p-12 text-white lg:flex">
        {BRAND_PHOTO && (
          <>
            <img
              src={BRAND_PHOTO}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-inter-red/85" aria-hidden="true" />
          </>
        )}

        <img
          src="/logo-recorte-branco.svg"
          alt="Escola Oficial do Inter, Viamão"
          width={220}
          height={89}
          className="relative h-auto w-[220px]"
        />

        <div className="relative">
          <p className="font-display text-6xl font-semibold leading-[0.85]">
            Painel da equipe
          </p>

          <p className="mt-4 max-w-sm">
            Contatos, aulas experimentais e retornos da Escola Oficial do Inter em Viamão/RS.
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 justify-center px-4 pb-10 pt-12 sm:px-6 sm:pt-20 lg:items-center lg:py-10">
        <div className="w-full max-w-sm">
          {/* Celular e tablet: marca centralizada no topo */}
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/logo-recorte-vermelho.svg"
              alt="Escola Oficial do Inter, Viamão"
              width={192}
              height={78}
              className="mx-auto h-auto w-48"
            />

            <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[0.9] text-ink">
              Painel da equipe
            </h1>
          </div>

          {/* Computador: a marca já está no painel vermelho */}
          <div className="hidden lg:mb-8 lg:block">
            <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9] text-ink">
              Entrar
            </h1>

            <p className="mt-2 text-sm text-muted">
              Use o e-mail e a senha da sua conta da equipe.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={loading}>
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink">
                  E-mail
                </label>

                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  enterKeyHint="next"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="seu@email.com"
                  className={loginInputClass}
                  {...fieldError}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
                  Senha
                </label>

                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className={`${loginInputClass} pr-12`}
                    {...fieldError}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </fieldset>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="mt-5 rounded-lg bg-alert-soft px-3 py-2.5 text-sm text-alert-text"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              aria-disabled={loading}
              className={`mt-6 h-12 w-full text-base lg:h-11 lg:bg-ink lg:text-sm lg:hover:bg-neutral-800 ${
                loading ? "cursor-wait" : ""
              }`}
            >
              {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Esqueceu a senha? Fale com a coordenação.
          </p>
        </div>
      </main>
    </div>
  );
}
