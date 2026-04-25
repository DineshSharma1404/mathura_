import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, saveSession } from "../services/api";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("password");
  const [formData, setFormData] = useState({ identifier: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const onPasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.identifier.trim() || !formData.password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });
      saveSession(data);
      navigate(location.state?.from || "/my-trips");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendLoginOtp = async () => {
    setError("");
    const phone = formData.identifier.trim();
    if (!phone) {
      setError("Please enter phone number to receive OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.sendOtp({ purpose: "login", phone });
      setOtpSent(true);
      setDevOtp(response.devOtp || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOtp = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.identifier.trim() || !formData.otp.trim()) {
      setError("Phone and OTP are required.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.verifyOtp({
        purpose: "login",
        phone: formData.identifier.trim(),
        otp: formData.otp.trim(),
      });
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
        <div className="auth-mode-row">
          <button
            type="button"
            className={`auth-mode-button ${mode === "password" ? "active" : ""}`}
            onClick={() => {
              setMode("password");
              setError("");
            }}
          >
            Password
          </button>
          <button
            type="button"
            className={`auth-mode-button ${mode === "otp" ? "active" : ""}`}
            onClick={() => {
              setMode("otp");
              setError("");
            }}
          >
            OTP Login
          </button>
        </div>

        {mode === "password" ? (
          <form className="auth-form" onSubmit={onPasswordSubmit}>
            <label>
              Email or Phone
              <input
                type="text"
                value={formData.identifier}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, identifier: event.target.value }))
                }
                placeholder="name@email.com or +9198xxxxxx"
                required
              />
            </label>
            <label>
              Password
              <div className="input-with-action">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyLoginOtp}>
            <label>
              Phone
              <input
                type="text"
                value={formData.identifier}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, identifier: event.target.value }))
                }
                placeholder="+9198xxxxxx"
                required
              />
            </label>
            {otpSent ? (
              <label>
                OTP
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, otp: event.target.value }))
                  }
                  placeholder="6-digit OTP"
                  required
                />
              </label>
            ) : null}
            {devOtp ? <p className="hint-text">Dev OTP: {devOtp}</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
            <button type="button" onClick={sendLoginOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
            {otpSent ? (
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP and Login"}
              </button>
            ) : null}
          </form>
        )}

        <p>
          New user? <Link to="/signup">Create account</Link>
        </p>
      </section>
    </Layout>
  );
}

export default Login;
