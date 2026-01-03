const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const check = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    await mongoose.connect(uri);

    const users = await mongoose.connection.collection('users').find({}).toArray();
    console.log('--- ALL USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-----------------');

    const adminCount = await mongoose.connection.collection('users').countDocuments({ role: 'ADMIN' });
    console.log('Count where role="ADMIN":', adminCount);

    process.exit(0);
};

check();
