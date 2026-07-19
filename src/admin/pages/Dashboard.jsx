import {
  stats,
  experimentals,
  followUps
} from '../data/mock'

import StatCard from '../components/common/StatCard'
import SectionTitle from '../components/common/SectionTitle'
import ExperimentalCard from '../components/dashboard/ExperimentalCard'
import FollowUpCard from '../components/dashboard/FollowUpCard'

export default function Dashboard() {
  return (
    <>
      <SectionTitle
        title="Visão Geral"
        description="Acompanhe experimentais, retornos e novos leads."
      />

      <div className="grid lg:grid-cols-4 gap-6">

        {stats.map((item) => (
          <StatCard
            key={item.title}
            {...item}
          />
        ))}

      </div>

      <div className="grid lg:grid-cols-2 gap-10 mt-14">

        <div>

          <SectionTitle
            title="Experimentais de Hoje"
          />

          <div className="space-y-5">

            {experimentals.map((item) => (
              <ExperimentalCard
                key={item.id}
                {...item}
              />
            ))}

          </div>

        </div>

        <div>

          <SectionTitle
            title="Retornos Pendentes"
          />

          <div className="space-y-5">

            {followUps.map((item) => (
              <FollowUpCard
                key={item.id}
                {...item}
              />
            ))}

          </div>

        </div>

      </div>
    </>
  )
}