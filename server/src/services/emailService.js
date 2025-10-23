const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Direct Email Service with Chunk Processing
 * Optimized for better performance with bulk email sending
 */

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5, // 5 emails per second
});

/**
 * Send a single email directly
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (to, from="TA Appointment System - CSE",   subject, html) => {
    try {
        const mailOptions = {
            from: `${from} <${config.GMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${result.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return false;
    }
};


module.exports = {
    sendEmail
};