/**
 * @fileoverview ChatSession model for EmoCare application.
 * Stores conversation sessions between users and EmoCare AI,
 * including message history with optional emotional insight metadata.
 * @module models/ChatSession
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} EmotionalInsight
 * @property {string} emotion - Primary emotion detected in the message
 * @property {string} intensity - Emotion intensity level (low/medium/high)
 * @property {string[]} causes - Possible causes identified by the AI
 * @property {string[]} recommendations - Suggested actions or coping strategies
 * @property {string} reflectionQuestion - A deep question for journaling
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} role - Message sender role ('user' or 'assistant')
 * @property {string} content - The message text content
 * @property {EmotionalInsight} [insight] - Optional emotional insight parsed from AI response
 * @property {Date} timestamp - When the message was sent
 */

/**
 * Sub-schema for individual chat messages within a session.
 */
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: {
        values: ['user', 'assistant'],
        message: 'Role must be either user or assistant',
      },
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    insight: {
      emotion: { type: String },
      intensity: { type: String },
      causes: [{ type: String }],
      recommendations: [{ type: String }],
      reflectionQuestion: { type: String },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/**
 * @typedef {Object} ChatSession
 * @property {mongoose.Types.ObjectId} userId - Reference to the owning User
 * @property {string} title - Session title (auto-generated or user-set)
 * @property {ChatMessage[]} messages - Ordered array of chat messages
 * @property {string} mood - Overall mood detected during the session
 * @property {boolean} isActive - Whether the session is still active
 * @property {Date} createdAt - Session creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New session',
    },
    messages: [messageSchema],
    mood: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
