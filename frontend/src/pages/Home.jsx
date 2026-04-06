import { Link } from "react-router-dom";
import Layout from "../Components/Layout";
import placesData, { categoryLabelMap } from "../data/placesData";
import "./Home.css";

function Home() {
  const topPlaces = placesData.slice(0, 6);
  const categoryCounts = Object.entries(categoryLabelMap).map(
    ([key, label]) => ({
      label,
      count: placesData.filter((place) => place.category === key).length,
    })
  );

  return (
    <Layout>
      <section className="hero">
        <p className="hero-tag">Plan Smarter, Travel Better</p>
        <h1>Build your perfect Mathura trip in minutes</h1>
        <p>
          Explore sacred places, discover food and culture, and generate a
          practical day-wise itinerary based on your budget and interests.
        </p>
        <div className="hero-cta-row">
          <Link to="/itinerary" className="hero-btn primary">
            Generate Itinerary
          </Link>
          <Link to="/places" className="hero-btn secondary">
            Explore Places
          </Link>
        </div>
      </section>

      <section className="category-strip">
        {categoryCounts.map((item) => (
          <article key={item.label} className="category-pill">
            <strong>{item.label}</strong>
            <span>{item.count} stops</span>
          </article>
        ))}
      </section>

      <section className="preview-section">
        <h2>Popular stops to include</h2>
        <div className="home-grid">
          {topPlaces.map((place) => (
            <Link key={place.id} className="home-card" to={`/places/${place.id}`}>
              <img src={place.image} alt={place.name} />
              <div>
                <h3>{place.name}</h3>
                <p>{place.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-hints">
        <h3>Quick recommendations</h3>
        <ul>
          <li>Choose balanced pace for first-time visitors.</li>
          <li>Keep evenings open for aarti and Yamuna ghat walks.</li>
          <li>Bundle nearby places to reduce travel time.</li>
        </ul>
      </section>
    </Layout>
  );
}

export default Home;
