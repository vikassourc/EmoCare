/**
 * @fileoverview JournalEntry model for EmoCare application.
 * Stores user journal entries with optional AI-generated prompts
 * and reflective feedback.
 * @module models/JournalEntry
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} JournalEntry
 * @property {mongoose.Types.ObjectId} userId - Reference to the owning User
 * @property {string} text - The journal entry content
 * @property {string} [mood] - User's mood at time of writing
 * @property {string} [prompt] - AI-generated prompt that inspired the entry
 * @property {string} [aiFeedback] - AI-generated reflective feedback on the entry
 * @property {number} [wordCount] - Word count of the entry text
 * @property {Date} createdAt - Entry creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Journal text is required'],
    },
    mood: {
      type: String,
    },
    prompt: {
      type: String,
    },
    aiFeedback: {
      type: String,
    },
    wordCount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
