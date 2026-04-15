const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getAuthToken() {
  return localStorage.getItem("authToken") || "";
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  createBooking: (payload) =>
    request("/bookings/create", { method: "POST", body: JSON.stringify(payload) }),
  getMyBookings: () => request("/bookings/my-bookings"),
  getBookingById: (bookingId) => request(`/bookings/${bookingId}`),
  createRazorpayOrder: (payload) =>
    request("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyRazorpayPayment: (payload) =>
    request("/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function saveSession({ token, user }) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

export function getCurrentUser() {
  const raw = localStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}
