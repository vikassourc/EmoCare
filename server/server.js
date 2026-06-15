/**
 * @fileoverview EmoCare Express server entry point.
 * Configures middleware (security, CORS, rate limiting, static files),
 * mounts API routes, serves the SPA catch-all, and starts the server
 * after establishing a MongoDB connection.
 * @module server
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const journalRoutes = require('./routes/journal');
const moodRoutes = require('./routes/mood');
const dashboardRoutes = require('./routes/dashboard');
const appointmentRoutes = require('./routes/appointments');

// Create Express application
const app = express();

// ---------- Security Middleware ----------

/**
 * Helmet sets various HTTP headers for security.
 * Content Security Policy is relaxed for SPA compatibility.
 */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for SPA frontend flexibility
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * CORS configuration allowing all origins in development
 * and restricting in production.
 */
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CORS_ORIGIN || 'http://localhost:3000'
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ---------- Body Parsing ----------

/**
 * Parse JSON request bodies up to 10MB.
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Parse URL-encoded request bodies.
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------- Request Logger ----------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------- Rate Limiting ----------

/**
 * Global rate limiter: 100 requests per 15-minute window per IP.
 * Returns a standardized JSON error on limit exceeded.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a few minutes.',
  },
});

app.use('/api/', limiter);

// ---------- Static Files ----------

/**
 * Serve static files from the public directory.
 */
const publicPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(publicPath));

// ---------- API Routes ----------

/**
 * Mount authentication routes (signup, login, profile, etc.)
 */
app.use('/api/auth', authRoutes);

/**
 * Mount chat routes (send messages, manage sessions)
 */
app.use('/api/chat', chatRoutes);

/**
 * Mount journal routes (CRUD, prompts, feedback)
 */
app.use('/api/journal', journalRoutes);

/**
 * Mount mood tracking routes (entries, stats)
 */
app.use('/api/mood', moodRoutes);

/**
 * Mount dashboard routes (stats, charts, triggers, recommendations, analysis)
 */
app.use('/api/dashboard', dashboardRoutes);

/**
 * Mount appointment routes
 */
app.use('/api/appointments', appointmentRoutes);

// ---------- Health Check ----------

/**
 * @route   GET /api/health
 * @desc    Server health check endpoint
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EmoCare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ---------- SPA Catch-All ----------

/**
 * Catch-all route for the Single Page Application.
 * Only serves index.html for requests that:
 * 1. Are not API routes
 * 2. Accept HTML (browser navigation requests)
 *
 * This ensures API 404s return JSON and asset requests don't interfere.
 */
app.get('*', (req, res, next) => {
  // Skip API routes — let them fall through to 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`,
    });
  }

  // Only serve index.html for HTML-accepting requests (browser navigation)
  if (req.accepts('html')) {
    const indexPath = path.join(publicPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        // If index.html doesn't exist, return a simple message
        res.status(200).json({
          success: true,
          message: 'EmoCare API server is running. Frontend not deployed yet.',
        });
      }
    });
  }

  // For non-HTML requests to non-API paths, return 404
  res.status(404).json({
    success: false,
    message: 'Resource not found.',
  });
});

// ---------- Error Handler ----------

/**
 * Global error handling middleware (must be registered last).
 */
app.use(errorHandler);

// ---------- Server Startup ----------

const PORT = process.env.PORT || 3000;

/**
 * Connect to MongoDB and start the Express server.
 * Exits the process if the database connection fails.
 */
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║           🌿 EmoCare Server Ready 🌿         ║
╠══════════════════════════════════════════════╣
║  Port:        ${String(PORT).padEnd(30)}║
║  Environment: ${String(process.env.NODE_ENV || 'development').padEnd(30)}║
║  API Base:    http://localhost:${String(PORT).padEnd(18)}║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
