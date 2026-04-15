import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, saveSession } from "../services/api";
import "./Auth.css";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.signup(formData);
      saveSession(data);
      navigate("/my-trips");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="auth-shell">
        <h1>Create Account</h1>
        <p>Sign up to save bookings and receive confirmations.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={formData.password}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </Layout>
  );
}

export default Signup;
