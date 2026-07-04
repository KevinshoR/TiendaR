import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import ParaQuienSection from '../components/landing/ParaQuienSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import ComoFuncionaSection from '../components/landing/ComoFuncionaSection'
import CTAFinalSection from '../components/landing/CTAFinalSection'
import Footer from '../components/landing/Footer'

/* ═══════════════════════════════════════════════════════════
   Landing de CatalogApp — pública en "/".
   Identidad: fondo humo, tinta, CTA esmeralda, Sora/Inter.

   Cada sección vive en su propio archivo dentro de
   src/components/landing/. Este archivo solo las compone.
═══════════════════════════════════════════════════════════ */

export default function Landing() {
  return (
    <main className="bg-humo font-sans text-tinta">
      <style>{`
        @keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(24px) } to { opacity:1; transform:none } }
      `}</style>

      <Navbar />
      <Hero />
      <ParaQuienSection />
      <FeaturesSection />
      <ComoFuncionaSection />
      <CTAFinalSection />
      <Footer />
    </main>
  )
}