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
 * @param {string|string[]} to - Recipient email address or array of addresses
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} from - Sender name (optional)
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (to, subject, html, from = "TA Appointment System - CSE") => {
    try {
        // Handle both single email and array of emails
        const recipients = Array.isArray(to) ? to.join(', ') : to;
        
        const mailOptions = {
            from: `${from} <${config.GMAIL_USER}>`,
            to: recipients,
            subject,
            html, // This ensures HTML content is rendered
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${Array.isArray(to) ? to.length + ' recipients' : to}: ${result.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to send email to ${Array.isArray(to) ? to.length + ' recipients' : to}:`, error.message);
        return false;
    }
};


module.exports = {
    sendEmail
};