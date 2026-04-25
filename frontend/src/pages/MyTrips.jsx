import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, getCurrentUser } from "../services/api";
import "./MyTrips.css";

const bookingTypeLabel = {
  hotel: "Hotel",
  guide: "Travel Guide",
  rental: "Vehicle Rental",
};

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
  const [subscription, setSubscription] = useState(null);

  const user = useMemo(() => getCurrentUser(), []);

  const favoriteHotels = useMemo(() => {
    const value = localStorage.getItem("favoriteHotels");
    return value ? JSON.parse(value) : [];
  }, []);

  const latestBooking = bookings[0];

  useEffect(() => {
    let mounted = true;
    if (!localStorage.getItem("authToken")) return () => (mounted = false);

    Promise.all([api.getMyBookings(), api.getMySubscriptions()])
      .then(([bookingsData, subscriptionData]) => {
        if (!mounted) return;
        setBookings(bookingsData.bookings || []);
        const active = (subscriptionData.subscriptions || []).find((item) => item.status === "active");
        setSubscription(active || null);
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
            <h3>Latest Booking</h3>
            {loadingBookings ? (
              <p>Loading bookings...</p>
            ) : latestBooking ? (
              <>
                <p className="booking-type-pill">
                  {bookingTypeLabel[latestBooking.bookingType] || "Booking"}
                </p>
                <p>{latestBooking.serviceName || latestBooking.hotelName}</p>
                <p>
                  {latestBooking.checkIn} to {latestBooking.checkOut}
                </p>
                <Link to={`/booking/success?bookingId=${latestBooking._id}`}>View booking</Link>
              </>
            ) : (
              <>
                <p>{bookingError || "No booking made yet."}</p>
                <Link to="/travel-desk">Create booking</Link>
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
                {bookings.slice(0, 5).map((item) => (
                  <li key={item._id}>
                    {bookingTypeLabel[item.bookingType] || "Booking"}: {item.serviceName || item.hotelName} -{" "}
                    {item.paymentStatus}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Complete your first booking to build history.</p>
            )}
          </article>

          <article className="trip-card">
            <h3>Subscription</h3>
            {subscription ? (
              <>
                <p>{subscription.planName}</p>
                <p>Active till {new Date(subscription.endDate).toLocaleDateString("en-IN")}</p>
                <Link to="/subscriptions">Manage plan</Link>
              </>
            ) : (
              <>
                <p>No active plan yet.</p>
                <Link to="/subscriptions">Get subscription</Link>
              </>
            )}
          </article>
        </div>
      </section>
    </Layout>
  );
}

export default MyTrips;
