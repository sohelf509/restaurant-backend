// backend/src/config/db.js
import mongoose from 'mongoose';

/**
 * Connects to MongoDB with exponential backoff retry logic.
 * @param {Object} options - Connection options
 * @param {string} options.uri - MongoDB connection URI (defaults to env var)
 * @param {number} options.retries - Max retry attempts (default: 5)
 * @param {number} options.delay - Initial delay in ms (default: 1000)
 * @returns {Promise<mongoose.Connection>} - The mongoose connection instance
 */
async function connectDB(options = {}) {
  const {
    uri = process.env.MONGODB_URI || process.env.MONGO_URI,
    retries = 5,
    delay = 1000
  } = options;

  // Validate MongoDB URI
  if (!uri) {
    throw new Error(
      'MongoDB URI is required. Set MONGODB_URI or MONGO_URI environment variable.'
    );
  }

  // Mongoose connection options (Mongoose 6+ compatible)
  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    family: 4 // Use IPv4, skip IPv6
  };

  // Attach connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('✓ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('✗ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected');
  });

  // Exponential backoff retry logic
  let attempt = 0;
  while (attempt < retries) {
    try {
      attempt++;
      console.log(`→ Connecting to MongoDB (attempt ${attempt}/${retries})...`);
      
      await mongoose.connect(uri, mongooseOptions);
      
      console.log(`✓ MongoDB connection established on attempt ${attempt}`);
      
      // Clean up old indexes after successful connection
      await cleanupOldIndexes();
      
      return mongoose.connection;
    } catch (error) {
      console.error(`✗ Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt >= retries) {
        throw new Error(
          `Failed to connect to MongoDB after ${retries} attempts: ${error.message}`
        );
      }
      
      // Exponential backoff: delay * 2^(attempt-1)
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      console.log(`  Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Cleans up old/problematic indexes from collections
 */
async function cleanupOldIndexes() {
  try {
    console.log('→ Checking for old indexes...');
    
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Get all indexes
    const indexes = await ordersCollection.indexes();
    const indexNames = indexes.map(idx => idx.name);
    
    // Drop orderId_1 index if it exists
    if (indexNames.includes('orderId_1')) {
      console.log('  Found old orderId_1 index, dropping...');
      await ordersCollection.dropIndex('orderId_1');
      console.log('✓ Successfully dropped orderId_1 index');
    } else {
      console.log('✓ No old indexes to clean up');
    }
  } catch (error) {
    // Don't fail the connection if index cleanup fails
    if (error.message.includes('index not found')) {
      console.log('✓ No old indexes found');
    } else {
      console.warn('⚠ Index cleanup warning:', error.message);
    }
  }
}

/**
 * Gracefully closes the MongoDB connection.
 */
async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed gracefully');
  } catch (error) {
    console.error('✗ Error closing MongoDB connection:', error.message);
    throw error;
  }
}

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Closing MongoDB connection...`);
  try {
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

export default connectDB;
export { closeDB, cleanupOldIndexes };