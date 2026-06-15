/**
 * @fileoverview MoodEntry model for EmoCare application.
 * Tracks user emotional states over time with intensity scoring,
 * identified causes, and AI-generated recommendations.
 * @module models/MoodEntry
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} MoodEntry
 * @property {mongoose.Types.ObjectId} userId - Reference to the owning User
 * @property {string} emotion - Primary emotion being tracked
 * @property {string} intensity - Intensity level ('low', 'medium', or 'high')
 * @property {number} score - Numeric mood score from 1 (worst) to 10 (best)
 * @property {string[]} causes - Identified causes or triggers for the mood
 * @property {string[]} recommendations - Suggested coping strategies
 * @property {string} [reflectionQuestion] - AI-generated reflection prompt
 * @property {string} source - Origin of the mood entry ('chat', 'manual', or 'journal')
 * @property {Date} createdAt - Entry creation timestamp
 */
const moodEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  emotion: {
    type: String,
    required: [true, 'Emotion is required'],
  },
  intensity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Intensity must be low, medium, or high',
    },
  },
  score: {
    type: Number,
    min: [1, 'Score must be at least 1'],
    max: [10, 'Score cannot exceed 10'],
  },
  causes: [
    {
      type: String,
    },
  ],
  recommendations: [
    {
      type: String,
    },
  ],
  reflectionQuestion: {
    type: String,
  },
  source: {
    type: String,
    enum: {
      values: ['chat', 'manual', 'journal'],
      message: 'Source must be chat, manual, or journal',
    },
    default: 'manual',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
