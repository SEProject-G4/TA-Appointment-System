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

// Pre-save validation hook to enforce custom uniqueness rules
userSchema.pre('save', async function(next) {
  // Skip validation if email hasn't changed
  if (!this.isModified('email') && !this.isModified('role')) {
    return next();
  }

  try {
    // Find existing users with the same email
    const existingUsers = await mongoose.model('User').find({
      email: this.email,
      _id: { $ne: this._id } // Exclude current document
    });

    if (existingUsers.length === 0) {
      // No existing users with this email, allow creation
      return next();
    }

    // Check if any existing user has the same role
    const sameRoleExists = existingUsers.some(user => user.role === this.role);
    if (sameRoleExists) {
      const error = new Error(`User with email ${this.email} and role ${this.role} already exists`);
      error.code = 11000; // Duplicate key error code
      return next(error);
    }

    // Get the roles involved
    const existingRoles = existingUsers.map(u => u.role);
    const allRoles = [...existingRoles, this.role];

    // Check if this is an admin user trying to also be a lecturer (or vice versa)
    const hasAdmin = allRoles.includes('admin');
    const hasLecturer = allRoles.includes('lecturer');
    const onlyAdminAndLecturer = allRoles.every(r => r === 'admin' || r === 'lecturer');

    // Allow admin to also have a lecturer account and vice versa
    if (hasAdmin && hasLecturer && onlyAdminAndLecturer && allRoles.length === 2) {
      return next();
    }

    // Otherwise, email must be unique
    const error = new Error(`Email ${this.email} is already in use by another user`);
    error.code = 11000;
    return next(error);

  } catch (error) {
    return next(error);
  }
});

// Create a compound unique index on email and role
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
