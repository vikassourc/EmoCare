/**
 * @fileoverview Dashboard routes for EmoCare.
 * Provides computed statistics, mood charts, trigger analysis,
 * personalized recommendations, and AI-generated wellness analysis.
 * @module routes/dashboard
 */

const express = require('express');
const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const JournalEntry = require('../models/JournalEntry');
const MoodEntry = require('../models/MoodEntry');
const auth = require('../middleware/auth');
const { generateDashboardAnalysis } = require('../utils/anthropic');

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

/**
 * Get the start of a given date (midnight UTC).
 *
 * @param {Date} date - The input date
 * @returns {Date} The date set to midnight UTC
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the day name abbreviation (Mon, Tue, etc.) for a date.
 *
 * @param {Date} date - The input date
 * @returns {string} Three-letter day abbreviation
 */
const getDayName = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getUTCDay()];
};

/**
 * Format a date as YYYY-MM-DD.
 *
 * @param {Date} date - The input date
 * @returns {string} ISO date string (date portion only)
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get computed dashboard statistics for the authenticated user
 * @access  Private
 *
 * Returns:
 * - sessionsThisWeek: Chat sessions created in the last 7 days
 * - avgMoodScore: Average mood score from the last 7 days (or 0)
 * - dayStreak: Consecutive days (from today backwards) with at least 1 MoodEntry
 * - journalEntries: Journal entries created this month
 * - totalSessions: Total number of chat sessions
 *
 * @returns {Object} 200 - { success, stats }
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run queries in parallel
    const [sessionsThisWeek, avgMoodResult, journalEntries, totalSessions, moodDates] =
      await Promise.all([
        // Sessions created in the last 7 days
        ChatSession.countDocuments({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        }),

        // Average mood score last 7 days
        MoodEntry.aggregate([
          {
            $match: {
              userId: userObjectId,
              createdAt: { $gte: sevenDaysAgo },
              score: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]),

        // Journal entries this month
        JournalEntry.countDocuments({
          userId,
          createdAt: { $gte: startOfMonth },
        }),

        // Total sessions
        ChatSession.countDocuments({ userId }),

        // Get all distinct dates with mood entries (for streak calculation)
        MoodEntry.aggregate([
          { $match: { userId: userObjectId } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        ]),
      ]);

    // Calculate day streak
    let dayStreak = 0;
    if (moodDates.length > 0) {
      const today = startOfDay(now);

      for (let i = 0; i < moodDates.length; i++) {
        const { year, month, day } = moodDates[i]._id;
        const entryDate = startOfDay(new Date(Date.UTC(year, month - 1, day)));
        const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);

        if (entryDate.getTime() === startOfDay(expectedDate).getTime()) {
          dayStreak++;
        } else {
          break;
        }
      }
    }

    const avgMoodScore =
      avgMoodResult.length > 0 ? Math.round(avgMoodResult[0].avg * 10) / 10 : 0;

    res.status(200).json({
      success: true,
      stats: {
        sessionsThisWeek,
        avgMoodScore,
        dayStreak,
        journalEntries,
        totalSessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/mood-chart
 * @desc    Get mood data for the last 7 days for charting
 * @access  Private
 *
 * Returns an array of 7 objects (one per day), each containing:
 * - day: Day name abbreviation (Mon, Tue, etc.)
 * - date: ISO date string (YYYY-MM-DD)
 * - avgScore: Average mood score for that day (0 if no entries)
 *
 * @returns {Object} 200 - { success, chartData }
 */
router.get('/mood-chart', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

    // Get daily averages from the database
    const dailyMoods = await MoodEntry.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sevenDaysAgo },
          score: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    // Build a lookup map for quick access
    const moodMap = {};
    dailyMoods.forEach((entry) => {
      const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(entry._id.day).padStart(2, '0')}`;
      moodMap[key] = Math.round(entry.avgScore * 10) / 10;
    });

    // Generate the last 7 days, filling in missing days with 0
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = formatDate(date);
      chartData.push({
        day: getDayName(date),
        date: dateKey,
        avgScore: moodMap[dateKey] || 0,
      });
    }

    res.status(200).json({
      success: true,
      chartData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/triggers
 * @desc    Aggregate mood triggers/causes from the last 30 days
 * @access  Private
 *
 * Returns the top 5 causes with their percentage of total occurrences.
 *
 * @returns {Object} 200 - { success, triggers: [{ cause, count, percentage }] }
 */
router.get('/triggers', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const causesAgg = await MoodEntry.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: thirtyDaysAgo },
          causes: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$causes' },
      { $group: { _id: '$causes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Calculate total for percentage
    const total = causesAgg.reduce((sum, c) => sum + c.count, 0);

    const triggers = causesAgg.map((c) => ({
      cause: c._id,
      count: c.count,
      percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      triggers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/recommendations
 * @desc    Get personalized recommendations based on recent mood trends
 * @access  Private
 *
 * Categorizes recommendations into three tiers:
 * - Negative moods (avg < 4): Stress-relief focused
 * - Mixed moods (avg 4-6): Maintenance & stability focused
 * - Positive moods (avg > 6): Growth & flourishing focused
 *
 * @returns {Object} 200 - { success, category, recommendations, avgScore }
 */
router.get('/recommendations', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const avgResult = await MoodEntry.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sevenDaysAgo },
          score: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]);

    const avgScore = avgResult.length > 0 ? avgResult[0].avg : 5;

    let category, recommendations;

    if (avgScore < 4) {
      // Stress-relief focused recommendations
      category = 'stress-relief';
      recommendations = [
        {
          title: '🧘 Guided Breathing',
          description:
            'Try a 4-7-8 breathing exercise: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3-4 times.',
        },
        {
          title: '🚶 Mindful Walk',
          description:
            'Take a 10-minute walk without your phone. Focus on what you see, hear, and feel around you.',
        },
        {
          title: '📝 Emotion Journaling',
          description:
            "Write freely for 5 minutes about what's weighing on you. Don't edit — just let it flow.",
        },
        {
          title: '🤝 Reach Out',
          description:
            "Text or call someone you trust. You don't have to explain everything — just connect.",
        },
        {
          title: '😴 Rest Priority',
          description:
            'Tonight, set a firm bedtime 30 minutes earlier than usual. Quality sleep is foundational to emotional recovery.',
        },
      ];
    } else if (avgScore <= 6) {
      // Maintenance focused recommendations
      category = 'maintenance';
      recommendations = [
        {
          title: '🎯 Small Wins',
          description:
            "Pick one small task you've been putting off and complete it today. The sense of accomplishment compounds.",
        },
        {
          title: '🌿 Nature Break',
          description:
            'Spend 15 minutes outdoors — in a park, balcony, or garden. Natural light and greenery stabilize mood.',
        },
        {
          title: '🎵 Music Therapy',
          description:
            "Create a playlist of songs that make you feel calm and energized. Play it during your morning routine.",
        },
        {
          title: '📊 Pattern Tracking',
          description:
            'Review your mood patterns this week. Notice what times of day or activities correlate with better moods.',
        },
        {
          title: '💬 Daily Check-in',
          description:
            'Chat with EmoCare AI each evening for 5 minutes. Consistent reflection builds emotional awareness.',
        },
      ];
    } else {
      // Growth focused recommendations
      category = 'growth';
      recommendations = [
        {
          title: '🌟 Gratitude Practice',
          description:
            "You're in a great space! Write down 3 things you're grateful for each morning to reinforce positive momentum.",
        },
        {
          title: '📚 Learn Something New',
          description:
            'Channel your positive energy into learning a new skill or hobby. Growth thrives when we feel good.',
        },
        {
          title: '🤗 Pay It Forward',
          description:
            'Help someone else today — a friend, colleague, or stranger. Kindness amplifies our own happiness.',
        },
        {
          title: '🎯 Set a Stretch Goal',
          description:
            "Challenge yourself with a meaningful goal for this month. You have the emotional bandwidth to aim higher.",
        },
        {
          title: '📖 Deep Reflection',
          description:
            "Write a journal entry about what's been going well and why. Understanding your strengths helps sustain them.",
        },
      ];
    }

    res.status(200).json({
      success: true,
      category,
      recommendations,
      avgScore: Math.round(avgScore * 10) / 10,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/dashboard/analysis
 * @desc    Generate a personalized AI analysis of the user's wellness data
 * @access  Private
 *
 * Compiles recent moods, journal counts, triggers, and mood trends,
 * then sends to Anthropic for personalized analysis.
 *
 * @returns {Object} 200 - { success, analysis }
 * @returns {Object} 502 - AI service unavailable
 */
router.post('/analysis', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Gather user data in parallel
    const [recentMoods, journalCount, causesAgg, avgScoreResult, emotionCounts] =
      await Promise.all([
        // Recent mood entries
        MoodEntry.find({
          userId: req.user.id,
          createdAt: { $gte: sevenDaysAgo },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        // Journal entry count
        JournalEntry.countDocuments({ userId: req.user.id }),

        // Top triggers last 30 days
        MoodEntry.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: thirtyDaysAgo },
              causes: { $exists: true, $ne: [] },
            },
          },
          { $unwind: '$causes' },
          { $group: { _id: '$causes', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),

        // Average score trend
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

        // Emotion frequency
        MoodEntry.aggregate([
          { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: '$emotion', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    // Compile the summary
    const avgScore =
      avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg * 10) / 10 : 'N/A';
    const topTriggers = causesAgg.map((c) => c._id).join(', ') || 'None identified';
    const topEmotions = emotionCounts.map((e) => `${e._id} (${e.count}x)`).join(', ') || 'None logged';
    const recentMoodsList =
      recentMoods
        .map((m) => `${m.emotion} (score: ${m.score || 'N/A'}, intensity: ${m.intensity || 'N/A'})`)
        .join('; ') || 'No recent entries';

    const userDataSummary = `
Recent Mood Entries (last 7 days): ${recentMoodsList}
Average Mood Score (7 days): ${avgScore}/10
Total Journal Entries: ${journalCount}
Top Emotional Triggers (30 days): ${topTriggers}
Most Frequent Emotions (30 days): ${topEmotions}
Number of Recent Mood Entries: ${recentMoods.length}
    `.trim();

    const result = await generateDashboardAnalysis(userDataSummary);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: 'Unable to generate analysis at this time. Please try again later.',
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      analysis: result.data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
