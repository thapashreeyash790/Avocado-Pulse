require('dotenv').config();
const nodemailer = require('nodemailer');

const testParams = async () => {
    console.log('--- Testing Email Configuration ---');
    console.log('User:', process.env.SMTP_USER);
    // Hide password for security in logs
    console.log('Pass:', process.env.SMTP_PASS ? '****** (Set)' : 'MISSING');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self
            subject: 'FlowTrack Email Test',
            text: 'If you are reading this, the email system is working perfectly!',
        });
        console.log('✅ SUCCESS! Email sent.');
        console.log('Message ID:', info.messageId);
    } catch (err) {
        console.log('❌ FAILED.');
        console.error(err.message);
    }
};

testParams();
