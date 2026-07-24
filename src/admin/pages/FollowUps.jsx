import SectionTitle from '../components/common/SectionTitle'

export default function Experimentals() {
  return (
    <div className="space-y-8">

      <SectionTitle
        title="Experimentais"
        subtitle="Visualize e organize todas as aulas experimentais."
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
          Lista de experimentais.
        </p>
      </div>

    </div>
  )
}