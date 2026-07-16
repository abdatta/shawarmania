/* Single registration point for GSAP plugins — import gsap from here everywhere. */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

gsap.defaults({ ease: 'power3.out' })

export { gsap, ScrollTrigger, useGSAP }
