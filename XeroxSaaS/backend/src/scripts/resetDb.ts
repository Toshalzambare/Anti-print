import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetDb = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const collections = await mongoose.connection.db?.collections();
    
    if (collections) {
      for (let collection of collections) {
        await collection.deleteMany({});
        console.log(`Cleared collection: ${collection.collectionName}`);
      }
    }

    console.log('Database reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDb();