import { roomTheme } from '../../utils'

// Chhobi gulo frontend/public/images/ folder e ache.
// Caption chhobir sathe na mille ekhane caption bodle nao.
const TILES = [
  { icon: 'bi-door-open', caption: 'Deluxe Room', img: '/images/images.jpeg' },
  { icon: 'bi-water', caption: 'Swimming Pool', img: '/images/images-1.jpeg' },
  { icon: 'bi-egg-fried', caption: 'Restaurant', img: '/images/images-2.jpeg' },
  { icon: 'bi-flower2', caption: 'Spa & Wellness', img: '/images/images-3.jpeg' },
  { icon: 'bi-building', caption: 'Lobby', img: '/images/images-4.jpeg' },
  { icon: 'bi-tree', caption: 'Garden View', img: '/images/images-5.jpeg' },
]

export default function Gallery() {
  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Take a look</div>
          <h2>Photo Gallery</h2>
          <p className="text-muted mb-0">A glimpse of the places you will enjoy</p>
        </div>
        <div className="gallery-grid">
          {TILES.map((t, i) => (
            <div
              className="gallery-item"
              key={t.caption}
              style={{ background: t.img ? `url(${t.img}) center / cover` : roomTheme(i) }}
            >
              {!t.img && <i className={`bi ${t.icon}`}></i>}
              <span className="caption">{t.caption}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
