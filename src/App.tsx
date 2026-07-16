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
import { Outlets } from './sections/Outlets/Outlets'
import { Franchise } from './sections/Franchise/Franchise'
import { Footer } from './sections/Footer/Footer'

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
        <Outlets />
        <Franchise />
      </main>
      <Footer />
      <FloatingCtas />
    </SmoothScroll>
  )
}
