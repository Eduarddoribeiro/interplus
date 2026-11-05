import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { BRAND } from "../../constants/brand";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <img
          src={BRAND.logo}
          alt={BRAND.logoAlt}
          width={160}
          height={65}
          className="h-auto w-40"
        />

        <p role="status" className="text-sm text-muted">
          Carregando…
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return children;
}