import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if ((req.headers.authorization && req.headers.authorization.startsWith('Bearer')) || req.query.token) {
        try {
            token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.token;
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                console.log('User not found in DB for token');
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }
            return next();
        } catch (error: any) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        console.log('No token found in headers');
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const admin = (req: any, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
