const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Register a new student account
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, rollNo, course, institution } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      rollNo: (rollNo && rollNo.trim()) || "26CSM99",
      course: (course && course.trim()) || "B.Sc. Computer Science and Mathematics",
      institution: (institution && institution.trim()) || "Kristu Jayanti (Deemed to be University)"
    });

    await user.save();
    req.session.userId = user._id;

    res.status(201).json({
      message: "Account registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        course: user.course,
        institution: user.institution,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server registration failed: " + err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    req.session.userId = user._id;
    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        course: user.course,
        institution: user.institution,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        course: user.course,
        institution: user.institution,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update personal profile
router.put("/profile", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, rollNo, course, institution, email, bio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email cannot be empty" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    if (rollNo !== undefined) user.rollNo = rollNo.trim();
    if (course !== undefined) user.course = course.trim();
    if (institution !== undefined) user.institution = institution.trim();
    if (bio !== undefined) user.bio = bio.trim();

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        course: user.course,
        institution: user.institution,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile: " + err.message });
  }
});

module.exports = router;
