import mongoose from 'mongoose';
import Employee from './models/Employee';
import Payroll from './models/Payroll';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI as string);
    const emps = await Employee.find({'employment.category': 'Contract'});
    const ids = emps.map(e => e._id);
    await Payroll.updateMany(
        { employee: { $in: ids } },
        {
            $set: {
                'salaryDetails.calculatedGross': 0,
                'salaryDetails.overtimePay': 0,
                'salaryDetails.holidaySundayExtraPay': 0,
                'salaryDetails.deductions': 0,
                'salaryDetails.netSalary': 0
            }
        }
    );
    console.log(`Fixed ${ids.length} contract employees`);
    process.exit(0);
}

run();
