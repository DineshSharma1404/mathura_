import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser } from "../services/api";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const onLogout = () => {
    clearSession();
    navigate("/login");
  };

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
          <NavLink to="/hotels" className="nav-item">
            Hotels
          </NavLink>
          <NavLink to="/my-trips" className="nav-item">
            My Trips
          </NavLink>
          <NavLink to="/travel-desk" className="nav-item">
            Travel Desk
          </NavLink>
          {user ? (
            <button type="button" className="nav-item nav-button" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="nav-item">
                Login
              </NavLink>
              <NavLink to="/signup" className="nav-item">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
