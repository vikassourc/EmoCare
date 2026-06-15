/**
 * @fileoverview Chat routes for EmoCare.
 * Handles AI-powered conversation sessions, message sending with insight parsing,
 * session CRUD operations, and automatic mood entry creation from detected insights.
 * @module routes/chat
 */

const express = require('express');
const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const MoodEntry = require('../models/MoodEntry');
const auth = require('../middleware/auth');
const { sendChatMessage, SYSTEM_PROMPT } = require('../utils/anthropic');

const router = express.Router();

// All chat routes require authentication
router.use(auth);

/**
 * Parse the INSIGHT block from the AI's response text.
 * Extracts emotion, intensity, causes, recommendations, and reflection question.
 *
 * @param {string} responseText - The full AI response text
 * @returns {{insight: Object|null, cleanResponse: string}} Parsed insight object and response without the insight block
 */
const parseInsight = (responseText) => {
  const insightRegex = /INSIGHT_START\s*([\s\S]*?)\s*INSIGHT_END/;
  const match = responseText.match(insightRegex);

  if (!match) {
    return { insight: null, cleanResponse: responseText.trim() };
  }

  const insightBlock = match[1];
  const cleanResponse = responseText.replace(insightRegex, '').trim();

  const insight = {
    emotion: '',
    intensity: '',
    causes: [],
    recommendations: [],
    reflectionQuestion: '',
  };

  // Parse each field from the insight block
  const emotionMatch = insightBlock.match(/emotion:\s*(.+)/i);
  if (emotionMatch) insight.emotion = emotionMatch[1].trim();

  const intensityMatch = insightBlock.match(/intensity:\s*(.+)/i);
  if (intensityMatch) insight.intensity = intensityMatch[1].trim().toLowerCase();

  const causesMatch = insightBlock.match(/possible_causes:\s*(.+)/i);
  if (causesMatch) {
    insight.causes = causesMatch[1]
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  const recsMatch = insightBlock.match(/recommendations:\s*(.+)/i);
  if (recsMatch) {
    insight.recommendations = recsMatch[1]
      .split('|')
      .map((r) => r.trim())
      .filter(Boolean);
  }

  const reflectionMatch = insightBlock.match(/reflection_question:\s*(.+)/i);
  if (reflectionMatch) insight.reflectionQuestion = reflectionMatch[1].trim();

  return { insight, cleanResponse };
};

/**
 * Map emotion strings to approximate numeric mood scores.
 *
 * @param {string} emotion - The detected emotion string
 * @param {string} intensity - The intensity level (low/medium/high)
 * @returns {number} A mood score from 1 to 10
 */
const emotionToScore = (emotion, intensity) => {
  const emotionLower = (emotion || '').toLowerCase();
  const intensityLower = (intensity || 'medium').toLowerCase();

  // Base scores for emotion categories
  const positiveEmotions = ['happy', 'joy', 'excited', 'grateful', 'hopeful', 'calm', 'peaceful', 'content', 'proud', 'motivated', 'love', 'relief'];
  const neutralEmotions = ['curious', 'contemplative', 'reflective', 'nostalgic', 'confused', 'uncertain', 'bored'];
  const negativeEmotions = ['sad', 'anxious', 'stressed', 'angry', 'frustrated', 'lonely', 'overwhelmed', 'exhausted', 'fearful', 'guilty', 'shame', 'jealous', 'resentful', 'hopeless', 'depressed', 'burnout'];

  let baseScore;
  if (positiveEmotions.some((e) => emotionLower.includes(e))) {
    baseScore = 8;
  } else if (neutralEmotions.some((e) => emotionLower.includes(e))) {
    baseScore = 5;
  } else if (negativeEmotions.some((e) => emotionLower.includes(e))) {
    baseScore = 3;
  } else {
    baseScore = 5; // Default to neutral
  }

  // Adjust by intensity
  if (intensityLower === 'high') {
    baseScore = baseScore >= 5 ? Math.min(baseScore + 1, 10) : Math.max(baseScore - 1, 1);
  } else if (intensityLower === 'low') {
    baseScore = baseScore >= 5 ? Math.max(baseScore - 1, 1) : Math.min(baseScore + 1, 10);
  }

  return baseScore;
};

/**
 * @route   POST /api/chat/send
 * @desc    Send a message to the AI and receive a response with optional insight
 * @access  Private
 *
 * @param {string} req.body.sessionId - The chat session ID
 * @param {string} req.body.message - The user's message text
 * @returns {Object} 200 - { success, response, insight?, sessionId }
 * @returns {Object} 400 - Missing required fields
 * @returns {Object} 404 - Session not found or not owned by user
 */
router.post('/send', async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    let session;

    if (sessionId) {
      // Load existing session
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user.id,
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found.',
        });
      }
    } else {
      // Create a new session if no sessionId provided
      session = await ChatSession.create({
        userId: req.user.id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      });
    }

    // Add user message to the session
    session.messages.push({
      role: 'user',
      content: message.trim(),
    });

    // Build conversation history for the API call
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Gemini AI
    const aiResult = await sendChatMessage(conversationHistory, SYSTEM_PROMPT);

    if (!aiResult.success) {
      return res.status(502).json({
        success: false,
        message: 'Failed to get AI response. Please try again.',
        error: aiResult.error,
      });
    }

    // Parse insight from the AI response
    const { insight, cleanResponse } = parseInsight(aiResult.data);

    // Build assistant message object
    const assistantMessage = {
      role: 'assistant',
      content: cleanResponse,
    };

    if (insight) {
      assistantMessage.insight = insight;
    }

    // Add assistant message to session
    session.messages.push(assistantMessage);

    // Update session title from first user message if it's still default
    if (session.title === 'New session' && session.messages.length <= 2) {
      session.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }

    // Update session mood if insight detected
    if (insight && insight.emotion) {
      session.mood = insight.emotion;
    }

    await session.save();

    // Create a MoodEntry if insight was detected
    if (insight && insight.emotion) {
      try {
        await MoodEntry.create({
          userId: req.user.id,
          emotion: insight.emotion,
          intensity: ['low', 'medium', 'high'].includes(insight.intensity)
            ? insight.intensity
            : 'medium',
          score: emotionToScore(insight.emotion, insight.intensity),
          causes: insight.causes || [],
          recommendations: insight.recommendations || [],
          reflectionQuestion: insight.reflectionQuestion || '',
          source: 'chat',
        });
      } catch (moodError) {
        // Log but don't fail the chat response for mood tracking errors
        console.error('⚠️  Failed to save mood entry from chat:', moodError.message);
      }
    }

    res.status(200).json({
      success: true,
      response: cleanResponse,
      insight: insight || null,
      sessionId: session._id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/chat/sessions
 * @desc    List all chat sessions for the authenticated user
 * @access  Private
 *
 * @returns {Object} 200 - { success, sessions: [{ _id, title, mood, updatedAt, isActive, messageCount }] }
 */
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await ChatSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          mood: 1,
          updatedAt: 1,
          isActive: 1,
          messageCount: { $size: '$messages' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    // Fallback to non-aggregation query if aggregate fails (e.g., ObjectId issues)
    try {
      const sessions = await ChatSession.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .select('title mood updatedAt isActive messages');

      const formatted = sessions.map((s) => ({
        _id: s._id,
        title: s.title,
        mood: s.mood,
        updatedAt: s.updatedAt,
        isActive: s.isActive,
        messageCount: s.messages.length,
      }));

      res.status(200).json({
        success: true,
        sessions: formatted,
      });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
});

/**
 * @route   GET /api/chat/sessions/:id
 * @desc    Get a full chat session with all messages
 * @access  Private
 *
 * @param {string} req.params.id - The session ID
 * @returns {Object} 200 - { success, session }
 * @returns {Object} 404 - Session not found or not owned by user
 */
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new empty chat session
 * @access  Private
 *
 * @param {string} [req.body.title] - Optional session title
 * @returns {Object} 201 - { success, session }
 */
router.post('/sessions', async (req, res, next) => {
  try {
    const { title } = req.body;

    const session = await ChatSession.create({
      userId: req.user.id,
      title: title || 'New session',
      messages: [],
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/chat/sessions/:id
 * @desc    Delete a chat session
 * @access  Private
 *
 * @param {string} req.params.id - The session ID
 * @returns {Object} 200 - { success, message }
 * @returns {Object} 404 - Session not found or not owned by user
 */
router.delete('/sessions/:id', async (req, res, next) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
