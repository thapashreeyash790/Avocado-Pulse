const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkIndexes = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    await mongoose.connect(uri);

    try {
        const indexes = await mongoose.connection.collection('users').indexes();
        console.log('--- USER INDEXES ---');
        console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.log('Error fetching indexes:', e.message);
    }
    process.exit(0);
};

checkIndexes();
