const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio_dark_db";
const SESSION_SECRET = process.env.SESSION_SECRET || "devfolio_dark_secret_session_key_2026";

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB database successfully"))
  .catch((err) => console.error("Database connection error:", err.message));

// Session setup with MongoStore (autoRemove disabled for FerretDB compatibility)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      autoRemove: "disabled"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// Route guard for manager dashboard
app.get("/manager.html", (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect("/auth.html");
  }
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/portfolio", require("./routes/portfolio"));

// Fallback to home page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Student Portfolio (Dark Standard) server running on http://localhost:${PORT}`);
});
