#!/usr/bin/env node
/**
 * scripts/clear-db.js
 * Safely clears key MongoDB collections configured by MONGODB_URI.
 * Usage: `npm run clear-db`
 * WARNING: This is destructive and irreversible. Use only in development/testing.
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env.local if present
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment (.env.local). Aborting.');
  process.exit(1);
}

async function clearCollections() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DBNAME });

  try {
    const db = mongoose.connection.db;

    // Collections to clear (if they exist)
    const collections = [
      'admins',
      'students',
      'faculties',
      'courses',
      'feedbackforms',
      'feedbackresponses',
      'mappings',
      'submissionstatuses',
      'departments',
      // Legacy / deprecated collections
      'subjects',
      'programs',
      'users',
    ];

    for (const name of collections) {
      try {
        const exists = await db.listCollections({ name }).hasNext();
        if (!exists) {
          console.log(`Skipping '${name}' (collection does not exist).`);
          continue;
        }

        await db.collection(name).deleteMany({});
        console.log(`Cleared collection '${name}'.`);
      } catch (err) {
        console.error(`Error clearing collection '${name}':`, err.message);
      }
    }

    console.log('✅ Database cleanup completed.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
  }
}

clearCollections().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
