import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars if not already loaded (useful for standalone scripts)
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const connectDB = async () => {
    // Avoid redundant connection attempts if already connected
    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('CRITICAL: MONGODB_URI is not defined in environment variables');
            process.exit(1);
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000, // Slightly more time for slow networks
            connectTimeoutMS: 15000,
        });

        console.log(`MongoDB Connected Successful: ${conn.connection.host}`);
    } catch (error: any) {
        console.error('--- MongoDB Connection Error Details ---');
        console.error(`Message: ${error.message}`);
        if (error.name) console.error(`Name: ${error.name}`);
        if (error.code) console.error(`Code: ${error.code}`);
        if (error.reason) console.error(`Reason: ${JSON.stringify(error.reason)}`);
        console.error('-----------------------------------------');

        // Retry logic
        console.log('Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

export default connectDB;
