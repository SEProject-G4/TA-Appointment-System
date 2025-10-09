const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., 'Gmail', 'SendGrid', etc.
    auth: {
        user: config.GMAIL_USER, // Use environment variables
        pass: config.GMAIL_PASS,
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
};