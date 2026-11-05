const express = require("express");
const router = express.Router();
const PortfolioItem = require("../models/PortfolioItem");
const Inquiry = require("../models/Inquiry");
const User = require("../models/User");

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Get portfolio items (for logged in user, or default demo student)
router.get("/items", async (req, res) => {
  try {
    let targetUserId = req.session && req.session.userId;
    if (!targetUserId) {
      // Find first user as default public portfolio view
      const firstUser = await User.findOne();
      if (firstUser) targetUserId = firstUser._id;
    }

    if (!targetUserId) {
      return res.json({ items: [] });
    }

    const items = await PortfolioItem.find({ user: targetUserId }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items: " + err.message });
  }
});

// Create a portfolio item
router.post("/items", requireAuth, async (req, res) => {
  try {
    const { category, title, subtitle, date, link, description, featured } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ error: "Category, title, and description are required" });
    }

    const validCategories = ["Project", "Skill", "Academic", "Certification"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category selected" });
    }

    const item = new PortfolioItem({
      user: req.session.userId,
      category,
      title: title.trim(),
      subtitle: (subtitle && subtitle.trim()) || "",
      date: (date && date.trim()) || "",
      link: (link && link.trim()) || "",
      description: description.trim(),
      featured: Boolean(featured)
    });

    await item.save();
    res.status(201).json({ message: "Portfolio record created successfully", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create item: " + err.message });
  }
});

// Update an existing portfolio item
router.put("/items/:id", requireAuth, async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (item.user.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { category, title, subtitle, date, link, description, featured } = req.body;
    if (category) item.category = category;
    if (title) item.title = title.trim();
    if (subtitle !== undefined) item.subtitle = subtitle.trim();
    if (date !== undefined) item.date = date.trim();
    if (link !== undefined) item.link = link.trim();
    if (description) item.description = description.trim();
    if (featured !== undefined) item.featured = Boolean(featured);

    await item.save();
    res.json({ message: "Portfolio record updated successfully", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item: " + err.message });
  }
});

// Delete a portfolio item
router.delete("/items/:id", requireAuth, async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (item.user.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    await PortfolioItem.deleteOne({ _id: req.params.id });
    res.json({ message: "Portfolio record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item: " + err.message });
  }
});

// Submit a visitor inquiry (New Feature)
router.post("/inquiry", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All inquiry fields are required" });
    }

    const inquiry = new Inquiry({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    await inquiry.save();
    res.status(201).json({ message: "Your message has been sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit inquiry: " + err.message });
  }
});

// Get all visitor inquiries (Management Console)
router.get("/inquiries", requireAuth, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ date: -1 });
    res.json({ inquiries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inquiries: " + err.message });
  }
});

module.exports = router;
