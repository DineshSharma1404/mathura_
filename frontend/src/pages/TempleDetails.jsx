import { useLocation } from "react-router-dom";
import Layout from "../Components/Layout";

function TempleDetails() {
  const { state } = useLocation();
  if (!state || !state.temple) {
    return (
      <Layout>
        <h2>No Temple Selected</h2>
      </Layout>
    );
  }
  const { temple } = state;

  return (
    <Layout>
      <div
        style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}
      >
        <h1>{temple.name}</h1>
        <img
          src={temple.image}
          alt={temple.name}
          style={{
            width: "100%",
            height: "400px",
            objectFit: "cover",
            borderRadius: "10px",
            margin: "20px 0",
          }}
        />
        <p>
          <b>Distance:</b> {temple.distance}
        </p>
        <p>
          <b>Opening:</b> {temple.openingTime}
        </p>
        <p>
          <b>Closing:</b> {temple.closingTime}
        </p>
        <p>
          <b>Description:</b> {temple.description}
        </p>
      </div>
    </Layout>
  );
}

export default TempleDetails;
