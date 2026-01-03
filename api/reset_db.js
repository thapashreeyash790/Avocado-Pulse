const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');
};

const reset = async () => {
    await connectDB();

    console.log('Clearing collections...');
    const collections = ['users', 'clients', 'projects', 'tasks', 'invoices', 'verifications', 'conversations', 'messages', 'docs', 'activities'];

    for (const name of collections) {
        try {
            await mongoose.connection.collection(name).drop();
            console.log(`Dropped ${name}`);
        } catch (e) {
            if (e.code === 26) {
                console.log(`Collection ${name} not found (already empty).`);
            } else {
                console.error(`Error dropping ${name}:`, e.message);
            }
        }
    }

    console.log('Collections cleared.');

    // Re-seed Admin
    const User = mongoose.model('User', new mongoose.Schema({
        id: String, name: String, email: String, password: String, role: String, verified: Boolean, avatar: String
    }));

    console.log('Seeding Admin...');
    await User.create({
        id: 'admin-001',
        name: 'Workspace Admin',
        email: 'avocadoinc790@gmail.com',
        password: 'admin',
        role: 'ADMIN',
        verified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    });
    console.log('Admin seeded: avocadoinc790@gmail.com / admin');

    console.log('Done.');
    process.exit(0);
};

reset().catch(err => {
    console.error(err);
    process.exit(1);
});
