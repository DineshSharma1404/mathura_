import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Components/Layout";
import placesData, { categoryLabelMap } from "../data/placesData";
import "./Places.css";

function Places() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedForPlan, setSelectedForPlan] = useState(() => {
    const value = localStorage.getItem("selectedPlaces");
    return value ? JSON.parse(value) : [];
  });

  const filteredPlaces = useMemo(() => {
    return placesData.filter((place) => {
      const matchesCategory = category === "all" || place.category === category;
      const matchesSearch =
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase().trim())
        );
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const quickAdd = (placeId) => {
    const updated = selectedForPlan.includes(placeId)
      ? selectedForPlan.filter((id) => id !== placeId)
      : [...selectedForPlan, placeId];
    setSelectedForPlan(updated);
    localStorage.setItem("selectedPlaces", JSON.stringify(updated));
  };

  return (
    <Layout>
      <section className="places-shell">
        <header className="places-header">
          <h1>Explore places in Mathura and Vrindavan</h1>
          <p>
            Filter by category, search by interests, and quickly mark places for
            your itinerary.
          </p>
        </header>

        <div className="places-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search places or interests..."
          />
          <div className="chip-row">
            <button
              className={category === "all" ? "chip active" : "chip"}
              onClick={() => setCategory("all")}
            >
              All
            </button>
            {Object.entries(categoryLabelMap).map(([key, label]) => (
              <button
                key={key}
                className={category === key ? "chip active" : "chip"}
                onClick={() => setCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="places-grid">
          {filteredPlaces.map((place) => {
            const isSelected = selectedForPlan.includes(place.id);
            return (
              <article key={place.id} className="place-card">
                <img src={place.image} alt={place.name} />
                <div className="place-card-content">
                  <small>{categoryLabelMap[place.category]}</small>
                  <h3>{place.name}</h3>
                  <p>{place.shortDescription}</p>
                  <div className="place-actions">
                    <Link to={`/places/${place.id}`}>View details</Link>
                    <button
                      className={isSelected ? "selected" : ""}
                      onClick={() => quickAdd(place.id)}
                    >
                      {isSelected ? "Added" : "Quick add"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}

export default Places;
