const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const { requireAuth } = require("../middleware/auth");
const { sendEmailConfirmation, sendSmsConfirmation } = require("../services/notifyService");

const router = express.Router();

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.post("/razorpay/order", requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay keys are not configured" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: "INR",
      receipt: `booking_${booking._id}`,
      payment_capture: 1,
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
});

router.post("/razorpay/verify", requireAuth, async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generated !== razorpaySignature) {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    booking.paymentStatus = "paid";
    booking.razorpayOrderId = razorpayOrderId;
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;

    const emailResult = await sendEmailConfirmation({
      to: booking.email,
      bookingId: booking._id.toString(),
      hotelName: booking.hotelName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
    });

    const smsResult = await sendSmsConfirmation({
      phone: booking.phone,
      bookingId: booking._id.toString(),
      hotelName: booking.hotelName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    });

    booking.confirmationStatus.email = emailResult.status === "sent" ? "sent" : "skipped";
    booking.confirmationStatus.sms = smsResult.status === "sent" ? "sent" : "skipped";
    await booking.save();

    return res.json({
      success: true,
      booking,
      notifications: { email: emailResult, sms: smsResult },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
});

module.exports = router;
