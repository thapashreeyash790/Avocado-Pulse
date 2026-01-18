const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');
};

const cleanup = async () => {
    await connectDB();

    console.log('Cleaning up database...');

    // 1. Delete all non-admin users
    const userResult = await mongoose.connection.collection('users').deleteMany({ role: { $ne: 'ADMIN' } });
    console.log(`Deleted ${userResult.deletedCount} non-admin users.`);

    // 2. Delete all other collections entirely
    const collections = [
        'clients', 'projects', 'tasks', 'invoices',
        'verifications', 'conversations', 'messages',
        'docs', 'activities'
    ];

    for (const name of collections) {
        try {
            const res = await mongoose.connection.collection(name).deleteMany({});
            console.log(`Deleted all ${res.deletedCount} documents from ${name}`);
        } catch (e) {
            console.log(`Error clearing ${name} (might not exist):`, e.message);
        }
    }

    console.log('Cleanup complete. Admin accounts preserved.');
    process.exit(0);
};

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
