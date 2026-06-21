import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://pmproductportfolio_db_user:pOqOoDMHKPtcDEXc@cluster0.j7c056d.mongodb.net/grammarquest?retryWrites=true&w=majority";



if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Mongoose connection established successfully.");
      return mongoose;
    }).catch((err) => {
      console.error("Mongoose connection promise rejected:", err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("Mongoose connection failed:", e);
    throw e;
  }

  return cached.conn;
}

