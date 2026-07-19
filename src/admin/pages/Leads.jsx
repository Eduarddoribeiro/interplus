import SectionTitle from '../components/SectionTitle'

export default function Leads() {
  return (
    <div className="space-y-8">

      <SectionTitle
        title="Leads"
        subtitle="Gerencie todos os responsáveis interessados na escola."
      />

      <div className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        p-10
        text-center
      ">
        <h3 className="font-display text-3xl">
          Em desenvolvimento
        </h3>

        <p className="mt-3 text-neutral-500">
          Aqui ficará toda a gestão dos leads.
        </p>
      </div>

    </div>
  )
}