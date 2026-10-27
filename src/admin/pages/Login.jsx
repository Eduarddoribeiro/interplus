import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../../services/auth";
import { isDemo } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  // Na demonstração o acesso já vem preenchido (qualquer senha entra)
  const [email, setEmail] = useState(isDemo ? "demonstracao@exemplo.com" : "");
  const [password, setPassword] = useState(isDemo ? "demonstracao" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      console.error("Erro no login:", err);

      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-8">

        <div className="mb-8">
          <span className="text-sm font-medium text-muted">
            Escola do Inter • Viamão
          </span>

          <h1 className="mt-3 text-3xl font-bold text-ink">
            Acesso Administrativo
          </h1>

          <p className="mt-2 text-sm text-muted">
            Entre com suas credenciais para acessar o painel.
          </p>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-lg bg-canvas p-3 text-sm text-muted">
            Demonstração com dados fictícios. O acesso já está preenchido: é só entrar.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              E-mail
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-ink"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Senha
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-ink"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-inter-red px-6 py-3 font-semibold text-white transition hover:bg-inter-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Entrando..."
              : "Entrar no painel"}
          </button>
        </form>

      </div>
    </div>
  );
}