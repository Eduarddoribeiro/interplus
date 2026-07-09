import Layout from './Layout'

import {
  stats,
  experimentals,
  followUps
} from './data/mock'

import StatCard from './components/StatCard'
import SectionTitle from './components/SectionTitle'
import ExperimentalCard from './components/ExperimentalCard'
import FollowUpCard from './components/FollowUpCard'

export default function Dashboard() {
  return (
    <Layout>

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

    </Layout>
  )
}