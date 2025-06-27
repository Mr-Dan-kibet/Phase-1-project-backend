const moment = require("moment");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
// Enable JSON request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database helper functions
const readDB = () => {
  const dbPath = path.join(__dirname, "db.json");
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const writeDB = (data) => {
  const dbPath = path.join(__dirname, "db.json");
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// ✅ Route to get M-Pesa Access Token
app.get("/mpesa/token", async (req, res) => {
  try {
    const auth = Buffer.from(
      `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    res.json({
      success: true,
      access_token: response.data.access_token,
    });
  } catch (error) {
    console.error("❌ Token Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Failed to generate token",
      details: error.response?.data || error.message,
    });
  }
});

// ✅ STK Push Endpoint
app.post("/mpesa/stk", async (req, res) => {
  try {
    // Validate input
    const { phone, amount } = req.body;
    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        error: "Phone number and amount are required",
      });
    }

    // Get access token
    const tokenRes = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    // Prepare STK request
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(
      `${process.env.BUSINESS_SHORTCODE}${process.env.PASSKEY}${timestamp}`
    ).toString("base64");

    const stkData = {
      BusinessShortCode: process.env.BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "Luxury Rides",
      TransactionDesc: "Payment for booking",
    };

    // Send STK request
    const stkRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkData,
      { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }
    );

    res.json({
      success: true,
      message: "STK push initiated successfully",
      checkoutRequestID: stkRes.data.CheckoutRequestID,
      merchantRequestID: stkRes.data.MerchantRequestID,
      response: stkRes.data,
    });
  } catch (error) {
    console.error("❌ STK Push Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "STK push failed",
      details: error.response?.data || error.message,
    });
  }
});

// ✅ Callback Handler
app.post("/mpesa/callback", (req, res) => {
  try {
    console.log("📥 Received callback:", JSON.stringify(req.body, null, 2));

    const callback = req.body.Body?.stkCallback;
    if (!callback) {
      console.log("❌ Invalid callback format");
      return res
        .status(400)
        .json({ success: false, error: "Invalid callback format" });
    }

    if (callback.ResultCode !== 0) {
      console.log(`❌ Payment failed: ${callback.ResultDesc}`);
      return res
        .status(200)
        .json({ success: false, error: callback.ResultDesc });
    }

    // Extract payment details
    const metadata = callback.CallbackMetadata?.Item || [];
    const getMetadata = (name) =>
      metadata.find((item) => item.Name === name)?.Value;

    const receipt = getMetadata("MpesaReceiptNumber");
    const phone = getMetadata("PhoneNumber");
    const amount = getMetadata("Amount");

    if (!receipt || !phone) {
      console.log("❌ Missing critical callback data");
      return res
        .status(400)
        .json({ success: false, error: "Incomplete callback data" });
    }

    // Update database
    const db = readDB();
    const booking = db.bookings
      .filter((b) => b.phoneNumber === phone.toString())
      .sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate))[0];

    if (booking) {
      booking.paymentStatus = "Completed";
      booking.mpesaCode = receipt;
      writeDB(db);
      console.log(`✅ Updated booking for ${phone} with receipt ${receipt}`);
    } else {
      console.log(`❌ No booking found for phone: ${phone}`);
    }

    res.json({ ResponseCode: "00000000", ResponseDesc: "Success" });
  } catch (error) {
    console.error("❌ Callback Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Callback processing failed" });
  }
});

// ✅ Payment Status Endpoint
app.get("/mpesa/status/:phone", (req, res) => {
  try {
    const db = readDB();
    const bookings = db.bookings
      .filter((b) => b.phoneNumber === req.params.phone)
      .sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("❌ Status Check Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check payment status",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `🔔 Callback URL: ${process.env.CALLBACK_URL || "Not configured!"}`
  );
});
