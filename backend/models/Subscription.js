const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      enum: ["basic", "plus", "pro"],
      required: true,
    },
    planName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentGateway: {
      type: String,
      enum: ["paytm", "razorpay", "manual"],
      default: "paytm",
    },
    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    paytmOrderId: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
