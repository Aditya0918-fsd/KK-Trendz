import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kk_tex_db';

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'Aditya Saha';
        const hashedPassword = await bcrypt.hash('Aditya123', 12);

        const adminData = {
            username: 'AdityaSaha',
            userId: 'ADMIN002',
            name: 'Aditya Saha',
            email: adminEmail,
            password: hashedPassword,
            role: 'Admin',
            status: 'Active',
            permissions: [
                { module: 'all', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true }
            ]
        };

        const user = await User.findOneAndUpdate(
            { $or: [{ email: adminEmail }, { userId: 'ADMIN002' }, { role: 'Admin' }] },
            adminData,
            { upsert: true, new: true }
        );

        console.log('Admin user created/updated successfully:', user.email);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
