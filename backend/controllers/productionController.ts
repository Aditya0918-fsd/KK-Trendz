import { Request, Response } from 'express';
import ProductionPlan from '../models/ProductionPlan';
import CuttingProduction from '../models/CuttingProduction';
import StitchingProduction from '../models/StitchingProduction';
import FinishingProduction from '../models/FinishingProduction';
import ProductionJobCard from '../models/ProductionJobCard';
import SalesOrder from '../models/SalesOrder';

// Helper to sync production status back to SalesOrder
const syncProductionStatus = async (orderId: any) => {
    try {
        if (!orderId) return;
        
        const [cuttings, stitchings, finishings] = await Promise.all([
            CuttingProduction.find({ orderId, status: 'Completed' }),
            StitchingProduction.find({ orderId, status: { $in: ['Completed', 'Stitching Completed'] } }),
            FinishingProduction.find({ orderId, status: 'Finished' })
        ]);

        const cuttingTotal = cuttings.reduce((acc, curr) => acc + (curr.outputStorage?.totalPieces || 0), 0);
        const stitchingTotal = stitchings.reduce((acc, curr) => acc + (curr.productionSummary?.totalOutput || 0), 0);
        const finishingTotal = finishings.reduce((acc, curr) => acc + (curr.ironing?.outputQuantity || 0), 0);

        await SalesOrder.findByIdAndUpdate(orderId, {
            $set: {
                'items.$[].productionStatus.cuttingCompleted': cuttingTotal,
                'items.$[].productionStatus.stitchingCompleted': stitchingTotal,
                'items.$[].productionStatus.finishingCompleted': finishingTotal,
            }
        });
        // Note: The $[]. operator updates all items. 
        // If the system supports multiple items per order and tracking them separately, 
        // we'd need to filter by productId too. Let's assume one item type for now or apply to all.
    } catch (error) {
        console.error('Sync Error:', error);
    }
};

// ─── PRODUCTION PLAN ──────────────────────────────────────────────────────────

export const createProductionPlan = async (req: any, res: Response) => {
    try {
        const plan = new ProductionPlan({ ...req.body, createdBy: req.user.id });
        await plan.save();
        res.status(201).json(plan);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getProductionPlans = async (req: Request, res: Response) => {
    try {
        const plans = await ProductionPlan.find()
            .populate('productionSchedule.orderId')
            .populate('productionSchedule.productId')
            .sort({ createdAt: -1 });
        res.json(plans);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductionPlanById = async (req: Request, res: Response) => {
    try {
        const plan = await ProductionPlan.findById(req.params.id)
            .populate('productionSchedule.orderId')
            .populate('productionSchedule.productId')
            .populate('productionSchedule.processes.operatorId');
        if (!plan) return res.status(404).json({ message: 'Production plan not found' });
        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProductionPlan = async (req: any, res: Response) => {
    try {
        const plan = await ProductionPlan.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user.id },
            { new: true, runValidators: true }
        ).populate('productionSchedule.orderId').populate('productionSchedule.productId');
        if (!plan) return res.status(404).json({ message: 'Production plan not found' });
        res.json(plan);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteProductionPlan = async (req: Request, res: Response) => {
    try {
        const plan = await ProductionPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Production plan not found' });
        res.json({ message: 'Production plan deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── CUTTING PRODUCTION ───────────────────────────────────────────────────────

export const createCuttingProduction = async (req: any, res: Response) => {
    try {
        const cutting = new CuttingProduction({ ...req.body, createdBy: req.user.id });
        await cutting.save();
        await syncProductionStatus(cutting.orderId);
        res.status(201).json(cutting);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getCuttingProductions = async (req: Request, res: Response) => {
    try {
        const cuttings = await CuttingProduction.find()
            .populate('orderId')
            .populate('supervisorId')
            .populate('inputFabric.fabricId')
            .populate('outputStorage.storedAt')
            .sort({ createdAt: -1 });
        res.json(cuttings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCuttingProductionById = async (req: Request, res: Response) => {
    try {
        const cutting = await CuttingProduction.findById(req.params.id)
            .populate('orderId')
            .populate('supervisorId')
            .populate('outputStorage.storedAt');
        if (!cutting) return res.status(404).json({ message: 'Cutting record not found' });
        res.json(cutting);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCuttingProduction = async (req: any, res: Response) => {
    try {
        const cutting = await CuttingProduction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('orderId').populate('supervisorId');
        if (!cutting) return res.status(404).json({ message: 'Cutting record not found' });
        await syncProductionStatus(cutting.orderId);
        res.json(cutting);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCuttingProduction = async (req: Request, res: Response) => {
    try {
        const cutting = await CuttingProduction.findByIdAndDelete(req.params.id);
        if (!cutting) return res.status(404).json({ message: 'Cutting record not found' });
        await syncProductionStatus(cutting.orderId);
        res.json({ message: 'Cutting record deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── STITCHING PRODUCTION ─────────────────────────────────────────────────────

export const createStitchingProduction = async (req: any, res: Response) => {
    try {
        const stitching = new StitchingProduction({ ...req.body, createdBy: req.user.id });
        await stitching.save();
        await syncProductionStatus(stitching.orderId);
        res.status(201).json(stitching);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getStitchingProductions = async (req: Request, res: Response) => {
    try {
        const stitchings = await StitchingProduction.find()
            .populate('orderId')
            .populate('supervisorId')
            .populate('inputBundles.cuttingId')
            .populate('outputStorage.storedAt')
            .sort({ createdAt: -1 });
        res.json(stitchings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getStitchingProductionById = async (req: Request, res: Response) => {
    try {
        const stitching = await StitchingProduction.findById(req.params.id)
            .populate('orderId')
            .populate('supervisorId')
            .populate('inputBundles.cuttingId')
            .populate('outputStorage.storedAt');
        if (!stitching) return res.status(404).json({ message: 'Stitching record not found' });
        res.json(stitching);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStitchingProduction = async (req: any, res: Response) => {
    try {
        const stitching = await StitchingProduction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('orderId').populate('supervisorId');
        if (!stitching) return res.status(404).json({ message: 'Stitching record not found' });
        await syncProductionStatus(stitching.orderId);
        res.json(stitching);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteStitchingProduction = async (req: Request, res: Response) => {
    try {
        const stitching = await StitchingProduction.findByIdAndDelete(req.params.id);
        if (!stitching) return res.status(404).json({ message: 'Stitching record not found' });
        await syncProductionStatus(stitching.orderId);
        res.json({ message: 'Stitching record deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── FINISHING PRODUCTION ─────────────────────────────────────────────────────

export const createFinishingProduction = async (req: any, res: Response) => {
    try {
        const finishing = new FinishingProduction({ ...req.body, createdBy: req.user.id });
        await finishing.save();
        await syncProductionStatus(finishing.orderId);
        res.status(201).json(finishing);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getFinishingProductions = async (req: Request, res: Response) => {
    try {
        const finishings = await FinishingProduction.find()
            .populate('orderId')
            .populate('supervisorId')
            .populate('inputBundles.stitchingId')
            .populate('outputStorage.storedAt')
            .sort({ createdAt: -1 });
        res.json(finishings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getFinishingProductionById = async (req: Request, res: Response) => {
    try {
        const finishing = await FinishingProduction.findById(req.params.id)
            .populate('orderId')
            .populate('supervisorId')
            .populate('outputStorage.storedAt');
        if (!finishing) return res.status(404).json({ message: 'Finishing record not found' });
        res.json(finishing);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFinishingProduction = async (req: any, res: Response) => {
    try {
        const finishing = await FinishingProduction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('orderId').populate('supervisorId');
        if (!finishing) return res.status(404).json({ message: 'Finishing record not found' });
        await syncProductionStatus(finishing.orderId);
        res.json(finishing);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteFinishingProduction = async (req: Request, res: Response) => {
    try {
        const finishing = await FinishingProduction.findByIdAndDelete(req.params.id);
        if (!finishing) return res.status(404).json({ message: 'Finishing record not found' });
        await syncProductionStatus(finishing.orderId);
        res.json({ message: 'Finishing record deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PRODUCTION JOB CARD ──────────────────────────────────────────────────────

export const createProductionJobCard = async (req: any, res: Response) => {
    try {
        const jobCard = new ProductionJobCard({ ...req.body, createdBy: req.user.id });
        await jobCard.save();
        res.status(201).json(jobCard);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getProductionJobCards = async (req: Request, res: Response) => {
    try {
        const jobCards = await ProductionJobCard.find()
            .populate('orderId')
            .populate('productId')
            .sort({ createdAt: -1 });
        res.json(jobCards);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductionJobCardById = async (req: Request, res: Response) => {
    try {
        const jobCard = await ProductionJobCard.findById(req.params.id)
            .populate('orderId')
            .populate('productId');
        if (!jobCard) return res.status(404).json({ message: 'Job card not found' });
        res.json(jobCard);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProductionJobCard = async (req: any, res: Response) => {
    try {
        const jobCard = await ProductionJobCard.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('orderId').populate('productId');
        if (!jobCard) return res.status(404).json({ message: 'Job card not found' });
        res.json(jobCard);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteProductionJobCard = async (req: Request, res: Response) => {
    try {
        const jobCard = await ProductionJobCard.findByIdAndDelete(req.params.id);
        if (!jobCard) return res.status(404).json({ message: 'Job card not found' });
        res.json({ message: 'Job card deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PRODUCTION STATS (for dashboard overview) ────────────────────────────────

export const getProductionStats = async (req: Request, res: Response) => {
    try {
        const [plans, cuttings, stitchings, finishings, jobCards] = await Promise.all([
            ProductionPlan.countDocuments(),
            CuttingProduction.countDocuments(),
            StitchingProduction.countDocuments(),
            FinishingProduction.countDocuments(),
            ProductionJobCard.countDocuments(),
        ]);

        // Cutting pieces produced
        const cuttingAgg = await CuttingProduction.aggregate([
            { $group: { _id: null, totalPieces: { $sum: '$outputStorage.totalPieces' } } }
        ]);

        // Stitching output
        const stitchingAgg = await StitchingProduction.aggregate([
            { $group: { _id: null, totalOutput: { $sum: '$productionSummary.totalOutput' }, avgEfficiency: { $avg: '$productionSummary.efficiency' } } }
        ]);

        // Finishing output
        const finishingAgg = await FinishingProduction.aggregate([
            { $group: { _id: null, totalOutput: { $sum: '$ironing.outputQuantity' }, totalDefects: { $sum: { $add: ['$ironing.defects', '$threadCutting.defects'] } } } }
        ]);

        // Recent Alerts (Delayed/High Defects)
        const [delayedPlans, highDefectFinishings] = await Promise.all([
            ProductionPlan.find({ status: 'Delayed' }).limit(3).select('planNumber planningFor status'),
            FinishingProduction.find({ 
                $or: [
                    { 'ironing.defects': { $gt: 5 } },
                    { 'threadCutting.defects': { $gt: 5 } }
                ] 
            }).limit(3).select('finishingId finishingDate ironing.defects threadCutting.defects')
        ]);

        const alerts = [
            ...delayedPlans.map(p => ({ type: 'Delay', message: `Plan ${p.planNumber} is delayed`, date: p.planningFor })),
            ...highDefectFinishings.map(f => ({ type: 'Defects', message: `High defects in batch ${f.finishingId}`, date: f.finishingDate }))
        ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        const activePlans = await ProductionPlan.countDocuments({ status: { $in: ['Approved', 'InProgress'] } });

        res.json({
            plans,
            cutting: cuttings,
            stitching: stitchings,
            finishing: finishings,
            jobCards,
            activePlans,
            totalCutPieces: cuttingAgg[0]?.totalPieces || 0,
            totalStitchedOutput: stitchingAgg[0]?.totalOutput || 0,
            avgStitchingEfficiency: Math.round(stitchingAgg[0]?.avgEfficiency || 0),
            totalFinishedOutput: finishingAgg[0]?.totalOutput || 0,
            totalFinishingDefects: finishingAgg[0]?.totalDefects || 0,
            alerts
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
