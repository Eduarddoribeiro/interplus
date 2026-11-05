import {
  LayoutDashboard,
  Users,
  CalendarDays,
  PhoneCall,
  ListChecks,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Trophy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { signOut } from "../../services/auth";
import { toast } from "../components/common/Toaster";
import { Count } from "../ui";
import { isDemo } from "../../lib/supabase";
import { BRAND } from "../../constants/brand";

// Na demonstração o painel não mostra o nome de ninguém real
const USER = isDemo
  ? { name: "Visitante", role: "Demonstração" }
  : { name: "Eduardo Ribeiro", role: "Administrador" };

/*
 * Contador de cada item do menu a partir das pendências da Visão
 * geral. Só aparece o que pede ação: vermelho = atrasado, âmbar =
 * atenção. Números só informativos (lista de interesse, triagem)
 * ficam nas próprias telas, para o menu não virar ruído.
 */
const count = (value, urgency, title) => (value ? { value, urgency, title } : null);

// Lista de contadores do item (Alunos pode ter dois: atrasadas e fichas)
export function menuCounts(key, pending) {
  if (!pending) return [];

  switch (key) {
    case "experimentals":
      return [
        count(pending.overdue, "alert", "experimentais sem baixa") ??
          count(pending.toConfirm, "attention", "experimentais para confirmar"),
      ].filter(Boolean);
    case "followUps":
      return [count(pending.followUpsDue, "alert", "retornos vencidos")].filter(Boolean);
    case "students":
      return [
        count(pending.studentsOverdue, "alert", "alunos com pendência atrasada"),
        count(pending.formsToReview, "attention", "fichas da família para conferir"),
      ].filter(Boolean);
    case "tasks":
      return [count(pending.tasksOverdue, "alert", "tarefas atrasadas")].filter(Boolean);
    default:
      return [];
  }
}

const mostUrgent = (counts) => counts.find((entry) => entry.urgency === "alert") ?? counts[0] ?? null;

// Para o botão do menu no celular: o contador mais urgente de todos os itens
export function menuAlert(pending) {
  return mostUrgent(menu.flatMap((item) => menuCounts(item.key, pending)));
}

const COLLAPSED_KEY = "admin-sidebar-collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

const menu = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard, to: "/admin" },
  { key: "contacts", label: "Contatos", icon: Users, to: "/admin/contacts" },
  { key: "experimentals", label: "Experimentais", icon: CalendarDays, to: "/admin/experimentals" },
  { key: "followUps", label: "Retornos", icon: PhoneCall, to: "/admin/follow-ups" },
  { key: "waitingList", label: "Lista de interesse", icon: ListChecks, to: "/admin/waiting-list" },
  { key: "students", label: "Alunos", icon: GraduationCap, to: "/admin/students" },
  { key: "tasks", label: "Tarefas", icon: ClipboardCheck, to: "/admin/tarefas" },
  { key: "events", label: "Eventos", icon: Trophy, to: "/admin/events" },
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

  // Computador: menu recolhido só com os ícones (fica lembrado neste
  // navegador). No celular a gaveta abre sempre inteira.
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // sem storage: vale só até recarregar
      }
      return next;
    });
  }

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white transition-[transform,width] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          collapsed ? "lg:w-16" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <img
            src={BRAND.logo}
            alt={BRAND.logoAlt}
            width={120}
            height={49}
            className={`h-auto w-[120px] ${collapsed ? "lg:hidden" : ""}`}
          />

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink lg:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={19} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={19} aria-hidden="true" />
            )}
          </button>

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
        <nav aria-label="Painel" className={`flex-1 overflow-y-auto px-3 ${collapsed ? "lg:px-2" : ""}`}>
          <ul className="space-y-0.5">
            {menu.map((item) => {
              const Icon = item.icon;
              const counts = menuCounts(item.key, pending);
              const dot = mostUrgent(counts);

              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/admin"}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex h-10 w-full items-center gap-3 rounded-lg border-l-[3px] pl-2.5 pr-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                        collapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""
                      } ${
                        isActive
                          ? "border-l-inter-red bg-neutral-100 text-ink"
                          : "border-l-transparent text-muted hover:bg-neutral-50 hover:text-ink"
                      }`
                    }
                  >
                    <span className="relative shrink-0">
                      <Icon size={18} aria-hidden="true" />

                      {/* Recolhido: o contador vira um ponto no ícone */}
                      {dot && collapsed && (
                        <span
                          aria-hidden="true"
                          className={`absolute -right-1 -top-1 hidden h-2 w-2 rounded-full ring-2 ring-white lg:block ${
                            dot.urgency === "alert" ? "bg-alert" : "bg-attention"
                          }`}
                        />
                      )}
                    </span>

                    <span className={`flex-1 ${collapsed ? "lg:sr-only" : ""}`}>{item.label}</span>

                    {counts.length > 0 && (
                      <span className={`flex gap-1 ${collapsed ? "lg:sr-only" : ""}`}>
                        {counts.map((entry) => (
                          <span key={entry.title} title={`${entry.value} ${entry.title}`}>
                            <Count value={entry.value} urgency={entry.urgency} />
                            <span className="sr-only"> {entry.title}</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Usuário */}
        <div
          className={`flex items-center gap-3 border-t border-line px-5 py-4 ${
            collapsed ? "lg:flex-col lg:gap-2 lg:px-0" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-ink">
            {USER.name[0]}
          </div>

          <div className={`min-w-0 flex-1 ${collapsed ? "lg:sr-only" : ""}`}>
            <p className="truncate text-sm font-semibold text-ink">{USER.name}</p>
            <p className="text-xs text-muted">{USER.role}</p>
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
