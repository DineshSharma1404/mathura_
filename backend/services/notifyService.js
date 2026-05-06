const nodemailer = require("nodemailer");

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

async function sendEmailConfirmation({ to, bookingId, hotelName, checkIn, checkOut, totalAmount }) {
  const transporter = getTransporter();
  if (!transporter) return { status: "skipped", reason: "SMTP not configured" };

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Mathura Guide Booking Confirmed - ${bookingId}`,
    text: `Your booking is confirmed.\nBooking ID: ${bookingId}\nHotel: ${hotelName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nTotal: INR ${totalAmount}`,
  });

  return { status: "sent" };
}

async function sendSmsConfirmation({ phone, bookingId, hotelName, checkIn, checkOut }) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    return { status: "skipped", reason: "Twilio not configured" };
  }

  if (!phone) {
    return { status: "skipped", reason: "Missing recipient phone" };
  }

  const twilio = require("twilio");
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Mathura Guide: Booking ${bookingId} confirmed at ${hotelName}. ${checkIn} to ${checkOut}.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { status: "sent" };
}

async function sendOtpSms({ phone, otp, purpose }) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    return { status: "skipped", reason: "Twilio not configured" };
  }

  if (!phone || !otp) {
    return { status: "skipped", reason: "Missing recipient phone or otp" };
  }

  try {
    const twilio = require("twilio");
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      body: `Mathura Explorer OTP for ${purpose}: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return { status: "sent", sid: message.sid };
  } catch (error) {
    return {
      status: "failed",
      reason: error.message || "Twilio send failed",
      code: error.code || "",
      moreInfo: error.moreInfo || "",
    };
  }
}

module.exports = { sendEmailConfirmation, sendSmsConfirmation, sendOtpSms };
