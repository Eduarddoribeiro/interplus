import SectionTitle from '../components/common/SectionTitle'

import {
  CalendarDays,
  CircleCheckBig,
  Clock3,
  RotateCcw,
  MessageCircle,
  User
} from 'lucide-react'

export default function Experimentals() {
  const experimentals = [
    {
      id: 1,
      name: 'João Pedro',
      age: 8,
      time: '09:00',
      coach: 'Rafael',
      source: 'Instagram',
      status: 'Confirmado'
    },
    {
      id: 2,
      name: 'Maria Eduarda',
      age: 10,
      time: '10:30',
      coach: 'João',
      source: 'Google',
      status: 'Pendente'
    },
    {
      id: 3,
      name: 'Gabriel',
      age: 7,
      time: '18:30',
      coach: 'Matheus',
      source: 'Indicação',
      status: 'Remarcada'
    }
  ]

  const stats = [
    {
      title: 'Hoje',
      value: 8,
      icon: CalendarDays
    },
    {
      title: 'Confirmadas',
      value: 6,
      icon: CircleCheckBig
    },
    {
      title: 'Pendentes',
      value: 1,
      icon: Clock3
    },
    {
      title: 'Remarcações',
      value: 1,
      icon: RotateCcw
    }
  ]

  return (
    <div className="space-y-10">

      <SectionTitle
        title="Experimentais"
        description="Gerencie todas as aulas experimentais agendadas."
      />

      <div className="grid lg:grid-cols-4 gap-6">

        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-neutral-500">
                    {item.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {item.value}
                  </h2>

                </div>

                <div className="rounded-xl bg-inter-red/10 p-3">

                  <Icon
                    className="text-inter-red"
                    size={24}
                  />

                </div>

              </div>
            </div>
          )
        })}

      </div>

      <div>

        <SectionTitle
          title="Agenda de Hoje"
          description="Acompanhe todas as experimentais programadas."
        />

        <div className="space-y-5 mt-6">

          {experimentals.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >

              <div className="flex items-start justify-between">

                <div>

                  <h3 className="text-xl font-bold">
                    {item.name}
                  </h3>

                  <p className="text-neutral-500">
                    {item.age} anos
                  </p>

                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  {item.status}
                </span>

              </div>

              <div className="grid lg:grid-cols-4 gap-4 mt-6 text-sm">

                <div>

                  <p className="text-neutral-400">
                    Horário
                  </p>

                  <p className="font-semibold">
                    {item.time}
                  </p>

                </div>

                <div>

                  <p className="text-neutral-400">
                    Professor
                  </p>

                  <p className="font-semibold">
                    {item.coach}
                  </p>

                </div>

                <div>

                  <p className="text-neutral-400">
                    Origem
                  </p>

                  <p className="font-semibold">
                    {item.source}
                  </p>

                </div>

                <div>

                  <p className="text-neutral-400">
                    Responsável
                  </p>

                  <p className="font-semibold">
                    Carlos Silva
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap gap-3 mt-8">

                <button className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 text-white font-medium hover:opacity-90">

                  <MessageCircle size={18} />

                  Enviar aos Professores

                </button>

                <button className="flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-3 font-medium hover:bg-neutral-100">

                  <User size={18} />

                  Abrir Lead

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}