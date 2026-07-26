import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('MongoDB Connection Error Details:');
        console.error(err);
        process.exit(1);
    });
