require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const homeRoutes = require("./routes/home");
const movieRoutes = require("./routes/movie");
const aiChatRoute = require("./routes/aiChat");

const app = express();

/* ============================
   BODY PARSER
============================ */
app.use(express.json());

/* ============================
   CORS (HOSTINGER + CUSTOM DOMAIN SAFE)
============================ */
const allowedOrigins = [
  "http://localhost:3000",
  "https://raatkibaat.in",
  "https://www.raatkibaat.in",
  "https://horizons.hostinger.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for: " + origin), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

app.options("*", cors());

/* ============================
   RATE LIMIT (AI CHAT PROTECTION)
============================ */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    data: {
      reply: "Too many requests. Please wait a minute 🍿"
    }
  }
});

app.use("/api/ai", chatLimiter);

/* ============================
   ROUTES (MATCH FRONTEND HANDOVER)
============================ */
app.use("/api", homeRoutes);         // /api/trending etc
app.use("/api", movieRoutes);        // /api/movie/:id , /api/search
app.use("/api/ai", aiChatRoute);     // /api/ai/chat

/* ============================
   HEALTH CHECK
============================ */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    api: "online",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send("🎬 Filmi Bharat Backend v3 Running");
});

/* ============================
   DATABASE + SERVER START
============================ */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));
