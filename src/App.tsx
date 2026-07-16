import { SmoothScroll } from './components/SmoothScroll/SmoothScroll'
import { Loader } from './components/Loader/Loader'
import { Header } from './components/Header/Header'
import { FloatingCtas } from './components/FloatingCtas/FloatingCtas'
import { Hero } from './sections/Hero/Hero'
import { Marquee } from './sections/Marquee/Marquee'

export default function App() {
  return (
    <SmoothScroll>
      <Loader />
      <Header />
      <main>
        <Hero />
        <Marquee />
        {/* changes 5–8 append: Craving, Menu, Story, Proof, Testimonials, Outlets, Franchise, Footer */}
        <div style={{ height: '60vh' }} aria-hidden="true" />
      </main>
      <FloatingCtas />
    </SmoothScroll>
  )
}
