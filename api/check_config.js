const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');

async function check() {
    console.log('--- Configuration Check ---');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Exists' : 'MISSING');
    console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'Exists' : 'MISSING');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Exists' : 'MISSING');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Exists' : 'MISSING');
    console.log('PORT:', process.env.PORT || '4000 (default)');


    if (!process.env.SMTP_HOST) {
        console.log('\n❌ Mail will NOT work. It will default to simulation mode.');
        return;
    }

    console.log('\n✅ Mail configuration detected. Verifying credentials...');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: (process.env.SMTP_SECURE || 'false') === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Verified! Credentials are correct.');
    } catch (err) {
        console.error('❌ SMTP Connection Failed:', err.message);
        console.error('   Hint: If using Gmail, make sure you have an App Password generated.');
    }
}

check();
