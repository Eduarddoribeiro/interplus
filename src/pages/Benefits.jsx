import Navbar from '../components/benefits/Navbar'
import Hero from '../components/benefits/Hero'
import Stats from '../components/benefits/Stats'
import HowItWorks from '../components/benefits/HowItWorks'
import Partners from '../components/benefits/Partners'
import BecomePartner from '../components/benefits/BecomePartner'
import FAQ from '../components/benefits/FAQ'
import Footer from '../components/benefits/Footer'

export default function Benefits() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Partners />
        <BecomePartner />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}