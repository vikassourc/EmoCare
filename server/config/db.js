/**
 * @fileoverview MongoDB connection configuration using Mongoose.
 * Establishes connection to MongoDB and sets up event listeners
 * for connection lifecycle events.
 * @module config/db
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection URI from environment variables.
 * Sets up event listeners for connected, error, and disconnected events.
 * Exits the process on initial connection failure.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 * @throws {Error} If the initial connection fails
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 uses the new URL parser and unified topology by default
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📦 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
