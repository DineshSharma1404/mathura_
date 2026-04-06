import Layout from "../Components/Layout";
import TempleCard from "../Components/TempleCard";
import templesData from "../data/templesData";

function Temples() {
  return (
    <Layout>
      <h1 style={{ textAlign: "center", marginTop: "20px" }}>All Temples</h1>
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "25px",
          padding: "20px",
        }}
      >
        {templesData.map((t) => (
          <TempleCard key={t.id} temple={t} />
        ))}
      </div>
    </Layout>
  );
}

export default Temples;
