const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hotelId: { type: String, required: true },
    hotelName: { type: String, required: true },
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    rooms: { type: Number, required: true, min: 1, max: 10 },
    totalAmount: { type: Number, required: true, min: 1 },
    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    confirmationStatus: {
      email: { type: String, enum: ["pending", "sent", "skipped"], default: "pending" },
      sms: { type: String, enum: ["pending", "sent", "skipped"], default: "pending" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
