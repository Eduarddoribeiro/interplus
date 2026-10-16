import {
  LayoutDashboard,
  Users,
  CalendarDays,
  PhoneCall,
  ListChecks,
  BarChart3,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { NavLink } from 'react-router-dom'

const menu = [
  {
    label: 'Visão Geral',
    icon: LayoutDashboard,
    to: '/admin'
  },
  {
    label: 'Contatos',
    icon: Users,
    to: '/admin/contacts'
  },
  {
    label: 'Experimentais',
    icon: CalendarDays,
    to: '/admin/experimentals'
  },
  {
    label: 'Retornos',
    icon: PhoneCall,
    to: '/admin/follow-ups'
  },

  {
  label: "Lista de Interesse",
  icon: ListChecks,
  to: "/admin/waiting-list",
},
  {
    label: 'Relatórios',
    icon: BarChart3,
    to: '/admin/reports'
  },
  {
    label: 'Administração',
    icon: ShieldCheck,
    to: '/admin/administration'
  }
]

export default function Sidebar() {
  return (
    <aside
      className="
        w-72
        min-h-screen
        bg-white
        border-r
        border-neutral-200
        flex
        flex-col
      "
    >
      {/* Logo */}

      <div className="px-8 py-10 flex justify-center border-b border-neutral-100">
        <img
          src="/logo-vermelho.svg"
          alt="Escola Oficial do Inter"
          className="h-40 w-auto"
        />
      </div>

      {/* Menu */}

      <nav className="flex-1 px-5 pt-6">

        <div className="space-y-2">

          {menu.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) => `
                  w-full
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  px-4
                  py-3
                  text-left
                  transition-all
                  duration-300
                  ${
                    isActive
                      ? 'bg-inter-red text-white shadow-lg'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                  }
                `}
              >
                <Icon size={20} />

                <span className="font-medium">
                  {item.label}
                </span>
              </NavLink>
            )
          })}

        </div>

      </nav>

      {/* Usuário */}

      <div className="border-t border-neutral-200 p-6">

        <div className="flex items-center gap-3">

          <div
            className="
              w-12
              h-12
              rounded-full
              bg-inter-red
              flex
              items-center
              justify-center
              font-bold
              text-white
            "
          >
            E
          </div>

          <div>

            <h3 className="font-semibold text-neutral-900">
              Eduardo Ribeiro
            </h3>

            <p className="text-sm text-neutral-500">
              Administrador
            </p>

          </div>

        </div>

        <button
          className="
            mt-5
            flex
            items-center
            gap-2
            text-sm
            text-neutral-500
            hover:text-inter-red
            transition-colors
          "
        >
          <LogOut size={16} />
          Sair
        </button>

      </div>

    </aside>
  )
}