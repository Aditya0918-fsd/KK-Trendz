const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const PurchaseOrder = require('./backend/models/PurchaseOrder').default;

async function checkPOs() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kk-traders');
        const pos = await PurchaseOrder.find();
        console.log(JSON.stringify(pos, null, 2));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
checkPOs();
