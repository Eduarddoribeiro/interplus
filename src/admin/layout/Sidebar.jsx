import {
  LayoutDashboard,
  Users,
  CalendarDays,
  PhoneCall,
  ListChecks,
  BarChart3,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { signOut } from "../../services/auth";
import { toast } from "../components/common/Toaster";
import { Count } from "../ui";

/*
 * Contador de cada item do menu a partir das pendências da Visão
 * geral. Só aparece o que pede ação: vermelho = atrasado, âmbar =
 * atenção. Números só informativos (lista de interesse, triagem)
 * ficam nas próprias telas, para o menu não virar ruído.
 */
function menuCount(key, pending) {
  if (!pending) return null;

  switch (key) {
    case "experimentals":
      if (pending.overdue) return { value: pending.overdue, urgency: "alert" };
      if (pending.toConfirm) return { value: pending.toConfirm, urgency: "attention" };
      return null;
    case "followUps":
      return pending.followUpsDue ? { value: pending.followUpsDue, urgency: "alert" } : null;
    default:
      return null;
  }
}

const COUNT_TITLE = {
  experimentals: "experimentais com pendência",
  followUps: "retornos vencidos",
};

const menu = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard, to: "/admin" },
  { key: "contacts", label: "Contatos", icon: Users, to: "/admin/contacts" },
  { key: "experimentals", label: "Experimentais", icon: CalendarDays, to: "/admin/experimentals" },
  { key: "followUps", label: "Retornos", icon: PhoneCall, to: "/admin/follow-ups" },
  { key: "waitingList", label: "Lista de interesse", icon: ListChecks, to: "/admin/waiting-list" },
  { key: "reports", label: "Relatórios", icon: BarChart3, to: "/admin/reports" },
  { key: "administration", label: "Administração", icon: ShieldCheck, to: "/admin/administration" },
];

/*
 * Menu do painel.
 * Computador: fixo à esquerda. Celular: gaveta aberta pelo botão
 * do topo (open / onClose).
 */
export default function Sidebar({ open = false, onClose, pending }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);

  // Gaveta aberta no celular: foco no botão de fechar e Esc fecha
  useEffect(() => {
    if (!open) return undefined;

    closeRef.current?.focus();

    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
      toast("Não foi possível sair. Tente de novo.");
    }
  }

  return (
    <>
      {/* Fundo escuro da gaveta no celular */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <img
            src="/logo-vermelho.png"
            alt="Escola Oficial do Inter"
            width={136}
            height={52}
            className="h-[52px] w-[136px] object-cover"
          />

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-neutral-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav aria-label="Painel" className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {menu.map((item) => {
              const Icon = item.icon;
              const count = menuCount(item.key, pending);

              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/admin"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex h-10 w-full items-center gap-3 rounded-lg border-l-[3px] pl-2.5 pr-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                        isActive
                          ? "border-l-inter-red bg-neutral-100 text-ink"
                          : "border-l-transparent text-muted hover:bg-neutral-50 hover:text-ink"
                      }`
                    }
                  >
                    <Icon size={18} aria-hidden="true" />

                    <span className="flex-1">{item.label}</span>

                    {count && (
                      <span title={`${count.value} ${COUNT_TITLE[item.key]}`}>
                        <Count value={count.value} urgency={count.urgency} />
                        <span className="sr-only"> {COUNT_TITLE[item.key]}</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Usuário */}
        <div className="flex items-center gap-3 border-t border-line px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-ink">
            E
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">Eduardo Ribeiro</p>
            <p className="text-xs text-muted">Administrador</p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-neutral-100 hover:text-ink"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
