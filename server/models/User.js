/**
 * @fileoverview User model for EmoCare application.
 * Handles user authentication data, profile preferences,
 * password hashing, and secure JSON serialization.
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - UI theme preference ('light' or 'dark')
 * @property {boolean} notifications - Whether push notifications are enabled
 */

/**
 * @typedef {Object} User
 * @property {string} name - User's display name (2-50 characters)
 * @property {string} email - User's email address (unique, lowercase)
 * @property {string} password - Hashed password (min 6 characters raw)
 * @property {string} avatar - Emoji avatar for the user profile
 * @property {UserPreferences} preferences - User UI/notification preferences
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    avatar: {
      type: String,
      default: '💚',
    },
    preferences: {
      theme: {
        type: String,
        enum: {
          values: ['light', 'dark'],
          message: 'Theme must be either light or dark',
        },
        default: 'light',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
    trustedContacts: [
      {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash the password before persisting.
 * Only hashes if the password field has been modified (new or changed).
 * Uses bcrypt with 10 salt rounds.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a candidate password against the stored hashed password.
 *
 * @param {string} candidatePassword - The plaintext password to verify
 * @returns {Promise<boolean>} True if the password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Custom toJSON method that strips the password field from
 * serialized output for security. Also removes __v.
 *
 * @returns {Object} User object without sensitive fields
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
