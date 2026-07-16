/* Single registration point for GSAP plugins — import gsap from here everywhere. */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

gsap.defaults({ ease: 'power3.out' })

export { gsap, ScrollTrigger, SplitText, useGSAP }
