const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../api/.env') });

const resetDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped');

        // Re-seed Admin
        const User = mongoose.model('User', new mongoose.Schema({
            id: String, name: String, email: String, password: String, role: String, verified: Boolean, permissions: Object, createdAt: Date
        }));

        await User.create({
            id: 'admin-001',
            name: 'Workspace Admin',
            email: 'avocadoinc790@gmail.com',
            password: 'admin',
            role: 'ADMIN',
            verified: true,
            permissions: { billing: true, projects: true, timeline: true, management: true, messages: true, docs: true },
            createdAt: new Date()
        });
        console.log('Admin re-seeded: avocadoinc790@gmail.com / admin');

        process.exit(0);
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
};

resetDB();
