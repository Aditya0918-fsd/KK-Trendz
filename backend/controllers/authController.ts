import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try {
        const query = email ? email.trim() : '';
        const user = await User.findOne({
            $or: [
                { email: query },
                { username: query },
                { name: query },
                { userId: query },
                { email: { $regex: new RegExp(`^${query}$`, 'i') } },
                { username: { $regex: new RegExp(`^${query}$`, 'i') } }
            ]
        });
        if (!user) {
            console.log(`User not found for identifier: ${email}`);
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (!user.password) {
            console.log(`User has no password: ${email}`);
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        console.log(`User found: ${user.username}, comparing password...`);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        console.log('Password match, generating token...');
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const initAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminEmail = 'Aditya Saha';
        const hashedPassword = await bcrypt.hash('Aditya123', 12);

        const admin = await User.findOneAndUpdate(
            { email: adminEmail },
            {
                username: 'AdityaSaha',
                userId: 'ADMIN001',
                name: 'Aditya Saha',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin',
                status: 'Active'
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({
            message: 'Admin user updated/created successfully',
            email: admin.email,
            password: 'admin123',
            role: admin.role
        });
    } catch (error: any) {
        console.error('Error seeding admin:', error);
        res.status(500).json({ message: 'Error seeding admin', error: error.message });
    }
};

