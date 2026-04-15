import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, getCurrentUser } from "../services/api";
import "./MyTrips.css";

function MyTrips() {
  const itinerary = useMemo(() => {
    const value = localStorage.getItem("lastItinerary");
    return value ? JSON.parse(value) : null;
  }, []);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(
    Boolean(localStorage.getItem("authToken"))
  );
  const [bookingError, setBookingError] = useState("");

  const user = useMemo(() => getCurrentUser(), []);

  const favoriteHotels = useMemo(() => {
    const value = localStorage.getItem("favoriteHotels");
    return value ? JSON.parse(value) : [];
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!localStorage.getItem("authToken")) return () => (mounted = false);

    api
      .getMyBookings()
      .then((data) => {
        if (mounted) setBookings(data.bookings || []);
      })
      .catch((err) => {
        if (mounted) setBookingError(err.message);
      })
      .finally(() => {
        if (mounted) setLoadingBookings(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Layout>
      <section className="mytrips-shell">
        <h1>My Trips Dashboard</h1>
        <p>Manage itinerary, latest booking, and saved preferences in one place.</p>
        {user ? <p>Welcome back, {user.name}</p> : null}

        <div className="mytrips-grid">
          <article className="trip-card">
            <h3>Latest Itinerary</h3>
            {itinerary ? (
              <>
                <p>{itinerary.days.length} day plan available</p>
                <Link to="/itinerary/result">Open itinerary</Link>
              </>
            ) : (
              <>
                <p>No itinerary generated yet.</p>
                <Link to="/itinerary">Create itinerary</Link>
              </>
            )}
          </article>

          <article className="trip-card">
            <h3>Latest Hotel Booking</h3>
            {loadingBookings ? (
              <p>Loading bookings...</p>
            ) : bookings.length ? (
              <>
                <p>{bookings[0].hotelName}</p>
                <p>
                  {bookings[0].checkIn} to {bookings[0].checkOut}
                </p>
                <Link to={`/booking/success?bookingId=${bookings[0]._id}`}>View booking</Link>
              </>
            ) : (
              <>
                <p>{bookingError || "No booking made yet."}</p>
                <Link to="/hotels">Book a hotel</Link>
              </>
            )}
          </article>

          <article className="trip-card">
            <h3>Saved Hotels</h3>
            <p>{favoriteHotels.length} favorites saved</p>
            <Link to="/hotels">Manage saved hotels</Link>
          </article>

          <article className="trip-card">
            <h3>Booking History</h3>
            {bookings.length ? (
              <ul className="booking-mini-list">
                {bookings.slice(0, 4).map((item) => (
                  <li key={item._id}>
                    {item.hotelName} - {item.paymentStatus}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Complete your first paid booking to build history.</p>
            )}
          </article>
        </div>
      </section>
    </Layout>
  );
}

export default MyTrips;
