const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const resetAdmin = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);

    console.log('Resetting Admin ID: admin-001 ...');

    // Force update the specific ID that was conflicting
    const res = await mongoose.connection.collection('users').findOneAndUpdate(
        { id: 'admin-001' },
        {
            $set: {
                name: 'Workspace Admin',
                email: 'avocadoinc790@gmail.com',
                password: 'admin',
                role: 'ADMIN',
                verified: true,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
            }
        },
        { upsert: true, returnDocument: 'after' }
    );

    console.log('Admin Reset Result:', res);
    console.log('Successful.');
    process.exit(0);
};

resetAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
