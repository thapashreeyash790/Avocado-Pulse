const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';

async function clearDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const dbCollections = await db.listCollections().toArray();

        console.log(`Found ${dbCollections.length} collections.`);

        for (const collInfo of dbCollections) {
            const key = collInfo.name;
            const collection = db.collection(key);

            if (key === 'users') {
                console.log(`Clearing ${key} except avocadoinc790@gmail.com...`);
                const result = await collection.deleteMany({
                    email: { $ne: 'avocadoinc790@gmail.com' }
                });
                console.log(`Deleted ${result.deletedCount} users.`);

                const user = await collection.findOne({ email: 'avocadoinc790@gmail.com' });
                if (user) {
                    console.log('User avocadoinc790@gmail.com found. Updating to ADMIN...');
                    await collection.updateOne(
                        { email: 'avocadoinc790@gmail.com' },
                        { $set: { role: 'ADMIN', verified: true } }
                    );
                } else {
                    console.warn('User avocadoinc790@gmail.com NOT found in database.');
                }
            } else {
                console.log(`Clearing ${key}...`);
                const result = await collection.deleteMany({});
                console.log(`Deleted ${result.deletedCount} documents from ${key}.`);
            }
        }

        console.log('Database maintenance completed.');
    } catch (error) {
        console.error('Error during database operation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
}

clearDB();
