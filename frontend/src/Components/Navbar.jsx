import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo">
          Mathura<span>Explorer</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" className="nav-item">
            Home
          </NavLink>
          <NavLink to="/places" className="nav-item">
            Places
          </NavLink>
          <NavLink to="/itinerary" className="nav-item">
            Itinerary
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
