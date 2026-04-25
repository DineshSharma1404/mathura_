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
  sendOtp: (payload) =>
    request("/auth/otp/send", { method: "POST", body: JSON.stringify(payload) }),
  verifyOtp: (payload) =>
    request("/auth/otp/verify", { method: "POST", body: JSON.stringify(payload) }),

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
  createPaytmOrder: (payload) =>
    request("/payments/paytm/order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyPaytmPayment: (payload) =>
    request("/payments/paytm/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getSubscriptionPlans: () => request("/subscriptions/plans"),
  getMySubscriptions: () => request("/subscriptions/my"),
  createSubscription: (payload) =>
    request("/subscriptions/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  activateSubscription: (payload) =>
    request("/subscriptions/activate", {
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

export function submitPaytmCheckout(checkoutUrl, params) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;

  Object.entries(params || {}).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
