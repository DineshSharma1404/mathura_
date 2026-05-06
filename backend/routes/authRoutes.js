const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOtpSms } = require("../services/notifyService");

const router = express.Router();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map();

function issueToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  const raw = String(value || "")
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^00/, "+");
  if (/^[0-9]{10}$/.test(raw)) return `+91${raw}`;
  return raw;
}

function isValidPhone(value) {
  if (!value) return true;
  return /^\+?[0-9]{10,15}$/.test(value);
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character";
  }
  return "";
}

function buildOtpKey(phone, purpose) {
  return `${phone}:${purpose}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const existingByEmail = await User.findOne({ email: cleanEmail });
    if (existingByEmail) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    if (cleanPhone) {
      const existingByPhone = await User.findOne({ phone: cleanPhone });
      if (existingByPhone) {
        return res.status(409).json({ message: "User already exists with this phone" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || "",
      passwordHash,
    });

    const token = issueToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = String(identifier || email || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: "email/phone and password are required" });
    }

    const cleanIdentifier = loginId.includes("@")
      ? loginId.toLowerCase()
      : normalizePhone(loginId);

    const user = await User.findOne(
      cleanIdentifier.includes("@")
        ? { email: cleanIdentifier }
        : { phone: { $in: [cleanIdentifier, cleanIdentifier.replace(/^\+91/, "")] } }
    );

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res
        .status(423)
        .json({ message: `Account temporarily locked. Try again in ${waitMinutes} minute(s).` });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = issueToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.post("/otp/send", async (req, res) => {
  try {
    const purpose = String(req.body.purpose || "login").trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);

    if (!isValidPhone(phone) || !phone) {
      return res.status(400).json({ message: "Valid phone is required" });
    }

    if (!["login", "signup"].includes(purpose)) {
      return res.status(400).json({ message: "Invalid OTP purpose" });
    }

    let payload = {};

    if (purpose === "login") {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: "No user found with this phone" });
      }
    }

    if (purpose === "signup") {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");

      if (!name || !email || !password) {
        return res.status(400).json({ message: "name, email, password are required for signup OTP" });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      const passwordError = validatePassword(password);
      if (passwordError) return res.status(400).json({ message: passwordError });

      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        return res.status(409).json({ message: "User already exists with this email" });
      }
      const existingByPhone = await User.findOne({ phone });
      if (existingByPhone) {
        return res.status(409).json({ message: "User already exists with this phone" });
      }

      payload = { name, email, passwordHash: await bcrypt.hash(password, 12) };
    }

    const otp = generateOtp();
    const key = buildOtpKey(phone, purpose);
    otpStore.set(key, {
      otpHash: sha(otp),
      expiresAt: Date.now() + OTP_TTL_MS,
      purpose,
      phone,
      payload,
    });

    const smsResult = await sendOtpSms({ phone, otp, purpose });
    if (smsResult.status !== "sent") {
      return res.status(500).json({
        message: "OTP SMS delivery failed",
        reason: smsResult.reason || "Unknown SMS provider error",
        code: smsResult.code || "",
        moreInfo: smsResult.moreInfo || "",
      });
    }

    const response = {
      success: true,
      message: "OTP sent successfully",
      via: smsResult.status,
    };

    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_OTP_IN_RESPONSE === "true") {
      response.devOtp = otp;
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
});

router.post("/otp/verify", async (req, res) => {
  try {
    const purpose = String(req.body.purpose || "login").trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();

    if (!phone || !otp) {
      return res.status(400).json({ message: "phone and otp are required" });
    }

    const key = buildOtpKey(phone, purpose);
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: "OTP expired. Please request a new OTP" });
    }

    if (sha(otp) !== stored.otpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.delete(key);

    if (purpose === "login") {
      const user = await User.findOne({ phone });
      if (!user) return res.status(404).json({ message: "User not found" });
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAt = new Date();
      await user.save();

      const token = issueToken(user);
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          subscription: user.subscription,
        },
      });
    }

    if (purpose === "signup") {
      const data = stored.payload || {};
      if (!data.name || !data.email || !data.passwordHash) {
        return res.status(400).json({ message: "Signup session expired. Send OTP again." });
      }

      const user = await User.create({
        name: data.name,
        email: data.email,
        phone,
        passwordHash: data.passwordHash,
      });

      const token = issueToken(user);
      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      });
    }

    return res.status(400).json({ message: "Invalid OTP purpose" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
});

module.exports = router;
