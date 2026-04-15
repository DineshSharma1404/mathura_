const express = require("express");
const Booking = require("../models/Booking");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create", requireAuth, async (req, res) => {
  try {
    const { hotelId, hotelName, guestName, email, phone, checkIn, checkOut, rooms, totalAmount } =
      req.body;

    if (!hotelId || !hotelName || !guestName || !email || !checkIn || !checkOut || !rooms || !totalAmount) {
      return res.status(400).json({ message: "Missing booking fields" });
    }

    const booking = await Booking.create({
      userId: req.user.userId,
      hotelId,
      hotelName,
      guestName,
      email,
      phone: phone || "",
      checkIn,
      checkOut,
      rooms: Number(rooms),
      totalAmount: Number(totalAmount),
      paymentStatus: "created",
    });

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
