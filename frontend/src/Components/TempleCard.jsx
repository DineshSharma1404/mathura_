import { Link } from "react-router-dom";
import "./TempleCard.css";

function TempleCard({ temple }) {
  return (
    <Link to={`/temple/${temple.id}`} state={{ temple }}>
      <div className="temple-card">
        <img src={temple.image} alt={temple.name} />
        <h3>{temple.name}</h3>
      </div>
    </Link>
  );
}

export default TempleCard;
