import mongoose from 'mongoose';
import Employee from './models/Employee';
import Payroll from './models/Payroll';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI as string);
    const emps = await Employee.find({'employment.category': 'Contract'});
    const ids = emps.map(e => e._id);
    const payrolls = await Payroll.find({ employee: { $in: ids }, 'salaryDetails.netSalary': { $gt: 0 } });
    console.log(`Contract Employees with netSalary > 0: ${payrolls.length}`);
    process.exit(0);
}
run();
