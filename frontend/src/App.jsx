import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Places from "./pages/Places";
import PlaceDetails from "./pages/PlaceDetails";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import ItineraryResult from "./pages/ItineraryResult";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import HotelBooking from "./pages/HotelBooking";
import BookingSuccess from "./pages/BookingSuccess";
import MyTrips from "./pages/MyTrips";
import TravelDesk from "./pages/TravelDesk";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Subscriptions from "./pages/Subscriptions";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/places" element={<Places />} />
        <Route path="/places/:id" element={<PlaceDetails />} />
        <Route path="/itinerary" element={<ItineraryBuilder />} />
        <Route path="/itinerary/result" element={<ItineraryResult />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route
          path="/hotels/:id/book"
          element={
            <ProtectedRoute>
              <HotelBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/success"
          element={
            <ProtectedRoute>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trips"
          element={
            <ProtectedRoute>
              <MyTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/travel-desk"
          element={
            <ProtectedRoute>
              <TravelDesk />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route path="/temples" element={<Navigate to="/places" replace />} />
        <Route path="/temple/:id" element={<Navigate to="/places" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
