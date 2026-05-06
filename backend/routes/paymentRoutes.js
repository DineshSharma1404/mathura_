const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
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

function normalizeForSignature(payload) {
  return Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");
}

function generatePaytmChecksum(payload) {
  const merchantKey = process.env.PAYTM_MERCHANT_KEY || "";
  const base = normalizeForSignature(payload);
  return crypto.createHmac("sha256", merchantKey).update(base).digest("hex");
}

function getPaytmConfig() {
  return {
    merchantId: process.env.PAYTM_MERCHANT_ID || "",
    website: process.env.PAYTM_WEBSITE || "WEBSTAGING",
    channelId: process.env.PAYTM_CHANNEL_ID || "WEB",
    industryTypeId: process.env.PAYTM_INDUSTRY_TYPE_ID || "Retail",
    checkoutUrl:
      process.env.PAYTM_CHECKOUT_URL ||
      "https://securegw-stage.paytm.in/theia/processTransaction",
    callbackUrl:
      process.env.PAYTM_CALLBACK_URL || "http://localhost:5000/api/payments/paytm/callback",
  };
}

async function markBookingPaid(booking, paymentMeta) {
  booking.paymentStatus = "paid";
  booking.razorpayOrderId = paymentMeta.orderId || booking.razorpayOrderId;
  booking.razorpayPaymentId = paymentMeta.paymentId || booking.razorpayPaymentId;
  booking.razorpaySignature = paymentMeta.signature || booking.razorpaySignature;

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
  return { emailResult, smsResult };
}

async function activateSubscription(subscription, paymentMeta = {}) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(subscription.durationDays || 30));

  subscription.status = "active";
  subscription.paymentStatus = "paid";
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  subscription.paymentReference = paymentMeta.paymentId || "";
  await subscription.save();

  await User.findByIdAndUpdate(subscription.userId, {
    subscription: {
      planCode: subscription.planCode,
      status: "active",
      startDate,
      endDate,
    },
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

    const notifications = await markBookingPaid(booking, {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    return res.json({
      success: true,
      booking,
      notifications: { email: notifications.emailResult, sms: notifications.smsResult },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
});

router.post("/paytm/order", requireAuth, async (req, res) => {
  try {
    const { bookingId, subscriptionId } = req.body;
    if (!bookingId && !subscriptionId) {
      return res.status(400).json({ message: "bookingId or subscriptionId is required" });
    }

    const config = getPaytmConfig();
    if (!config.merchantId || !process.env.PAYTM_MERCHANT_KEY) {
      return res.status(500).json({ message: "Paytm credentials are not configured" });
    }

    let amount = 0;
    let orderContext = "";
    let customerEmail = "";

    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      amount = booking.totalAmount;
      orderContext = `BOOK_${booking._id}`;
      customerEmail = booking.email;
      booking.razorpayOrderId = "";
      await booking.save();
    }

    if (subscriptionId) {
      const subscription = await Subscription.findOne({ _id: subscriptionId, userId: req.user.userId });
      if (!subscription) return res.status(404).json({ message: "Subscription not found" });
      amount = subscription.amount;
      orderContext = `SUB_${subscription._id}`;
    }

    const orderId = `PAYTM_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
    const callbackUrl = `${config.callbackUrl}?ctx=${orderContext}`;

    const payload = {
      MID: config.merchantId,
      WEBSITE: config.website,
      CHANNEL_ID: config.channelId,
      INDUSTRY_TYPE_ID: config.industryTypeId,
      ORDER_ID: orderId,
      CUST_ID: req.user.userId,
      TXN_AMOUNT: Number(amount).toFixed(2),
      CALLBACK_URL: callbackUrl,
      ...(customerEmail ? { EMAIL: customerEmail } : {}),
    };

    const checksumHash = generatePaytmChecksum(payload);
    let demoVerification = null;

    if (bookingId) {
      await Booking.updateOne(
        { _id: bookingId, userId: req.user.userId },
        { $set: { razorpayOrderId: orderId } }
      );
    }

    if (subscriptionId) {
      await Subscription.updateOne(
        { _id: subscriptionId, userId: req.user.userId },
        { $set: { paytmOrderId: orderId } }
      );
    }

    if (process.env.PAYTM_DEMO_MODE !== "false") {
      const txnId = `TXN_${Date.now()}`;
      const verificationPayload = {
        MID: config.merchantId,
        ORDER_ID: orderId,
        TXNID: txnId,
        STATUS: "TXN_SUCCESS",
        TXN_AMOUNT: Number(amount).toFixed(2),
      };
      demoVerification = {
        orderId,
        txnId,
        txnStatus: "TXN_SUCCESS",
        checksumHash: generatePaytmChecksum(verificationPayload),
      };
    }

    return res.json({
      gateway: "paytm",
      checkoutUrl: config.checkoutUrl,
      params: {
        ...payload,
        CHECKSUMHASH: checksumHash,
      },
      bookingId: bookingId || null,
      subscriptionId: subscriptionId || null,
      demoVerification,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create Paytm order", error: error.message });
  }
});

router.post("/paytm/verify", requireAuth, async (req, res) => {
  try {
    const { bookingId, subscriptionId, orderId, txnId, txnStatus, checksumHash } = req.body;
    if (!orderId || !txnId || !txnStatus || !checksumHash) {
      return res.status(400).json({ message: "Missing Paytm verification fields" });
    }

    if (!bookingId && !subscriptionId) {
      return res.status(400).json({ message: "bookingId or subscriptionId is required" });
    }

    let amount = 0;
    let booking = null;
    let subscription = null;

    if (bookingId) {
      booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      amount = booking.totalAmount;
    }

    if (subscriptionId) {
      subscription = await Subscription.findOne({ _id: subscriptionId, userId: req.user.userId });
      if (!subscription) return res.status(404).json({ message: "Subscription not found" });
      amount = subscription.amount;
    }

    const config = getPaytmConfig();
    const verificationPayload = {
      MID: config.merchantId,
      ORDER_ID: orderId,
      TXNID: txnId,
      STATUS: txnStatus,
      TXN_AMOUNT: Number(amount).toFixed(2),
    };

    const generatedChecksum = generatePaytmChecksum(verificationPayload);
    if (generatedChecksum !== checksumHash) {
      if (booking) {
        booking.paymentStatus = "failed";
        await booking.save();
      }
      if (subscription) {
        subscription.paymentStatus = "failed";
        await subscription.save();
      }
      return res.status(400).json({ message: "Paytm signature verification failed" });
    }

    if (txnStatus !== "TXN_SUCCESS") {
      if (booking) {
        booking.paymentStatus = "failed";
        await booking.save();
      }
      if (subscription) {
        subscription.paymentStatus = "failed";
        await subscription.save();
      }
      return res.status(400).json({ message: "Transaction failed", status: txnStatus });
    }

    if (booking) {
      const notifications = await markBookingPaid(booking, {
        orderId,
        paymentId: txnId,
        signature: checksumHash,
      });
      return res.json({
        success: true,
        booking,
        notifications: { email: notifications.emailResult, sms: notifications.smsResult },
      });
    }

    if (subscription) {
      await activateSubscription(subscription, { paymentId: txnId });
      return res.json({ success: true, subscription });
    }

    return res.status(400).json({ message: "No payment target found" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify Paytm payment", error: error.message });
  }
});

router.post("/manual/confirm", requireAuth, async (req, res) => {
  try {
    const { bookingId, subscriptionId, transactionRef } = req.body;

    if (!bookingId && !subscriptionId) {
      return res.status(400).json({ message: "bookingId or subscriptionId is required" });
    }

    if (!transactionRef || String(transactionRef).trim().length < 4) {
      return res.status(400).json({ message: "Valid transactionRef is required" });
    }

    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const notifications = await markBookingPaid(booking, {
        orderId: `MANUAL_${Date.now()}`,
        paymentId: String(transactionRef).trim(),
        signature: "manual",
      });

      return res.json({
        success: true,
        booking,
        mode: "manual",
        notifications: { email: notifications.emailResult, sms: notifications.smsResult },
      });
    }

    const subscription = await Subscription.findOne({ _id: subscriptionId, userId: req.user.userId });
    if (!subscription) return res.status(404).json({ message: "Subscription not found" });

    await activateSubscription(subscription, { paymentId: String(transactionRef).trim() });
    subscription.paymentGateway = "manual";
    await subscription.save();

    return res.json({ success: true, subscription, mode: "manual" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to confirm manual payment", error: error.message });
  }
});

module.exports = router;
