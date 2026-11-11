import mongoose from 'mongoose';

/** @type {{ conn: mongoose.Connection | null, promise: Promise<mongoose.Connection> | null }} */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    }).then((m) => m.connection).catch((err) => {
      // cached rejected promise would break every request until restart
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
