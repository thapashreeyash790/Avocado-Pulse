const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function test() {
    console.log('--- SMTP Standalone Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);
    // Hide password for security
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MISSING');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true, // 465 is SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true, // Show full SMTP traffic
        logger: true // Log to console
    });

    try {
        console.log('\nStarting verification...');
        const result = await transporter.verify();
        console.log('Verification Success:', result);
    } catch (err) {
        console.error('\nVerification FAIL:');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Command:', err.command);
        console.error('Response:', err.response);
    }
}

test();
