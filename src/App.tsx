import { SmoothScroll } from './components/SmoothScroll/SmoothScroll'
import { Loader } from './components/Loader/Loader'
import { Header } from './components/Header/Header'
import { FloatingCtas } from './components/FloatingCtas/FloatingCtas'
import { Hero } from './sections/Hero/Hero'
import { Marquee } from './sections/Marquee/Marquee'
import { Craving } from './sections/Craving/Craving'
import { Menu } from './sections/Menu/Menu'

export default function App() {
  return (
    <SmoothScroll>
      <Loader />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Craving />
        <Menu />
        {/* changes 6–8 append: Story, Proof, Testimonials, Outlets, Franchise, Footer */}
        <div style={{ height: '60vh' }} aria-hidden="true" />
      </main>
      <FloatingCtas />
    </SmoothScroll>
  )
}
