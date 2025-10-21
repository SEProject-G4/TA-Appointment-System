const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: function () {
      return this.role === "lecturer" || this.role === "hod";
    },
    default: undefined,
  },
  googleId: {
    type: String,
    sparse: true,
    // Remove unique constraint - same person can have multiple roles
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // Remove unique constraint - we'll use compound unique index instead
  },
  profilePicture: {
    type: String,
    default: "https://www.gravatar.com/avatar?d=mp",
  },
  role: {
    type: String,
    enum: [
      "admin",
      "undergraduate",
      "postgraduate",
      "lecturer",
      "cse-office",
      "hod",
    ],
    default: "undergraduate",
    required: true,
  },
  indexNumber: {
    type: String,
    unique: true,
    sparse: true,
    required: function () {
      return this.role === "undergraduate" || this.role === "postgraduate";
    },
  },
  userGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserGroup",
    required: true,
    sparse: true,
  },
  firstLogin: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound unique index for email + role combination
// This ensures one user per role per email address
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
