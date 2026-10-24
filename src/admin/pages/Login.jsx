import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { signIn } from "../../services/auth";
import { supabase } from "../../lib/supabase";
import { Button, inputClass } from "../ui";
import { errorMessage } from "../../helpers/errorMessage";

/*
 * Login da equipe.
 *
 * No computador, a tela se divide: o painel vermelho com o logo da
 * escola e o formulário. No celular fica só o logo vermelho em cima
 * do formulário. Como o vermelho já está no painel da marca, o botão
 * Entrar fica em tinta.
 *
 * Para usar uma foto no painel da marca, coloque-a em public/ e
 * preencha BRAND_PHOTO (ex.: "/login-treino.jpg"). Uma camada
 * vermelha vai por cima para o texto continuar legível.
 */
const BRAND_PHOTO = null;

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quem já está logado vai direto para o painel
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

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
          src="/logo.svg"
          alt="Escola Oficial do Inter, Viamão"
          width={264}
          height={110}
          className="relative -ml-6 h-[110px] w-[264px] object-cover"
        />

        <div className="relative">
          <p className="font-display text-6xl font-semibold leading-[0.85]">
            Painel da equipe
          </p>

          <p className="mt-4 max-w-sm text-white/85">
            Contatos, aulas experimentais e retornos da Escola Oficial do Inter em Viamão/RS.
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <img
            src="/logo-vermelho.png"
            alt="Escola Oficial do Inter, Viamão"
            width={176}
            height={64}
            className="mb-8 h-16 w-44 object-cover lg:hidden"
          />

          <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9] text-ink">
            Entrar
          </h1>

          <p className="mt-2 text-sm text-muted">
            Use o e-mail e a senha da sua conta da equipe.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"

          >
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink">
                E-mail
              </label>

              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="seu@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
                Senha
              </label>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-alert-soft px-3 py-2.5 text-sm text-alert-text">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="ink"
              disabled={loading}
              className="h-11 w-full"
            >
              {loading ? "Entrando…" : "Entrar no painel"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
