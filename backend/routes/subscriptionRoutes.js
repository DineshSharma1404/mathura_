const express = require("express");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const PLAN_CONFIG = {
  basic: {
    planName: "Basic Darshan",
    amount: 299,
    durationDays: 30,
    features: ["Trip checklist", "Booking support", "Standard chat support"],
  },
  plus: {
    planName: "Plus Yatra",
    amount: 699,
    durationDays: 30,
    features: ["Priority booking", "Guide discount", "Vehicle rental discount"],
  },
  pro: {
    planName: "Pro Mathura Pass",
    amount: 1499,
    durationDays: 90,
    features: ["All Plus benefits", "Personal itinerary review", "Fast-track assistance"],
  },
};

router.get("/plans", (req, res) => {
  return res.json({
    plans: Object.entries(PLAN_CONFIG).map(([code, value]) => ({
      code,
      ...value,
    })),
  });
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ subscriptions });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch subscriptions", error: error.message });
  }
});

router.post("/create", requireAuth, async (req, res) => {
  try {
    const planCode = String(req.body.planCode || "").trim().toLowerCase();
    const paymentGateway = String(req.body.paymentGateway || "paytm").trim().toLowerCase();
    const plan = PLAN_CONFIG[planCode];

    if (!plan) {
      return res.status(400).json({ message: "Invalid plan code" });
    }

    const subscription = await Subscription.create({
      userId: req.user.userId,
      planCode,
      planName: plan.planName,
      amount: plan.amount,
      durationDays: plan.durationDays,
      features: plan.features,
      paymentGateway: ["paytm", "razorpay", "manual"].includes(paymentGateway)
        ? paymentGateway
        : "paytm",
      paymentStatus: "created",
      status: "pending",
    });

    return res.status(201).json({ subscription });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create subscription", error: error.message });
  }
});

router.post("/activate", requireAuth, async (req, res) => {
  try {
    const { subscriptionId, paymentReference, paymentGateway } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: "subscriptionId is required" });
    }

    const subscription = await Subscription.findOne({ _id: subscriptionId, userId: req.user.userId });
    if (!subscription) return res.status(404).json({ message: "Subscription not found" });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(subscription.durationDays || 30));

    subscription.status = "active";
    subscription.paymentStatus = "paid";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.paymentReference = String(paymentReference || "");
    if (paymentGateway) {
      subscription.paymentGateway = ["paytm", "razorpay", "manual"].includes(paymentGateway)
        ? paymentGateway
        : subscription.paymentGateway;
    }
    await subscription.save();

    await User.findByIdAndUpdate(req.user.userId, {
      subscription: {
        planCode: subscription.planCode,
        status: "active",
        startDate,
        endDate,
      },
    });

    return res.json({ success: true, subscription });
  } catch (error) {
    return res.status(500).json({ message: "Failed to activate subscription", error: error.message });
  }
});

module.exports = router;
