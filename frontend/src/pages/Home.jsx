import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from '../components/home/Hero'
import FeaturedRooms from '../components/home/FeaturedRooms'
import Services from '../components/home/Services'
import About from '../components/home/About'
import Reviews from '../components/home/Reviews'
import Gallery from '../components/home/Gallery'
import Offers from '../components/home/Offers'

export default function Home() {
  const { hash } = useLocation()

  // Onno page theke /#about ba /#contact e ashle oi section e scroll korbe
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <>
      <Hero />
      <FeaturedRooms />
      <Services />
      <About />
      <Reviews />
      <Gallery />
      <Offers />
    </>
  )
}
