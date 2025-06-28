import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// --- Mongoose connection for your models ---
export async function dbConnect() {
  console.log('dbConnect: called');
  if (mongoose.connection.readyState >= 1) {
    console.log('dbConnect: already connected');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('dbConnect: connected');
  } catch (err) {
    console.error('dbConnect: error', err);
    throw err;
  }
}

// --- MongoClient for NextAuth adapter ---
let client;
let clientPromise: Promise<MongoClient>;

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  (global as any)._mongoClientPromise = client.connect();
}
clientPromise = (global as any)._mongoClientPromise as Promise<MongoClient>;

export default clientPromise; 