import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import HowItWorks from '../components/HowItWorks'
import Partners from '../components/Partners'
import BecomePartner from '../components/BecomePartner'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'

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