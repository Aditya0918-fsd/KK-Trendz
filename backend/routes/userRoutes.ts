import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserPermissions,
    toggleUserStatus,
    deleteUser
} from '../controllers/userController';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/permissions', updateUserPermissions);
router.put('/:id/toggle-status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;
