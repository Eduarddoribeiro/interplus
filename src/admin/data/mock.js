import {
  Users,
  CalendarDays,
  GraduationCap,
  PhoneCall
} from 'lucide-react'

export const stats = [
  {
    title: 'Novos Leads',
    value: 18,
    subtitle: 'Últimos 30 dias',
    icon: Users
  },
  {
    title: 'Experimentais',
    value: 9,
    subtitle: 'Agendados',
    icon: CalendarDays
  },
  {
    title: 'Matrículas',
    value: 6,
    subtitle: 'Convertidos',
    icon: GraduationCap
  },
  {
    title: 'Retornos',
    value: 3,
    subtitle: 'Pendentes',
    icon: PhoneCall
  }
]

export const experimentals = [
  {
    id: 1,
    aluno: 'João Pedro',
    idade: 8,
    horario: '18:30',
    professor: 'Eduardo'
  },
  {
    id: 2,
    aluno: 'Miguel',
    idade: 7,
    horario: '19:30',
    professor: 'Lucas'
  }
]

export const followUps = [
  {
    id: 1,
    nome: 'Carlos Henrique',
    observacao: 'Retornar hoje após aula experimental.',
    data: 'Hoje'
  },
  {
    id: 2,
    nome: 'Gabriel',
    observacao: 'Pai pediu contato na sexta-feira.',
    data: 'Sexta'
  }
]