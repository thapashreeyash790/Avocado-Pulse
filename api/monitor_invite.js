const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const monitor = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';
    await mongoose.connect(uri);

    const User = mongoose.connection.collection('users');
    const Verification = mongoose.connection.collection('verifications');

    const testEmail = 'monitor_test_' + Date.now() + '@example.com';
    const userId = 'monitor_' + Date.now();

    console.log(`[TEST] Creating User ${userId} (${testEmail})...`);

    // Simulate Invite creation
    await User.insertOne({
        id: userId,
        email: testEmail,
        role: 'TEAM',
        verified: false,
        name: 'Monitor Test',
        password: 'PENDING_INVITE',
        createdAt: new Date(),
        lastActive: new Date()
    });

    await Verification.insertOne({
        email: testEmail,
        token: '123456',
        payload: { id: userId },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Check 1: Immediate
    let user = await User.findOne({ id: userId });
    console.log(`[CHECK 1] User exists? ${!!user}`);

    if (!user) {
        console.error('User creation failed!');
        process.exit(1);
    }

    // Simulate Expiry
    console.log('[TEST] Deleting Verification token (Simulating TTL)...');
    await Verification.deleteOne({ email: testEmail });

    // Check 2: Immediately after verification delete
    user = await User.findOne({ id: userId });
    console.log(`[CHECK 2] User exists after token delete? ${!!user}`);

    if (user) {
        console.log('✅ PASS: User persists after verification expiry. Issue is Frontend-side.');
        // Cleanup
        await User.deleteOne({ id: userId });
    } else {
        console.error('❌ FAIL: User vanished! There is a hidden link.');
    }

    process.exit(0);
};

monitor();
