const mongoose = require("mongoose");

const userGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  groupType: {
    type: String,
    enum: [
      "undergraduate",
      "postgraduate",
      "lecturer",
      "hod",
      "cse-office",
      "admin",
    ],
    required: true,
  },
  userCount: { type: Number, default: 0 },
});

userGroupSchema.index({ name: 1, groupType: 1 }, { unique: true });

const UserGroup = mongoose.model("UserGroup", userGroupSchema);

module.exports = UserGroup;
