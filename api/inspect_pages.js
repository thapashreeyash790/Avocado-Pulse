const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const check = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    await mongoose.connect(uri);

    const pages = await mongoose.connection.collection('pages').find({}).toArray();
    console.log('--- ALL PAGES ---');
    console.log(JSON.stringify(pages, null, 2));
    console.log('-----------------');

    process.exit(0);
};

check();
