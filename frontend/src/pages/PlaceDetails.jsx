import { Link, useParams } from "react-router-dom";
import Layout from "../Components/Layout";
import placesData, { categoryLabelMap } from "../data/placesData";
import "./PlaceDetails.css";

function PlaceDetails() {
  const { id } = useParams();
  const place = placesData.find((item) => item.id === id);

  if (!place) {
    return (
      <Layout>
        <section className="details-shell">
          <h2>Place not found</h2>
          <Link to="/places">Go back to Places</Link>
        </section>
      </Layout>
    );
  }

  const nearby = placesData
    .filter((item) => item.areaGroup === place.areaGroup && item.id !== place.id)
    .slice(0, 3);

  const quickAdd = () => {
    const value = localStorage.getItem("selectedPlaces");
    const selected = value ? JSON.parse(value) : [];
    if (!selected.includes(place.id)) {
      selected.push(place.id);
      localStorage.setItem("selectedPlaces", JSON.stringify(selected));
    }
  };

  return (
    <Layout>
      <section className="details-shell">
        <img src={place.image} alt={place.name} className="details-banner" />
        <small className="details-category">{categoryLabelMap[place.category]}</small>
        <h1>{place.name}</h1>
        <p>{place.description}</p>

        <div className="details-meta">
          <span>Best visit: {place.bestTime}</span>
          <span>Hours: {place.openingTime + " - " + place.closingTime}</span>
          <span>Distance: {place.distance}</span>
        </div>

        <div className="details-actions">
          <a href={place.mapLink} target="_blank" rel="noreferrer">
            Open in Maps
          </a>
          <button onClick={quickAdd}>Add to itinerary context</button>
          <Link to="/itinerary">Plan my trip</Link>
        </div>

        <h3>Nearby suggestions</h3>
        <div className="nearby-list">
          {nearby.map((item) => (
            <Link to={`/places/${item.id}`} key={item.id}>
              {item.name}
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export default PlaceDetails;
