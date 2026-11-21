const SERVICES = [
  { icon: 'bi-wifi', title: 'Free Wi-Fi', text: 'Fast internet in every room and public area.' },
  { icon: 'bi-egg-fried', title: 'Restaurant & Dining', text: 'Fresh meals and breakfast served daily.' },
  { icon: 'bi-flower2', title: 'Spa & Wellness', text: 'Relax and recharge during your stay.' },
  { icon: 'bi-airplane', title: 'Airport Pickup', text: 'Comfortable transfer on request.' },
  { icon: 'bi-water', title: 'Swimming Pool', text: 'Enjoy a refreshing swim any time of day.' },
  { icon: 'bi-bell', title: '24/7 Room Service', text: 'Our team is always ready to help.' },
  { icon: 'bi-basket', title: 'Laundry', text: 'Quick and careful laundry service.' },
  { icon: 'bi-p-square', title: 'Free Parking', text: 'Safe parking space for our guests.' },
]

export default function Services() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">What we offer</div>
          <h2>Our Services</h2>
          <p className="text-muted mb-0">Everything you need for a relaxing stay</p>
        </div>
        <div className="row g-4">
          {SERVICES.map((s) => (
            <div className="col-6 col-md-4 col-lg-3" key={s.title}>
              <div className="card service-card">
                <i className={`bi ${s.icon} mb-2`}></i>
                <h6 className="fw-bold">{s.title}</h6>
                <p className="text-muted small mb-0">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
