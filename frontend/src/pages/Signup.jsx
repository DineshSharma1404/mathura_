import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import { api, saveSession } from "../services/api";
import "./Auth.css";

function Signup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("password");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const passwordChecks = useMemo(
    () => ({
      minLength: formData.password.length >= 8,
      upper: /[A-Z]/.test(formData.password),
      lower: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[^A-Za-z0-9]/.test(formData.password),
    }),
    [formData.password]
  );

  const passwordReady = Object.values(passwordChecks).every(Boolean);

  const validateCommon = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Name, email and phone are required.");
      return false;
    }

    if (!passwordReady) {
      setError("Please create a stronger password before signing up.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match.");
      return false;
    }

    return true;
  };

  const onPasswordSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateCommon()) return;

    setLoading(true);
    try {
      const data = await api.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      saveSession(data);
      navigate("/my-trips");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendSignupOtp = async () => {
    setError("");

    if (!validateCommon()) return;

    setLoading(true);
    try {
      const response = await api.sendOtp({
        purpose: "signup",
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      setOtpSent(true);
      setDevOtp(response.devOtp || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.verifyOtp({
        purpose: "signup",
        phone: formData.phone.trim(),
        otp: formData.otp.trim(),
      });
      saveSession(data);
      navigate("/my-trips");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRuleClass = (rule) => (rule ? "rule-ok" : "rule-pending");

  return (
    <Layout>
      <section className="auth-shell">
        <h1>Create Account</h1>
        <p>Sign up to save bookings and receive confirmations.</p>

        <div className="auth-mode-row">
          <button
            type="button"
            className={`auth-mode-button ${mode === "password" ? "active" : ""}`}
            onClick={() => {
              setMode("password");
              setError("");
            }}
          >
            Normal Signup
          </button>
          <button
            type="button"
            className={`auth-mode-button ${mode === "otp" ? "active" : ""}`}
            onClick={() => {
              setMode("otp");
              setError("");
            }}
          >
            OTP Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={mode === "password" ? onPasswordSignup : verifySignupOtp}>
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
              placeholder="+9198xxxxxx"
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

          <div className="password-rules">
            <p>Password must include:</p>
            <ul>
              <li className={getRuleClass(passwordChecks.minLength)}>8+ characters</li>
              <li className={getRuleClass(passwordChecks.upper)}>1 uppercase letter</li>
              <li className={getRuleClass(passwordChecks.lower)}>1 lowercase letter</li>
              <li className={getRuleClass(passwordChecks.number)}>1 number</li>
              <li className={getRuleClass(passwordChecks.special)}>1 special character</li>
            </ul>
          </div>

          <label>
            Confirm Password
            <div className="input-with-action">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                required
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {mode === "otp" ? (
            <>
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
              <button type="button" onClick={sendSignupOtp} disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading
              ? mode === "password"
                ? "Creating..."
                : "Verifying..."
              : mode === "password"
                ? "Create account"
                : "Verify OTP and Create account"}
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
