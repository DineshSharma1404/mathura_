import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Components/Layout";
import hotelsData from "../data/hotelsData";
import "./Hotels.css";

function Hotels() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [favorites, setFavorites] = useState(() => {
    const data = localStorage.getItem("favoriteHotels");
    return data ? JSON.parse(data) : [];
  });

  const filteredHotels = useMemo(() => {
    const list = hotelsData
      .filter(
        (hotel) =>
          hotel.pricePerNight <= Number(maxPrice) &&
          `${hotel.name} ${hotel.area}`
            .toLowerCase()
            .includes(search.toLowerCase().trim())
      )
      .slice();

    if (sortBy === "priceLow") list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortBy === "priceHigh") list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [maxPrice, search, sortBy]);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("favoriteHotels", JSON.stringify(next));
  };

  return (
    <Layout>
      <section className="hotels-shell">
        <h1>Book Hotels in Mathura and Vrindavan</h1>
        <p>Choose from verified stays and complete a quick booking flow.</p>

        <div className="hotels-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by hotel or area..."
          />
          <label>
            Max price: INR {maxPrice}
            <input
              type="range"
              min={1500}
              max={6000}
              step={100}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="hotel-grid">
          {filteredHotels.map((hotel) => (
            <article key={hotel.id} className="hotel-card">
              <img src={hotel.image} alt={hotel.name} />
              <div>
                <h3>{hotel.name}</h3>
                <p>{hotel.area}</p>
                <p>Rating: {hotel.rating} / 5</p>
                <strong>INR {hotel.pricePerNight} / night</strong>
                <button
                  className={favorites.includes(hotel.id) ? "fav-btn active" : "fav-btn"}
                  onClick={() => toggleFavorite(hotel.id)}
                >
                  {favorites.includes(hotel.id) ? "Saved to Favorites" : "Save Hotel"}
                </button>
                <div className="hotel-actions">
                  <Link to={`/hotels/${hotel.id}`}>View details</Link>
                  <Link to={`/hotels/${hotel.id}/book`} className="book-btn">
                    Book now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export default Hotels;
