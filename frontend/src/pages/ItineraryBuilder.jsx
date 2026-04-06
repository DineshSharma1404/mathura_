import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import placesData from "../data/placesData";
import { generateItinerary } from "../utils/generateItinerary";
import "./ItineraryBuilder.css";

const initialState = {
  days: 2,
  budget: "medium",
  interests: ["temple", "culture"],
  pace: "balanced",
  startPreference: "early",
};

function ItineraryBuilder() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");

  const recommendations = useMemo(() => {
    return placesData
      .filter(
        (place) =>
          formData.interests.includes(place.category) ||
          place.tags.some((tag) => formData.interests.includes(tag))
      )
      .slice(0, 4);
  }, [formData.interests]);

  const updateInterest = (value) => {
    const current = formData.interests;
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setFormData((previous) => ({ ...previous, interests: next }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!formData.interests.length) {
      setError("Select at least one interest.");
      return;
    }
    if (!formData.days || Number(formData.days) < 1) {
      setError("Trip duration must be at least 1 day.");
      return;
    }

    const itinerary = generateItinerary({
      ...formData,
      days: Number(formData.days),
    });

    localStorage.setItem("lastPreferences", JSON.stringify(formData));
    localStorage.setItem("lastItinerary", JSON.stringify(itinerary));
    setError("");
    navigate("/itinerary/result", { state: { itinerary, preferences: formData } });
  };

  return (
    <Layout>
      <section className="builder-shell">
        <h1>Generate your Mathura itinerary</h1>
        <p>Pick your trip style and get a complete day-wise plan.</p>

        <form className="builder-grid" onSubmit={onSubmit}>
          <label>
            Number of days
            <input
              value={formData.days}
              min={1}
              max={7}
              type="number"
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  days: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Budget
            <select
              value={formData.budget}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  budget: event.target.value,
                }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <fieldset>
            <legend>Interests</legend>
            <div className="checkbox-grid">
              {["temple", "culture", "food", "family", "spiritual"].map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(option)}
                    onChange={() => updateInterest(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            Travel pace
            <select
              value={formData.pace}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, pace: event.target.value }))
              }
            >
              <option value="relaxed">Relaxed</option>
              <option value="balanced">Balanced</option>
              <option value="packed">Packed</option>
            </select>
          </label>

          <label>
            Start day preference
            <select
              value={formData.startPreference}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  startPreference: event.target.value,
                }))
              }
            >
              <option value="early">Early start</option>
              <option value="normal">Normal start</option>
            </select>
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit">Generate itinerary</button>
        </form>

        <aside className="builder-suggestions">
          <h3>Instant recommendations</h3>
          {recommendations.map((place) => (
            <article key={place.id}>
              <strong>{place.name}</strong>
              <p>{place.shortDescription}</p>
            </article>
          ))}
        </aside>
      </section>
    </Layout>
  );
}

export default ItineraryBuilder;
