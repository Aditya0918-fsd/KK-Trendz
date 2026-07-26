import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import PurchaseOrder from './models/PurchaseOrder';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kk-traders';

async function checkPOs() {
    try {
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log('Fetching Pending Approval POs...');
        const po = await PurchaseOrder.findOne({ status: 'Pending Approval' });
        if (po) {
            console.log('Found PO:', JSON.stringify(po, null, 2));
        } else {
            console.log('No Pending Approval PO found, fetching any PO...');
            const anyPo = await PurchaseOrder.findOne();
            console.log('Found PO:', JSON.stringify(anyPo, null, 2));
        }
    } catch (err) {
        console.error('Error during PO check:', err);
    } finally {
        await mongoose.connection.close();
    }
}
checkPOs();
