import { useEffect, useState } from 'react'
import SectionTitle from '../components/SectionTitle'
import { Search, Plus, Filter } from 'lucide-react'
import { getContacts } from '../../services/contacts'

export default function Students() {
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await getContacts()
        console.log(data)
        setContacts(data)
      } catch (error) {
        console.error('Erro ao buscar contatos:', error)
      }
    }

    loadContacts()
  }, [])

  return (
    <div className="space-y-8">

      <SectionTitle
        title="Contatos"
        description="Gerencie todos os contatos desde o primeiro atendimento até a matrícula."
      />

      {/* Toolbar */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative flex-1">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="text"
            placeholder="Buscar criança, responsável ou WhatsApp..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-inter-red"
          />

        </div>

        <div className="flex gap-3">

          <button className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 font-medium hover:bg-neutral-100">
            <Filter size={18} />
            Filtros
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 font-semibold text-white shadow-lg hover:opacity-90">
            <Plus size={18} />
            Novo Contato
          </button>

        </div>

      </div>

      {/* Lista */}

      <div className="space-y-5">

        {contacts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            Nenhum contato cadastrado.
          </div>
        )}

        {contacts.map((contact) => (

          <div
            key={contact.id}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >

            <div className="flex items-start justify-between">

              <div>

                <h3 className="text-lg font-bold">
                  {contact.child_name}
                </h3>

                <p className="text-sm text-neutral-500">
                  Responsável: {contact.responsible_name}
                </p>

              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                {contact.status}
              </span>

            </div>

            <div className="mt-5 grid gap-3 text-sm text-neutral-600 lg:grid-cols-2">

              <p>📱 {contact.phone}</p>

              <p>📍 {contact.source || '-'}</p>

              <p>🏠 {contact.neighborhood || '-'}</p>

              <p>
                ⚽ {contact.experimental_date
                  ? `${contact.experimental_date} • ${contact.experimental_time ?? ''}`
                  : 'Sem experimental agendada'}
              </p>

            </div>

            <button className="mt-6 w-full rounded-xl border border-neutral-200 py-3 font-medium transition hover:bg-neutral-100">
              Abrir Ficha
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}