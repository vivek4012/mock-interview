import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetInterviews = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_auth');
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('interviews').updateMany(
      { status: 'in-progress' },
      { $set: { status: 'pending' } }
    );

    console.log(`Reset ${result.modifiedCount} interviews from in-progress to pending`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetInterviews();
