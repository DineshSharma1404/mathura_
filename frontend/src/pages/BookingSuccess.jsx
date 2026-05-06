import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, submitPaytmCheckout } from "../services/api";
import "./BookingSuccess.css";

const bookingTypeLabel = {
  hotel: "Hotel",
  guide: "Travel Guide",
  rental: "Vehicle Rental",
};

function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [manualProcessing, setManualProcessing] = useState(false);
  const missingId = !bookingId;
  const scannerImage = "/images/scanner.png";
  const upiId = "8791271153@axl";

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

  const startPaytmPayment = async () => {
    if (!booking?._id) return;
    setError("");
    setPaying(true);
    try {
      const orderRes = await api.createPaytmOrder({ bookingId: booking._id });
      if (orderRes.demoVerification) {
        const verify = await api.verifyPaytmPayment({
          bookingId: booking._id,
          orderId: orderRes.demoVerification.orderId,
          txnId: orderRes.demoVerification.txnId,
          txnStatus: orderRes.demoVerification.txnStatus,
          checksumHash: orderRes.demoVerification.checksumHash,
        });
        setBooking(verify.booking);
        setPaying(false);
        return;
      }
      submitPaytmCheckout(orderRes.checkoutUrl, orderRes.params);
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  const confirmManualPayment = async () => {
    if (!booking?._id) return;
    if (!manualRef.trim()) {
      setError("Please enter payment transaction reference.");
      return;
    }
    setError("");
    setManualProcessing(true);
    try {
      const response = await api.confirmManualPayment({
        bookingId: booking._id,
        transactionRef: manualRef.trim(),
      });
      setBooking(response.booking);
      setManualRef("");
    } catch (err) {
      setError(err.message);
    } finally {
      setManualProcessing(false);
    }
  };

  const titleText = useMemo(() => {
    if (!booking) return "Booking Confirmed";
    const type = bookingTypeLabel[booking.bookingType] || "Booking";
    return `${type} Booking Confirmed`;
  }, [booking]);

  if ((!booking && error) || missingId) {
    return (
      <Layout>
        <section className="booking-success-shell">
          <h2>{missingId ? "Missing booking ID" : error}</h2>
          <Link to="/travel-desk">Go to travel desk</Link>
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
        <h1>{titleText}</h1>
        <p>Your booking has been created successfully.</p>
        <div className="receipt-card">
          <p>
            <strong>Booking ID:</strong> {booking._id}
          </p>
          <p>
            <strong>Type:</strong> {bookingTypeLabel[booking.bookingType] || "Booking"}
          </p>
          <p>
            <strong>Service:</strong> {booking.serviceName || booking.hotelName}
          </p>
          <p>
            <strong>Guest:</strong> {booking.guestName}
          </p>
          <p>
            <strong>Date:</strong> {booking.checkIn}
            {booking.checkOut !== booking.checkIn ? ` to ${booking.checkOut}` : ""}
          </p>
          <p>
            <strong>Payment:</strong>{" "}
            {booking.paymentStatus === "paid" ? "Online paid" : booking.paymentStatus}
          </p>
          <p>
            <strong>Total:</strong> INR {booking.totalAmount}
          </p>
        </div>
        <div className="success-actions">
          {booking.paymentStatus !== "paid" ? (
            <button type="button" onClick={startPaytmPayment} disabled={paying}>
              {paying ? "Processing payment..." : "Pay Now with Paytm"}
            </button>
          ) : null}
          <Link to="/travel-desk">Create another booking</Link>
          <Link to="/my-trips">Open My Trips</Link>
        </div>
        {booking.paymentStatus !== "paid" ? (
          <div className="scanner-box">
            <h3>Scan & Pay (Hardcoded)</h3>
            <p>Scan this QR and pay to UPI ID: {upiId}</p>
            <img
              src={scannerImage}
              alt="Payment scanner"
              className="scanner-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <p className="scanner-note">Scanner image loaded from <code>/images/scanner.png</code></p>
            <input
              type="text"
              value={manualRef}
              onChange={(event) => setManualRef(event.target.value)}
              placeholder="Enter UPI transaction ref"
              className="scanner-input"
            />
            <button type="button" onClick={confirmManualPayment} disabled={manualProcessing}>
              {manualProcessing ? "Confirming..." : "I Have Paid - Confirm"}
            </button>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

export default BookingSuccess;
