import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';

// GET all users (without password)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find()
            .select('-password -resetToken -resetTokenExpiry')
            .populate('employeeId', 'name department')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetToken -resetTokenExpiry')
            .populate('employeeId', 'name department');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST create new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, role, employeeId, permissions } = req.body;

        // Check for existing user
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            res.status(409).json({ message: 'Username or email already exists' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Auto-generate userId
        const count = await User.countDocuments();
        const userId = `USR${String(count + 1).padStart(4, '0')}`;

        const user = new User({
            userId,
            username,
            email,
            password: hashedPassword,
            role: role || 'Operator',
            employeeId: employeeId || undefined,
            permissions: permissions || [],
            status: 'Active',
            loginAttempts: 0,
        });

        const saved = await user.save();
        const { password: _, ...userObj } = saved.toObject();
        res.status(201).json(userObj);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PUT update user info (role, status, permissions)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, status, permissions, email, employeeId } = req.body;

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role, status, permissions, email, employeeId } },
            { new: true, runValidators: true }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!updated) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PUT update only permissions for a user
export const updateUserPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            res.status(400).json({ message: 'Permissions must be an array' });
            return;
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { permissions } },
            { new: true }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!updated) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PUT lock / unlock a user
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.status = user.status === 'Active' ? 'Inactive' : 'Active';
        user.loginAttempts = 0;
        await user.save();
        res.json({ message: `User status set to ${user.status}`, status: user.status });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'User removed successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
