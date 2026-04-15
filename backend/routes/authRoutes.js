const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

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

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || "",
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = issueToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

module.exports = router;
