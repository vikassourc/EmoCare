/**
 * @fileoverview Journal routes for EmoCare.
 * Handles CRUD operations for journal entries, AI-generated prompts,
 * and AI reflective feedback on entries.
 * @module routes/journal
 */

const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');
const { generateJournalPrompt, getJournalFeedback } = require('../utils/anthropic');

const router = express.Router();

// All journal routes require authentication
router.use(auth);

/**
 * Static fallback prompts used when the Anthropic API is unavailable.
 * Covers a range of emotional self-reflection themes.
 * @constant {string[]}
 */
const STATIC_PROMPTS = [
  "What is one emotion you've been avoiding lately, and what do you think it's trying to tell you?",
  'Describe a moment this week when you felt truly at peace. What made it possible?',
  'What belief about yourself do you wish you could let go of?',
  'If your anxiety could speak, what would it say? What would you reply?',
  "What does 'taking care of yourself' mean to you right now?",
  'Who in your life makes you feel truly seen? How do they do it?',
  'What would you tell your younger self about this phase of life?',
  'Write about a challenge you overcame. What did it teach you?',
  'What are you most proud of this week — no matter how small?',
  'What kind of person do you want to become in the next year?',
];

/**
 * @route   GET /api/journal
 * @desc    List journal entries for the authenticated user (paginated)
 * @access  Private
 *
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Entries per page
 * @returns {Object} 200 - { success, entries, pagination: { page, limit, total, pages } }
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      JournalEntry.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JournalEntry.countDocuments({ userId: req.user.id }),
    ]);

    res.status(200).json({
      success: true,
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/journal/:id
 * @desc    Get a single journal entry by ID (ownership verified)
 * @access  Private
 *
 * @param {string} req.params.id - The journal entry ID
 * @returns {Object} 200 - { success, entry }
 * @returns {Object} 404 - Entry not found or not owned by user
 */
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/journal
 * @desc    Create a new journal entry
 * @access  Private
 *
 * @param {string} req.body.text - The journal entry text (required)
 * @param {string} [req.body.mood] - User's mood at time of writing
 * @param {string} [req.body.prompt] - The prompt that inspired the entry
 * @param {number} [req.body.wordCount] - Word count of the entry
 * @returns {Object} 201 - { success, entry }
 * @returns {Object} 400 - Missing text field
 */
router.post('/', async (req, res, next) => {
  try {
    const { text, mood, prompt, wordCount } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Journal text is required.',
      });
    }

    // Calculate word count if not provided
    const computedWordCount = wordCount || text.trim().split(/\s+/).length;

    const entry = await JournalEntry.create({
      userId: req.user.id,
      text: text.trim(),
      mood,
      prompt,
      wordCount: computedWordCount,
    });

    res.status(201).json({
      success: true,
      entry,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/journal/:id
 * @desc    Update a journal entry's text and/or mood
 * @access  Private
 *
 * @param {string} req.params.id - The journal entry ID
 * @param {string} [req.body.text] - Updated journal text
 * @param {string} [req.body.mood] - Updated mood
 * @returns {Object} 200 - { success, entry }
 * @returns {Object} 404 - Entry not found or not owned by user
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { text, mood } = req.body;
    const updateFields = {};

    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Journal text cannot be empty.',
        });
      }
      updateFields.text = text.trim();
      updateFields.wordCount = text.trim().split(/\s+/).length;
    }

    if (mood !== undefined) {
      updateFields.mood = mood;
    }

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/journal/:id
 * @desc    Delete a journal entry
 * @access  Private
 *
 * @param {string} req.params.id - The journal entry ID
 * @returns {Object} 200 - { success, message }
 * @returns {Object} 404 - Entry not found or not owned by user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/journal/prompt
 * @desc    Generate an AI journaling prompt, with static fallback
 * @access  Private
 *
 * @returns {Object} 200 - { success, prompt, source: 'ai'|'static' }
 */
router.post('/prompt', async (req, res, next) => {
  try {
    const result = await generateJournalPrompt();

    if (result.success) {
      return res.status(200).json({
        success: true,
        prompt: result.data,
        source: 'ai',
      });
    }

    // Fallback to static prompts
    const randomIndex = Math.floor(Math.random() * STATIC_PROMPTS.length);
    res.status(200).json({
      success: true,
      prompt: STATIC_PROMPTS[randomIndex],
      source: 'static',
    });
  } catch (error) {
    // Even on unexpected errors, return a static prompt
    const randomIndex = Math.floor(Math.random() * STATIC_PROMPTS.length);
    res.status(200).json({
      success: true,
      prompt: STATIC_PROMPTS[randomIndex],
      source: 'static',
    });
  }
});

/**
 * @route   POST /api/journal/:id/feedback
 * @desc    Get AI reflective feedback on a journal entry and save it
 * @access  Private
 *
 * @param {string} req.params.id - The journal entry ID
 * @returns {Object} 200 - { success, entry, feedback }
 * @returns {Object} 404 - Entry not found or not owned by user
 * @returns {Object} 502 - AI service unavailable
 */
router.post('/:id/feedback', async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    const result = await getJournalFeedback(entry.text);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: 'Unable to generate feedback at this time. Please try again later.',
        error: result.error,
      });
    }

    // Save AI feedback to the entry
    entry.aiFeedback = result.data;
    await entry.save();

    res.status(200).json({
      success: true,
      entry,
      feedback: result.data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
