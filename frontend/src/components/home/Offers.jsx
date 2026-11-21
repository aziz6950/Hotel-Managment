import { Link } from 'react-router-dom'

const OFFERS = [
  {
    icon: 'bi-calendar-week', tag: 'Sunday – Thursday', title: 'Midweek Rates',
    text: 'No weekend surcharge on Sunday to Thursday nights. Book midweek and pay the standard base rate.',
    note: 'Peak-season rates may apply in December and January.',
  },
  {
    icon: 'bi-arrow-repeat', tag: 'Free cancellation', title: 'Flexible Booking',
    text: 'Change of plans? Cancel your booking online any time before check-in, at no charge.',
    note: 'Applies to pending and confirmed bookings.',
  },
  {
    icon: 'bi-credit-card', tag: 'Cash · Card · Mobile', title: 'Pay Your Way',
    text: 'Pay by cash, card or mobile banking, in full or in parts, and clear your balance before check-out.',
    note: 'Your invoice is always available online.',
  },
]

export default function Offers() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Good to know</div>
          <h2>Special Offers</h2>
          <p className="text-muted mb-0">Benefits that make your booking easier</p>
        </div>
        <div className="row g-4">
          {OFFERS.map((o) => (
            <div className="col-12 col-md-6 col-lg-4" key={o.title}>
              <div className="card offer-card">
                <div className="card-body p-4 d-flex flex-column">
                  <i className={`bi ${o.icon} text-gold`} style={{ fontSize: '2rem' }}></i>
                  <span className="offer-tag align-self-start my-2">{o.tag}</span>
                  <h5 className="fw-bold">{o.title}</h5>
                  <p className="text-muted">{o.text}</p>
                  <p className="text-muted small mb-3">{o.note}</p>
                  <Link to="/rooms" className="btn btn-navy mt-auto align-self-start">Book now</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
