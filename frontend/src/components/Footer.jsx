import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="site-footer mt-5 pt-5 pb-3">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-5">
            <h5 className="text-white">
              <i className="bi bi-building text-gold me-2"></i>SOHEL Resort
            </h5>
            <p className="small">
              Comfortable rooms, transparent pricing and friendly service. Book your stay online in a few clicks.
            </p>
          </div>
          <div className="col-6 col-md-3">
            <h6 className="text-white">Quick Links</h6>
            <ul className="list-unstyled small">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/#about">About</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-4">
            <h6 className="text-white">Contact Us</h6>
            <ul className="list-unstyled small">
              <li className="mb-1"><i className="bi bi-geo-alt me-2"></i>Cox's Bazar, City, Bangladesh</li>
              <li className="mb-1"><i className="bi bi-telephone me-2"></i>+8801867829388</li>
              <li className="mb-1"><i className="bi bi-envelope me-2"></i>nurulaziz6950@gmail.com</li>
              <li><i className="bi bi-clock me-2"></i>Front desk open 24/7</li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary" />
        <p className="text-center small mb-0">
          © {new Date().getFullYear()} SOHEL Resort. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
