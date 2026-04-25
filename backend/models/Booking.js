const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ["hotel", "guide", "rental"],
      default: "hotel",
      index: true,
    },
    hotelId: {
      type: String,
      required() {
        return this.bookingType === "hotel";
      },
      default: "",
    },
    hotelName: {
      type: String,
      required() {
        return this.bookingType === "hotel";
      },
      default: "",
    },
    serviceName: { type: String, default: "" },
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    rooms: {
      type: Number,
      required() {
        return this.bookingType === "hotel";
      },
      min: 1,
      max: 10,
      default: 1,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
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
