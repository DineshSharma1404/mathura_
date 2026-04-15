import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../Components/Layout";
import hotelsData from "../data/hotelsData";
import { api } from "../services/api";
import "./HotelBooking.css";

function HotelBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotel = hotelsData.find((item) => item.id === id);

  const [formData, setFormData] = useState({
    guestName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    rooms: 1,
  });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const totalAmount = useMemo(() => {
    if (!hotel || !formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffMs = end - start;
    const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return nights * hotel.pricePerNight * Number(formData.rooms || 1);
  }, [formData.checkIn, formData.checkOut, formData.rooms, hotel]);

  if (!hotel) {
    return (
      <Layout>
        <section className="booking-shell">
          <h2>Hotel not found</h2>
        </section>
      </Layout>
    );
  }

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!formData.guestName || !formData.email || !formData.checkIn || !formData.checkOut) {
      setError("Please fill all booking details.");
      return;
    }
    if (!localStorage.getItem("authToken")) {
      navigate("/login", { state: { from: `/hotels/${id}/book` } });
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const bookingResponse = await api.createBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        ...formData,
        totalAmount,
      });

      const orderData = await api.createRazorpayOrder({
        bookingId: bookingResponse.booking._id,
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mathura Guide",
        description: `Booking for ${hotel.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: formData.guestName,
          email: formData.email,
          contact: formData.phone || "",
        },
        handler: async function onPaymentSuccess(response) {
          const verifyResponse = await api.verifyRazorpayPayment({
            bookingId: bookingResponse.booking._id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          navigate(`/booking/success?bookingId=${verifyResponse.booking._id}`);
        },
        theme: { color: "#d66024" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
      });
      paymentObject.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <section className="booking-shell">
        <h1>Book: {hotel.name}</h1>
        <p>Secure your stay and continue to payment.</p>

        <form className="booking-form" onSubmit={onSubmit}>
          <label>
            Guest name
            <input
              type="text"
              value={formData.guestName}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, guestName: event.target.value }))
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </label>
          <label>
            Check-in
            <input
              type="date"
              value={formData.checkIn}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, checkIn: event.target.value }))
              }
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              value={formData.checkOut}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, checkOut: event.target.value }))
              }
            />
          </label>
          <label>
            Rooms
            <input
              type="number"
              min={1}
              max={5}
              value={formData.rooms}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, rooms: event.target.value }))
              }
            />
          </label>
          <label>
            Phone (for SMS confirmation)
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </label>
          <p className="price-line">Estimated total: INR {totalAmount}</p>
          <p className="payment-note">Secure payment powered by Razorpay.</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" disabled={processing}>
            {processing ? "Processing..." : "Pay and confirm booking"}
          </button>
        </form>
      </section>
    </Layout>
  );
}

export default HotelBooking;
