const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkAdmin = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    await mongoose.connect(uri);

    const admin = await mongoose.connection.collection('users').findOne({ email: 'avocadoinc790@gmail.com' });
    console.log('--- ADMIN USER ---');
    console.log(JSON.stringify(admin, null, 2));

    // Check for whitespace
    if (admin) {
        console.log('Password length:', admin.password.length);
        console.log('Password bytes:', Buffer.from(admin.password));
    }

    process.exit(0);
};

checkAdmin();
