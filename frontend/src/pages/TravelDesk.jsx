import { useMemo, useState } from "react";
import Layout from "../Components/Layout";
import "./TravelDesk.css";

const checklistItems = [
  "Government ID proof",
  "Comfortable footwear",
  "Water bottle",
  "Light traditional wear",
  "Phone charger and power bank",
  "Cash for local purchases",
];

function TravelDesk() {
  const [days, setDays] = useState(2);
  const [people, setPeople] = useState(2);
  const [style, setStyle] = useState("balanced");
  const [checkedItems, setCheckedItems] = useState(() => {
    const value = localStorage.getItem("packingChecklist");
    return value ? JSON.parse(value) : [];
  });

  const budgetEstimate = useMemo(() => {
    const stay = style === "premium" ? 4500 : style === "budget" ? 1800 : 2800;
    const food = style === "premium" ? 1200 : 700;
    const localTravel = 500;
    const perPersonPerDay = stay / 2 + food + localTravel;
    return Math.round(perPersonPerDay * Number(days) * Number(people));
  }, [days, people, style]);

  const toggleCheck = (item) => {
    const next = checkedItems.includes(item)
      ? checkedItems.filter((value) => value !== item)
      : [...checkedItems, item];
    setCheckedItems(next);
    localStorage.setItem("packingChecklist", JSON.stringify(next));
  };

  return (
    <Layout>
      <section className="travel-desk-shell">
        <h1>Travel Desk</h1>
        <p>Advanced tools for real-life travel readiness.</p>

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
        </div>
      </section>
    </Layout>
  );
}

export default TravelDesk;
