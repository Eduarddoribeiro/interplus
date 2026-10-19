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
import { NavLink, useNavigate } from "react-router-dom";

import { signOut } from "../../services/auth";
import { toast } from "../components/common/Toaster";

const menu = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    to: "/admin",
  },
  {
    label: "Contatos",
    icon: Users,
    to: "/admin/contacts",
  },
  {
    label: "Experimentais",
    icon: CalendarDays,
    to: "/admin/experimentals",
  },
  {
    label: "Retornos",
    icon: PhoneCall,
    to: "/admin/follow-ups",
  },
  {
    label: "Lista de Interesse",
    icon: ListChecks,
    to: "/admin/waiting-list",
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    to: "/admin/reports",
  },
  {
    label: "Administração",
    icon: ShieldCheck,
    to: "/admin/administration",
  },
];

/*
 * Menu do painel.
 * Computador: fixo à esquerda. Celular: gaveta aberta pelo botão
 * do topo (open / onClose).
 */
export default function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="relative flex justify-center border-b border-neutral-100 px-8 py-6 lg:py-8">
          <img
            src="/logo-vermelho.svg"
            alt="Escola Oficial do Inter"
            className="h-24 w-auto lg:h-32"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-5 pt-6">
          <div className="space-y-1.5">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/admin"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "bg-inter-red text-white shadow-lg"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    }`
                  }
                >
                  <Icon size={20} />

                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Usuário */}
        <div className="border-t border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-inter-red font-bold text-white">
              E
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900">Eduardo Ribeiro</h3>

              <p className="text-sm text-neutral-500">Administrador</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-inter-red"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
