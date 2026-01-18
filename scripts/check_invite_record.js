const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkInvite = async () => {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);

    const email = 'wildrift790@gmail.com';
    const user = await mongoose.connection.collection('users').findOne({ email: email });
    const verification = await mongoose.connection.collection('verifications').findOne({ email: email });

    console.log('--- USER ---');
    console.log(JSON.stringify(user, null, 2));
    console.log('--- VERIFICATION ---');
    console.log(JSON.stringify(verification, null, 2));

    process.exit(0);
};

checkInvite();
