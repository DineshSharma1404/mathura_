import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import ItineraryDayCard from "../Components/ItineraryDayCard";
import { generateItinerary, swapActivity } from "../utils/generateItinerary";
import "./ItineraryResult.css";

function ItineraryResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const fallbackItinerary = useMemo(() => {
    const value = localStorage.getItem("lastItinerary");
    return value ? JSON.parse(value) : null;
  }, []);
  const fallbackPreferences = useMemo(() => {
    const value = localStorage.getItem("lastPreferences");
    return value ? JSON.parse(value) : null;
  }, []);

  const [itinerary, setItinerary] = useState(
    location.state?.itinerary || fallbackItinerary
  );
  const preferences = location.state?.preferences || fallbackPreferences;

  if (!itinerary || !preferences) {
    return (
      <Layout>
        <section className="result-shell">
          <h2>No itinerary generated yet</h2>
          <p>Generate one first to view your day-wise Mathura plan.</p>
          <Link to="/itinerary">Go to itinerary builder</Link>
        </section>
      </Layout>
    );
  }

  const regenerate = () => {
    const next = generateItinerary(preferences);
    setItinerary(next);
    localStorage.setItem("lastItinerary", JSON.stringify(next));
  };

  const swapPlace = (dayNumber, activityId) => {
    const updated = swapActivity(itinerary, dayNumber, activityId, preferences);
    setItinerary(updated);
    localStorage.setItem("lastItinerary", JSON.stringify(updated));
  };

  const copyPlan = async () => {
    const content = itinerary.days
      .map(
        (day) =>
          `Day ${day.day}\n` +
          day.timeline.map((item) => `- ${item.slotLabel}: ${item.name}`).join("\n")
      )
      .join("\n\n");

    await navigator.clipboard.writeText(content);
  };

  return (
    <Layout>
      <section className="result-shell">
        <header className="result-header">
          <h1>Your Mathura itinerary is ready</h1>
          <p>
            {preferences.days} days | {preferences.budget} budget |{" "}
            {preferences.pace} pace
          </p>
          <div className="result-actions">
            <button onClick={regenerate}>Regenerate</button>
            <button onClick={copyPlan}>Copy plan</button>
            <button onClick={() => navigate("/itinerary")}>Edit preferences</button>
          </div>
        </header>

        <div className="result-layout">
          <div className="day-cards-list">
            {itinerary.days.map((day) => (
              <ItineraryDayCard key={day.day} day={day} onSwap={swapPlace} />
            ))}
          </div>
          <aside className="summary-panel">
            <h3>Trip quick tips</h3>
            <ul>
              {itinerary.quickTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <Link to="/places">Explore more places</Link>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

export default ItineraryResult;
