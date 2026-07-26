
const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/sales-orders', {
            orderNumber: 'TEST-' + Date.now(),
            customerId: '', // Empty string instead of ObjectId
            deliveryDate: new Date(),
            items: [{
                itemId: '1',
                productId: '',
                productName: 'Test',
                orderQuantity: 1,
                rate: 100,
                taxableAmount: 100,
                gstAmount: 12,
                totalAmount: 112
            }]
        });
        console.log('Success:', res.data);
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Message:', error.response?.data?.message);
    }
}

test();
