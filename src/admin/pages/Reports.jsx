import SectionTitle from '../components/SectionTitle'

export default function Reports() {
  return (
    <div className="space-y-8">

      <SectionTitle
        title="Relatórios"
        subtitle="Acompanhe os indicadores comerciais."
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
          Dashboard de métricas.
        </p>
      </div>

    </div>
  )
}