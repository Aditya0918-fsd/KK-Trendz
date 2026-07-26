import express from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getLocations)
    .post(protect, admin, createLocation);

router.route('/:id')
    .put(protect, admin, updateLocation)
    .delete(protect, admin, deleteLocation);

export default router;
