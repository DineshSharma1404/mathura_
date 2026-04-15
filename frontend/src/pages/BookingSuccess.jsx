import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../Components/Layout";
import { api } from "../services/api";
import "./BookingSuccess.css";

function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const missingId = !bookingId;

  useEffect(() => {
    let mounted = true;
    if (!bookingId) return () => (mounted = false);

    api
      .getBookingById(bookingId)
      .then((data) => {
        if (mounted) setBooking(data.booking);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if ((!booking && error) || missingId) {
    return (
      <Layout>
        <section className="booking-success-shell">
          <h2>{missingId ? "Missing booking ID" : error}</h2>
          <Link to="/hotels">Go to hotels</Link>
        </section>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <section className="booking-success-shell">
          <h2>Loading booking...</h2>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="booking-success-shell">
        <h1>Booking Confirmed</h1>
        <p>Your stay has been confirmed successfully.</p>
        <div className="receipt-card">
          <p>
            <strong>Booking ID:</strong> {booking._id}
          </p>
          <p>
            <strong>Hotel:</strong> {booking.hotelName}
          </p>
          <p>
            <strong>Guest:</strong> {booking.guestName}
          </p>
          <p>
            <strong>Check-in:</strong> {booking.checkIn}
          </p>
          <p>
            <strong>Check-out:</strong> {booking.checkOut}
          </p>
          <p>
            <strong>Payment:</strong> Razorpay -{" "}
            {booking.paymentStatus === "paid" ? "success" : booking.paymentStatus}
          </p>
          <p>
            <strong>Total:</strong> INR {booking.totalAmount}
          </p>
        </div>
        <div className="success-actions">
          <Link to="/hotels">Book another hotel</Link>
          <Link to="/itinerary">Continue trip planning</Link>
        </div>
      </section>
    </Layout>
  );
}

export default BookingSuccess;
