// Room type onujayi display content (photo, amenities, size...).
// Nijer hotel er moto bodle nao. Nijer photo bosate chaile:
//   1. photo gulo frontend/public/images/rooms/ e rakho (jemon suite-1.jpg)
//   2. niche images: [...] e '/images/rooms/suite-1.jpg' likho

const BASE_AMENITIES = [
  { icon: 'bi-wifi', label: 'Free Wi-Fi' },
  { icon: 'bi-snow', label: 'Air conditioning' },
  { icon: 'bi-tv', label: 'Smart TV' },
  { icon: 'bi-droplet-half', label: 'Hot & cold water' },
  { icon: 'bi-shield-lock', label: 'In-room safe' },
  { icon: 'bi-bell', label: '24/7 room service' },
]

const ROOM_101_IMAGES = [
  '/images/rooms/room-1/room-101-1.jpg',
  '/images/rooms/room-1/room-101-2.jpg',
  '/images/rooms/room-1/room-101-3.jpeg',
  '/images/rooms/room-1/room-101-4.jpeg',
  '/images/rooms/room-1/room-101-5.jpeg',
]

const STANDARD = {
  match: ['single', 'standard', 'economy', 'basic'],
  tagline: 'Simple, clean and comfortable for solo travellers',
  size: '22 m²',
  bed: 'Queen bed',
  view: 'Courtyard view',
  description:
    'A cosy and efficient room designed for a restful stay. It has everything you need: a comfortable bed, a work-friendly desk area, fast Wi-Fi and a clean private bathroom. Perfect for business trips and short getaways.',
  images: [
    '/images/images.jpeg',
    '/images/images-1.jpeg',
    '/images/images-2.jpeg',
    '/images/images-3.jpeg',
    '/images/images-4.jpeg',
  ],
  extras: [
    { icon: 'bi-laptop', label: 'Work desk' },
    { icon: 'bi-cup-hot', label: 'Tea & coffee maker' },
  ],
}

const DOUBLE = {
  match: ['double', 'twin', 'family'],
  tagline: 'Extra space for couples, friends and families',
  size: '32 m²',
  bed: 'Double bed',
  view: 'Garden view',
  description:
    'A bright, spacious room that is ideal for two guests or a small family. Enjoy extra room to relax, a comfortable seating area and a refreshing garden outlook.',
  images: [
    '/images/images-1.jpeg',
    '/images/images-2.jpeg',
    '/images/images-3.jpeg',
    '/images/images-4.jpeg',
    '/images/images-5.jpeg',
  ],
  extras: [
    { icon: 'bi-snow2', label: 'Mini fridge' },
    { icon: 'bi-cup-hot', label: 'Tea & coffee maker' },
    { icon: 'bi-egg-fried', label: 'Breakfast available' },
  ],
}

const SUITE = {
  match: ['suite', 'presidential', 'deluxe', 'premium', 'luxury'],
  tagline: 'Spacious luxury with a separate lounge area',
  size: '55 m²',
  bed: 'King bed',
  view: 'Garden & city view',
  description:
    'Our finest accommodation, with a generous living area, a king-size bed and a premium bathroom. Perfect for special occasions, long stays or when you simply want more space and privacy.',
  images: [
    '/images/images-4.jpeg',
    '/images/images-3.jpeg',
    '/images/images-5.jpeg',
    '/images/images-2.jpeg',
    '/images/images-1.jpeg',
  ],
  extras: [
    { icon: 'bi-water', label: 'Bathtub' },
    { icon: 'bi-snow2', label: 'Mini fridge' },
    { icon: 'bi-cup-hot', label: 'Tea & coffee maker' },
    { icon: 'bi-laptop', label: 'Work desk' },
    { icon: 'bi-egg-fried', label: 'Breakfast available' },
    { icon: 'bi-door-open', label: 'Private balcony' },
  ],
}

// Suite age check hobe, tarpor double, tarpor standard
const TYPES = [SUITE, DOUBLE, STANDARD]

export function getRoomContent(typeName = '') {
  const n = typeName.toLowerCase()
  const found = TYPES.find((t) => t.match.some((m) => n.includes(m))) || STANDARD
  return { ...found, amenities: [...BASE_AMENITIES, ...found.extras] }
}

// Ek type er room gulo te alada alada photo dekhate id onujayi ghurai
export function getGallery(content, roomId = 0, roomNumber = '') {
  const hasRoomOneImages = roomNumber === '101' || roomNumber === '102'
  const imgs = hasRoomOneImages ? ROOM_101_IMAGES : content.images
  if (!imgs.length) return []
  if (hasRoomOneImages) return imgs
  const shift = roomId % imgs.length
  return [...imgs.slice(shift), ...imgs.slice(0, shift)]
}
