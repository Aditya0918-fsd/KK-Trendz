const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const seedProduction = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const SalesOrder = mongoose.connection.collection('salesorders');
        const Employee = mongoose.connection.collection('employees');
        const Location = mongoose.connection.collection('locations');

        const order = await SalesOrder.findOne({});
        const employee = await Employee.findOne({});
        const location = await Location.findOne({});

        if (!order || !employee || !location) {
            console.log('Missing required seed dependencies (Order, Employee, or Location)');
            process.exit(1);
        }

        const productionPlans = [
            {
                planId: 'PLN-2024-001',
                planDate: new Date(),
                orderId: order._id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                items: [{ productId: order.items[0]?.productId, quantity: 500 }],
                status: 'In Progress'
            },
            {
                planId: 'PLN-2024-002',
                planDate: new Date(),
                orderId: order._id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                items: [{ productId: order.items[0]?.productId, quantity: 1000 }],
                status: 'Planned'
            }
        ];

        const cuttings = [
            {
                batchNumber: 'CUT-B001',
                cuttingDate: new Date(),
                orderId: order._id,
                shift: 'Morning',
                supervisorId: employee._id,
                cuttingPlan: { markerName: 'M-XL-RED', layers: 50, piecesPerLayer: 4, totalExpectedPieces: 200, efficiency: 95 },
                status: 'Completed'
            },
            {
                batchNumber: 'CUT-B002',
                cuttingDate: new Date(),
                orderId: order._id,
                shift: 'Evening',
                supervisorId: employee._id,
                cuttingPlan: { markerName: 'M-L-BLUE', layers: 30, piecesPerLayer: 4, totalExpectedPieces: 120, efficiency: 92 },
                status: 'In Progress'
            }
        ];

        const stitchings = [
            {
                batchNumber: 'ST-2024-001',
                stitchingDate: new Date(),
                orderId: order._id,
                lineId: 'Line 1',
                shift: 'Morning',
                supervisorId: employee._id,
                inputFromCutting: [{ batchId: null, quantity: 200 }],
                status: 'In Progress'
            }
        ];

        const finishings = [
            {
                finishingId: 'FIN-2024-001',
                finishingDate: new Date(),
                orderId: order._id,
                batchNumber: 'F-BATCH-01',
                shift: 'Morning',
                supervisorId: employee._id,
                status: 'Pending'
            }
        ];

        const qcs = [
            {
                checkingId: 'CHK-20240226-001',
                checkingDate: new Date(),
                orderId: order._id,
                batchNumber: 'QC-BATCH-01',
                shift: 'Morning',
                checkerId: employee._id,
                supervisorId: employee._id,
                summary: { totalChecked: 472, totalPassed: 465, totalRejected: 7, totalRework: 0, acceptanceRate: 98.52, rejectionRate: 1.48 },
                status: 'Completed'
            }
        ];

        await mongoose.connection.collection('productionplans').insertMany(productionPlans);
        await mongoose.connection.collection('cuttingproductions').insertMany(cuttings);
        await mongoose.connection.collection('stitchingproductions').insertMany(stitchings);
        await mongoose.connection.collection('finishingproductions').insertMany(finishings);
        await mongoose.connection.collection('qualitycontrols').insertMany(qcs);

        console.log('Production and QC data seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedProduction();
