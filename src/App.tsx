import { SmoothScroll } from './components/SmoothScroll/SmoothScroll'
import { Loader } from './components/Loader/Loader'
import { Header } from './components/Header/Header'
import { FloatingCtas } from './components/FloatingCtas/FloatingCtas'
import { Hero } from './sections/Hero/Hero'
import { Marquee } from './sections/Marquee/Marquee'
import { Craving } from './sections/Craving/Craving'
import { Menu } from './sections/Menu/Menu'
import { Story } from './sections/Story/Story'
import { Proof } from './sections/Proof/Proof'
import { Testimonials } from './sections/Testimonials/Testimonials'

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
        <Story />
        <Proof />
        <Testimonials />
        {/* changes 7–8 append: Outlets, Franchise, Footer */}
        <div style={{ height: '40vh' }} aria-hidden="true" />
      </main>
      <FloatingCtas />
    </SmoothScroll>
  )
}
