import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import { api } from "../services/api";
import "./TravelDesk.css";

const checklistItems = [
  "Government ID proof",
  "Comfortable footwear",
  "Water bottle",
  "Light traditional wear",
  "Phone charger and power bank",
  "Cash for local purchases",
];

const travelGuides = [
  {
    id: "gokul-amit",
    name: "Amit Sharma",
    languages: ["Hindi", "English"],
    specialty: "Krishna Janmabhoomi and old city walks",
    experience: 6,
    rating: 4.8,
    ratePerHour: 450,
  },
  {
    id: "vrindavan-priya",
    name: "Priya Goswami",
    languages: ["Hindi", "English", "Bengali"],
    specialty: "Vrindavan temple circuit",
    experience: 8,
    rating: 4.9,
    ratePerHour: 520,
  },
  {
    id: "braj-ravi",
    name: "Ravi Chaturvedi",
    languages: ["Hindi", "English"],
    specialty: "Govardhan and Braj cultural tours",
    experience: 5,
    rating: 4.6,
    ratePerHour: 400,
  },
];

const agencies = [
  {
    id: "braj-rides",
    name: "Braj Rides",
    pickupPoint: "Mathura Junction",
    vehicles: {
      bike: { model: "Royal Enfield / Activa", perDay: 900 },
      car: { model: "Swift Dzire / Ertiga", perDay: 2600 },
    },
  },
  {
    id: "yamuna-mobility",
    name: "Yamuna Mobility",
    pickupPoint: "Krishna Janmabhoomi Gate",
    vehicles: {
      bike: { model: "Pulsar / Access", perDay: 850 },
      car: { model: "Hyundai Aura / Innova", perDay: 2900 },
    },
  },
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function TravelDesk() {
  const navigate = useNavigate();
  const [days, setDays] = useState(2);
  const [people, setPeople] = useState(2);
  const [style, setStyle] = useState("balanced");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState(() => {
    const value = localStorage.getItem("packingChecklist");
    return value ? JSON.parse(value) : [];
  });

  const [guideForm, setGuideForm] = useState({
    guideId: travelGuides[0].id,
    date: "",
    duration: 4,
    travelers: 2,
    meetingPoint: "Krishna Janmabhoomi",
    guestName: "",
    email: "",
    phone: "",
  });

  const [rentalForm, setRentalForm] = useState({
    agencyId: agencies[0].id,
    vehicleType: "bike",
    startDate: "",
    rentalDays: 1,
    pickupPoint: "",
    guestName: "",
    email: "",
    phone: "",
  });

  const selectedGuide = useMemo(
    () => travelGuides.find((guide) => guide.id === guideForm.guideId) || travelGuides[0],
    [guideForm.guideId]
  );

  const selectedAgency = useMemo(
    () => agencies.find((agency) => agency.id === rentalForm.agencyId) || agencies[0],
    [rentalForm.agencyId]
  );

  const budgetEstimate = useMemo(() => {
    const stay = style === "premium" ? 4500 : style === "budget" ? 1800 : 2800;
    const food = style === "premium" ? 1200 : 700;
    const localTravel = 500;
    const perPersonPerDay = stay / 2 + food + localTravel;
    return Math.round(perPersonPerDay * Number(days) * Number(people));
  }, [days, people, style]);

  const guideAmount = useMemo(
    () => Number(guideForm.duration || 1) * selectedGuide.ratePerHour,
    [guideForm.duration, selectedGuide]
  );

  const rentalAmount = useMemo(() => {
    const rate = selectedAgency.vehicles[rentalForm.vehicleType]?.perDay || 0;
    return rate * Number(rentalForm.rentalDays || 1);
  }, [selectedAgency, rentalForm.vehicleType, rentalForm.rentalDays]);

  const toggleCheck = (item) => {
    const next = checkedItems.includes(item)
      ? checkedItems.filter((value) => value !== item)
      : [...checkedItems, item];
    setCheckedItems(next);
    localStorage.setItem("packingChecklist", JSON.stringify(next));
  };

  const handleGuideBooking = async (event) => {
    event.preventDefault();
    setBookingError("");

    if (!guideForm.date || !guideForm.guestName || !guideForm.email) {
      setBookingError("Please fill all required guide booking fields.");
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.createBooking({
        bookingType: "guide",
        serviceName: `Guide Tour - ${selectedGuide.name}`,
        guestName: guideForm.guestName,
        email: guideForm.email,
        phone: guideForm.phone,
        checkIn: guideForm.date,
        checkOut: guideForm.date,
        totalAmount: guideAmount,
        details: {
          guideName: selectedGuide.name,
          languages: selectedGuide.languages,
          durationHours: Number(guideForm.duration),
          travelers: Number(guideForm.travelers),
          meetingPoint: guideForm.meetingPoint,
        },
      });
      navigate(`/booking/success?bookingId=${response.booking._id}`);
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRentalBooking = async (event) => {
    event.preventDefault();
    setBookingError("");

    if (!rentalForm.startDate || !rentalForm.guestName || !rentalForm.email) {
      setBookingError("Please fill all required rental booking fields.");
      return;
    }

    const start = new Date(rentalForm.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(rentalForm.rentalDays || 1) - 1);

    setBookingLoading(true);
    try {
      const vehicle = selectedAgency.vehicles[rentalForm.vehicleType];
      const response = await api.createBooking({
        bookingType: "rental",
        serviceName: `${selectedAgency.name} - ${rentalForm.vehicleType.toUpperCase()} Rental`,
        guestName: rentalForm.guestName,
        email: rentalForm.email,
        phone: rentalForm.phone,
        checkIn: rentalForm.startDate,
        checkOut: formatDate(end),
        totalAmount: rentalAmount,
        details: {
          agencyName: selectedAgency.name,
          vehicleType: rentalForm.vehicleType,
          vehicleModel: vehicle.model,
          rentalDays: Number(rentalForm.rentalDays),
          pickupPoint: rentalForm.pickupPoint || selectedAgency.pickupPoint,
        },
      });
      navigate(`/booking/success?bookingId=${response.booking._id}`);
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <Layout>
      <section className="travel-desk-shell">
        <h1>Travel Desk</h1>
        <p>Advanced tools for real-life travel readiness and instant local bookings.</p>

        <div className="travel-desk-grid">
          <article className="desk-card">
            <h3>Budget Estimator</h3>
            <label>
              Days
              <input
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </label>
            <label>
              Travelers
              <input
                type="number"
                min={1}
                value={people}
                onChange={(event) => setPeople(event.target.value)}
              />
            </label>
            <label>
              Travel style
              <select value={style} onChange={(event) => setStyle(event.target.value)}>
                <option value="budget">Budget</option>
                <option value="balanced">Balanced</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <p className="estimate">Estimated trip cost: INR {budgetEstimate}</p>
          </article>

          <article className="desk-card">
            <h3>Packing Checklist</h3>
            <div className="checklist">
              {checklistItems.map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleCheck(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </article>

          <article className="desk-card">
            <h3>Emergency and Useful Contacts</h3>
            <ul>
              <li>Police: 112</li>
              <li>Ambulance: 108</li>
              <li>Women Helpline: 1091</li>
              <li>Tourist Helpline: 1363</li>
            </ul>
            <p>Tip: Share your itinerary with family before starting temple circuit.</p>
          </article>

          <article className="desk-card">
            <h3>Subscription Benefits</h3>
            <p>Take Plus/Pro plan for priority guide and bike/car rental discounts.</p>
            <Link to="/subscriptions" className="text-link">
              View plans
            </Link>
          </article>

          <article className="desk-card feature-card">
            <h3>Book a Mathura Travel Guide</h3>
            <p className="feature-subtitle">
              Pick a verified guide and reserve your temple/city experience.
            </p>
            <form className="feature-form" onSubmit={handleGuideBooking}>
              <label>
                Guide
                <select
                  value={guideForm.guideId}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, guideId: event.target.value }))
                  }
                >
                  {travelGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name} ({guide.rating}/5)
                    </option>
                  ))}
                </select>
              </label>
              <p className="mini-info">
                {selectedGuide.specialty} | {selectedGuide.experience} yrs | Languages: {" "}
                {selectedGuide.languages.join(", ")}
              </p>
              <label>
                Tour Date
                <input
                  type="date"
                  value={guideForm.date}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Duration (hours)
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={guideForm.duration}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, duration: event.target.value }))
                  }
                />
              </label>
              <label>
                Travelers
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guideForm.travelers}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, travelers: event.target.value }))
                  }
                />
              </label>
              <label>
                Meeting Point
                <input
                  type="text"
                  value={guideForm.meetingPoint}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, meetingPoint: event.target.value }))
                  }
                />
              </label>
              <label>
                Guest Name
                <input
                  type="text"
                  value={guideForm.guestName}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, guestName: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={guideForm.email}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={guideForm.phone}
                  onChange={(event) =>
                    setGuideForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </label>
              <p className="estimate">Guide booking estimate: INR {guideAmount}</p>
              <button type="submit" disabled={bookingLoading}>
                {bookingLoading ? "Booking..." : "Book Guide"}
              </button>
            </form>
          </article>

          <article className="desk-card feature-card">
            <h3>Book Bike or Car from Agencies</h3>
            <p className="feature-subtitle">
              Reserve local transport from Mathura travel agencies.
            </p>
            <form className="feature-form" onSubmit={handleRentalBooking}>
              <label>
                Agency
                <select
                  value={rentalForm.agencyId}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, agencyId: event.target.value }))
                  }
                >
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mini-info">Default pickup: {selectedAgency.pickupPoint}</p>
              <label>
                Vehicle Type
                <select
                  value={rentalForm.vehicleType}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, vehicleType: event.target.value }))
                  }
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </label>
              <p className="mini-info">
                Model: {selectedAgency.vehicles[rentalForm.vehicleType].model} | INR{" "}
                {selectedAgency.vehicles[rentalForm.vehicleType].perDay}/day
              </p>
              <label>
                Start Date
                <input
                  type="date"
                  value={rentalForm.startDate}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Rental Days
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={rentalForm.rentalDays}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, rentalDays: event.target.value }))
                  }
                />
              </label>
              <label>
                Pickup Point
                <input
                  type="text"
                  value={rentalForm.pickupPoint}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, pickupPoint: event.target.value }))
                  }
                  placeholder={selectedAgency.pickupPoint}
                />
              </label>
              <label>
                Guest Name
                <input
                  type="text"
                  value={rentalForm.guestName}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, guestName: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={rentalForm.email}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={rentalForm.phone}
                  onChange={(event) =>
                    setRentalForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </label>
              <p className="estimate">Rental estimate: INR {rentalAmount}</p>
              <button type="submit" disabled={bookingLoading}>
                {bookingLoading ? "Booking..." : "Book Vehicle"}
              </button>
            </form>
          </article>
        </div>

        {bookingError ? <p className="error-text">{bookingError}</p> : null}
      </section>
    </Layout>
  );
}

export default TravelDesk;
