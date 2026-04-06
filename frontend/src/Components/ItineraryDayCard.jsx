import "./ItineraryDayCard.css";

function ItineraryDayCard({ day, onSwap }) {
  return (
    <section className="day-card">
      <header>
        <h2>Day {day.day}</h2>
        <p>
          {day.summary.focusArea} | Travel buffer{" "}
          {day.summary.estimatedTravelBufferMinutes} mins
        </p>
      </header>

      <div className="timeline-list">
        {day.timeline.map((item) => (
          <article key={`${day.day}-${item.id}-${item.slot}`} className="timeline-item">
            <div>
              <small>{item.slotLabel}</small>
              <h4>{item.name}</h4>
              <p>{item.tip}</p>
            </div>
            <div className="timeline-actions">
              {item.mapLink ? (
                <a href={item.mapLink} target="_blank" rel="noreferrer">
                  Map
                </a>
              ) : null}
              {item.id && !item.id.startsWith("meal") ? (
                <button onClick={() => onSwap(day.day, item.id)}>Swap</button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ItineraryDayCard;
