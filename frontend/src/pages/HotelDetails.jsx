import { Link, useParams } from "react-router-dom";
import Layout from "../Components/Layout";
import hotelsData from "../data/hotelsData";
import "./HotelDetails.css";

function HotelDetails() {
  const { id } = useParams();
  const hotel = hotelsData.find((item) => item.id === id);

  if (!hotel) {
    return (
      <Layout>
        <section className="hotel-details-shell">
          <h2>Hotel not found</h2>
          <Link to="/hotels">Back to hotels</Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hotel-details-shell">
        <img src={hotel.image} alt={hotel.name} className="hotel-banner" />
        <h1>{hotel.name}</h1>
        <p>{hotel.description}</p>
        <p>
          <strong>Area:</strong> {hotel.area}
        </p>
        <p>
          <strong>Rating:</strong> {hotel.rating} / 5
        </p>
        <p>
          <strong>Price:</strong> INR {hotel.pricePerNight} per night
        </p>
        <div className="amenity-list">
          {hotel.amenities.map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
        </div>
        <Link className="book-btn" to={`/hotels/${hotel.id}/book`}>
          Continue to booking
        </Link>
      </section>
    </Layout>
  );
}

export default HotelDetails;
