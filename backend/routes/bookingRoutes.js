const express = require("express");
const Booking = require("../models/Booking");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_BOOKING_TYPES = new Set(["hotel", "guide", "rental"]);

function normalizeString(value) {
  return String(value || "").trim();
}

router.post("/create", requireAuth, async (req, res) => {
  try {
    const bookingType = normalizeString(req.body.bookingType || "hotel").toLowerCase();

    if (!ALLOWED_BOOKING_TYPES.has(bookingType)) {
      return res.status(400).json({ message: "Invalid booking type" });
    }

    const guestName = normalizeString(req.body.guestName);
    const email = normalizeString(req.body.email).toLowerCase();
    const phone = normalizeString(req.body.phone);
    const checkIn = normalizeString(req.body.checkIn);
    const checkOut = normalizeString(req.body.checkOut || req.body.checkIn);
    const totalAmount = Number(req.body.totalAmount);

    if (!guestName || !email || !checkIn || !checkOut || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Missing booking fields" });
    }

    const bookingData = {
      userId: req.user.userId,
      bookingType,
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      totalAmount,
      paymentStatus: "created",
      details:
        req.body.details && typeof req.body.details === "object" && !Array.isArray(req.body.details)
          ? req.body.details
          : {},
    };

    if (bookingType === "hotel") {
      const hotelId = normalizeString(req.body.hotelId);
      const hotelName = normalizeString(req.body.hotelName);
      const rooms = Number(req.body.rooms || 1);

      if (!hotelId || !hotelName || !Number.isFinite(rooms) || rooms < 1) {
        return res.status(400).json({ message: "Missing hotel booking fields" });
      }

      bookingData.hotelId = hotelId;
      bookingData.hotelName = hotelName;
      bookingData.serviceName = hotelName;
      bookingData.rooms = rooms;
    } else {
      const serviceName = normalizeString(req.body.serviceName);
      if (!serviceName) {
        return res.status(400).json({ message: "serviceName is required for this booking type" });
      }
      bookingData.serviceName = serviceName;
      bookingData.hotelName = serviceName;
      bookingData.hotelId = `${bookingType}_${Date.now()}`;
      bookingData.rooms = 1;
    }

    const booking = await Booking.create(bookingData);
    return res.status(201).json({ booking });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
});

router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
});

router.get("/:bookingId", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user.userId,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json({ booking });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch booking", error: error.message });
  }
});

module.exports = router;
