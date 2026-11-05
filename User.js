const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rollNo: { type: String, default: "26CSMM01", trim: true },
  course: { type: String, default: "B.Sc. Computer Science and Mathematics", trim: true },
  institution: { type: String, default: "Kristu Jayanti (Deemed to be University)", trim: true },
  bio: { type: String, default: "Undergraduate Computer Science & Mathematics student specializing in web engineering and distributed systems." },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
