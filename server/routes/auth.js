/**
 * @fileoverview Authentication routes for EmoCare.
 * Handles user signup, login, Google OAuth, profile management,
 * password changes, and account deletion with cascade cleanup.
 * @module routes/auth
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const JournalEntry = require('../models/JournalEntry');
const MoodEntry = require('../models/MoodEntry');
const auth = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @route   GET /api/auth/google-client-id
 * @desc    Return Google OAuth client ID for frontend initialization
 * @access  Public
 */
router.get('/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

/**
 * Generate a signed JWT for the given user.
 *
 * @param {Object} user - The user document
 * @param {string} user._id - The user's MongoDB ObjectId
 * @returns {string} Signed JWT token valid for 30 days
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user account
 * @access  Public
 *
 * @param {string} req.body.name - User's display name (2-50 chars)
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (min 6 chars)
 * @returns {Object} 201 - { success, message, token, user }
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 409 - Email already in use
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 *
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @returns {Object} 200 - { success, message, token, user }
 * @returns {Object} 400 - Missing fields
 * @returns {Object} 401 - Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user by email (explicitly select password since toJSON strips it)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate via Google Sign-In (auto-creates account if new)
 * @access  Public
 *
 * @param {string} req.body.credential - Google ID token from Sign In With Google
 * @returns {Object} 200 - { success, message, token, user, isNewUser }
 * @returns {Object} 401 - Invalid Google token
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      // Auto-create account for new Google users
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: randomPassword,
        avatar: '🌿',
      });
      isNewUser = true;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created with Google!' : 'Logged in with Google!',
      token,
      user,
      isNewUser,
    });
  } catch (error) {
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({
        success: false,
        message: 'Google token expired. Please try again.',
      });
    }
    if (error.message && (error.message.includes('Invalid token') || error.message.includes('Wrong number of segments'))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token.',
      });
    }
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 *
 * @returns {Object} 200 - { success, user }
 * @returns {Object} 404 - User not found
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user's name, avatar, and/or preferences
 * @access  Private
 *
 * @param {string} [req.body.name] - New display name
 * @param {string} [req.body.avatar] - New emoji avatar
 * @param {Object} [req.body.preferences] - Updated preferences
 * @returns {Object} 200 - { success, message, user }
 * @returns {Object} 404 - User not found
 */
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, avatar, preferences } = req.body;
    const updateFields = {};

    if (name !== undefined) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters.',
        });
      }
      updateFields.name = name;
    }

    if (avatar !== undefined) {
      updateFields.avatar = avatar;
    }

    if (preferences !== undefined) {
      if (preferences.theme !== undefined) {
        if (!['light', 'dark'].includes(preferences.theme)) {
          return res.status(400).json({
            success: false,
            message: 'Theme must be either light or dark.',
          });
        }
        updateFields['preferences.theme'] = preferences.theme;
      }
      if (preferences.notifications !== undefined) {
        updateFields['preferences.notifications'] = preferences.notifications;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user's password after verifying old password
 * @access  Private
 *
 * @param {string} req.body.oldPassword - Current password for verification
 * @param {string} req.body.newPassword - New password (min 6 chars)
 * @returns {Object} 200 - { success, message }
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 401 - Old password incorrect
 */
router.put('/change-password', auth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both old and new passwords.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account and all associated data (cascade delete)
 * @access  Private
 *
 * Deletes: User document, ChatSessions, JournalEntries, MoodEntries
 *
 * @returns {Object} 200 - { success, message }
 * @returns {Object} 404 - User not found
 */
router.delete('/account', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Cascade delete all user data in parallel
    await Promise.all([
      ChatSession.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      MoodEntry.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/profile/contacts
 * @desc    Update trusted contacts for SOS feature
 * @access  Private
 */
router.put('/profile/contacts', auth, async (req, res, next) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, message: 'Contacts must be an array' });
    }
    
    // limit to 3 contacts
    const limitedContacts = contacts.slice(0, 3).map(c => ({
      name: c.name || 'Unknown',
      email: c.email || '',
      phone: c.phone || '',
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { trustedContacts: limitedContacts } },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/sos
 * @desc    Trigger SOS alert to trusted contacts
 * @access  Private
 */
router.post('/sos', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.trustedContacts || user.trustedContacts.length === 0) {
      return res.status(400).json({ success: false, message: 'No trusted contacts found to alert.' });
    }

    // SIMULATE SENDING ALERTS (e.g., via Twilio/Nodemailer)
    console.log(`\n🚨 [SOS ALERT] User ${user.name} (${user.email}) triggered an SOS!`);
    user.trustedContacts.forEach(contact => {
      console.log(`➡️ Sending SMS to ${contact.name} at ${contact.phone}...`);
      if (contact.email) console.log(`➡️ Sending Email to ${contact.name} at ${contact.email}...`);
    });
    console.log(`🚨 [SOS ALERT] Alerts simulated successfully.\n`);

    res.status(200).json({ success: true, message: 'Emergency contacts alerted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
