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
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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

module.exports = mongoose.model("User", userSchema);
