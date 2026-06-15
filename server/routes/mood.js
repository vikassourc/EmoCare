/**
 * @fileoverview Mood tracking routes for EmoCare.
 * Handles creation and retrieval of mood entries with date filtering
 * and aggregated statistics including averages, trends, and common triggers.
 * @module routes/mood
 */

const express = require('express');
const mongoose = require('mongoose');
const MoodEntry = require('../models/MoodEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// All mood routes require authentication
router.use(auth);

/**
 * @route   GET /api/mood
 * @desc    List mood entries for the authenticated user with optional date filtering
 * @access  Private
 *
 * @param {string} [req.query.from] - Start date filter (ISO 8601 string)
 * @param {string} [req.query.to] - End date filter (ISO 8601 string)
 * @returns {Object} 200 - { success, entries, count }
 */
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { userId: req.user.id };

    // Apply date range filter if provided
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          filter.createdAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          filter.createdAt.$lte = toDate;
        }
      }
      // Remove empty createdAt filter
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const entries = await MoodEntry.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      entries,
      count: entries.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/mood
 * @desc    Create a new mood entry
 * @access  Private
 *
 * @param {string} req.body.emotion - Primary emotion (required)
 * @param {string} [req.body.intensity] - Intensity level: low, medium, high
 * @param {number} [req.body.score] - Numeric mood score (1-10)
 * @param {string[]} [req.body.causes] - Array of identified causes/triggers
 * @param {string} [req.body.source] - Source of entry: chat, manual, journal
 * @returns {Object} 201 - { success, entry }
 * @returns {Object} 400 - Missing emotion field
 */
router.post('/', async (req, res, next) => {
  try {
    const { emotion, intensity, score, causes, source } = req.body;

    if (!emotion || !emotion.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Emotion is required.',
      });
    }

    const entry = await MoodEntry.create({
      userId: req.user.id,
      emotion: emotion.trim(),
      intensity,
      score,
      causes: causes || [],
      source: source || 'manual',
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
 * @route   GET /api/mood/stats
 * @desc    Get aggregated mood statistics for the authenticated user
 * @access  Private
 *
 * Returns:
 * - avgScore7Days: Average mood score over the last 7 days
 * - avgScore30Days: Average mood score over the last 30 days
 * - totalEntries: Total number of mood entries
 * - mostCommonEmotion: The most frequently logged emotion
 * - topCauses: Top 5 most common causes/triggers
 *
 * @returns {Object} 200 - { success, stats }
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel for performance
    const [avgScore7Result, avgScore30Result, totalEntries, emotionAgg, causesAgg] =
      await Promise.all([
        // Average score last 7 days
        MoodEntry.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: sevenDaysAgo },
              score: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]),

        // Average score last 30 days
        MoodEntry.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: thirtyDaysAgo },
              score: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]),

        // Total entries
        MoodEntry.countDocuments({ userId: req.user.id }),

        // Most common emotion
        MoodEntry.aggregate([
          { $match: { userId } },
          { $group: { _id: '$emotion', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),

        // Top 5 causes
        MoodEntry.aggregate([
          { $match: { userId, causes: { $exists: true, $ne: [] } } },
          { $unwind: '$causes' },
          { $group: { _id: '$causes', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const stats = {
      avgScore7Days: avgScore7Result.length > 0 ? Math.round(avgScore7Result[0].avg * 10) / 10 : 0,
      avgScore30Days:
        avgScore30Result.length > 0 ? Math.round(avgScore30Result[0].avg * 10) / 10 : 0,
      totalEntries,
      mostCommonEmotion: emotionAgg.length > 0 ? emotionAgg[0]._id : null,
      topCauses: causesAgg.map((c) => ({ cause: c._id, count: c.count })),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
