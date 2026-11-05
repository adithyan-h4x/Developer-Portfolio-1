const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ["Project", "Skill", "Academic", "Certification"] 
  },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "", trim: true },
  date: { type: String, default: "", trim: true },
  link: { type: String, default: "", trim: true },
  description: { type: String, required: true, trim: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PortfolioItem", portfolioItemSchema);
