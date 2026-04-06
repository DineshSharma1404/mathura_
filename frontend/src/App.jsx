import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Places from "./pages/Places";
import PlaceDetails from "./pages/PlaceDetails";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import ItineraryResult from "./pages/ItineraryResult";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/places" element={<Places />} />
        <Route path="/places/:id" element={<PlaceDetails />} />
        <Route path="/itinerary" element={<ItineraryBuilder />} />
        <Route path="/itinerary/result" element={<ItineraryResult />} />
        <Route path="/temples" element={<Navigate to="/places" replace />} />
        <Route path="/temple/:id" element={<Navigate to="/places" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
