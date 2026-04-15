import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, saveSession } from "../services/api";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(formData);
      saveSession(data);
      navigate(location.state?.from || "/my-trips");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="auth-shell">
        <h1>Login</h1>
        <p>Access your bookings, payment history, and travel dashboard.</p>
        <form className="auth-form" onSubmit={onSubmit}>
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p>
          New user? <Link to="/signup">Create account</Link>
        </p>
      </section>
    </Layout>
  );
}

export default Login;
