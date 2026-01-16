require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Routes
const homeRoutes = require("./routes/home");
const movieRoutes = require("./routes/movie");
const aiChatRoute = require("./routes/aiChat");

const app = express();

/* ============================
   BODY PARSER
============================ */
app.use(express.json());

/* ============================
   CORS (ONLY YOUR FRONTEND DOMAIN)
============================ */
const allowedOrigins = [
  "https://raatkibaat.in",
  "https://www.raatkibaat.in"
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
  max: 12,
  message: {
    success: false,
    data: {
      reply: "Too many requests. Please wait a minute 🍿"
    }
  }
});

// Apply limiter only to AI route
app.use("/api/ai", chatLimiter);

/* ============================
   ROUTES (MATCH FRONTEND DOC)
============================ */
app.use("/api", homeRoutes);
app.use("/api", movieRoutes);
app.use("/api/ai", aiChatRoute);

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

/* ============================
   ROOT
============================ */
app.get("/", (req, res) => {
  res.send("🎬 Filmi Bharat Backend v3 Running");
});

/* ============================
   DB CONNECT + SERVER START
============================ */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));
