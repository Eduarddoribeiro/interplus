import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../../services/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">

        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
            Escola do Inter • Viamão
          </span>

          <h1 className="mt-3 text-3xl font-bold text-neutral-900">
            Acesso Administrativo
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Entre com suas credenciais para acessar o painel.
          </p>
        </div>

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
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-red-600"
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
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-red-600"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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