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
const sendSingleEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: config.GMAIL_USER,
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

/**
 * Process emails in chunks with delays for better performance
 * @param {Array} emails - Array of email objects {to, subject, html}
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Results summary
 */
const sendEmailsInChunks = async (emails, options = {}) => {
    const {
        chunkSize = 5,           // Process 5 emails at a time
        chunkDelay = 2000,       // 2 second delay between chunks
        emailDelay = 500,        // 500ms delay between individual emails
    } = options;

    const results = {
        successful: 0,
        failed: 0,
        total: emails.length,
        details: [],
        startTime: new Date(),
    };

    console.log(`📧 Starting chunk processing for ${emails.length} emails (chunks of ${chunkSize})`);

    try {
        // Process emails in chunks
        for (let i = 0; i < emails.length; i += chunkSize) {
            const chunk = emails.slice(i, i + chunkSize);
            const chunkNumber = Math.floor(i / chunkSize) + 1;
            const totalChunks = Math.ceil(emails.length / chunkSize);

            console.log(`📦 Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} emails)`);

            // Process each email in the chunk sequentially
            for (const email of chunk) {
                try {
                    const success = await sendSingleEmail(email.to, email.subject, email.html);
                    
                    if (success) {
                        results.successful++;
                        results.details.push({
                            to: email.to,
                            status: 'success',
                            sentAt: new Date(),
                        });
                    } else {
                        results.failed++;
                        results.details.push({
                            to: email.to,
                            status: 'failed',
                            reason: 'Email service returned false',
                        });
                    }

                    // Small delay between emails to avoid rate limiting
                    if (emailDelay > 0) {
                        await new Promise(resolve => setTimeout(resolve, emailDelay));
                    }

                } catch (error) {
                    results.failed++;
                    results.details.push({
                        to: email.to,
                        status: 'failed',
                        reason: error.message,
                    });
                    console.error(`❌ Error sending email to ${email.to}:`, error.message);
                }
            }

            // Progress update
            const progress = Math.round((i + chunk.length) / emails.length * 100);
            console.log(`📊 Progress: ${progress}% (${results.successful} sent, ${results.failed} failed)`);

            // Delay between chunks (except for the last chunk)
            if (i + chunkSize < emails.length && chunkDelay > 0) {
                console.log(`⏳ Chunk delay (${chunkDelay}ms)...`);
                await new Promise(resolve => setTimeout(resolve, chunkDelay));
            }
        }

        results.endTime = new Date();
        results.duration = results.endTime - results.startTime;

        console.log(`✅ Chunk processing completed: ${results.successful}/${results.total} emails sent successfully`);
        console.log(`⏱️ Total time: ${Math.round(results.duration / 1000)}s`);

        return results;

    } catch (error) {
        results.endTime = new Date();
        results.error = error.message;
        console.error('❌ Chunk processing failed:', error.message);
        return results;
    }
};

/**
 * Universal email function - handles both single and bulk emails
 * @param {string|Array} recipients - Single email string or array of email objects
 * @param {string} subject - Email subject (for single email)
 * @param {string} html - Email HTML content (for single email)
 * @param {Object} options - Processing options for bulk emails
 * @returns {Promise<Object>} Results
 */
const sendEmail = async (recipients, subject = null, html = null, options = {}) => {
    try {
        // Single email case
        if (typeof recipients === 'string') {
            console.log(`📧 Sending single email to: ${recipients}`);
            const success = await sendSingleEmail(recipients, subject, html);
            
            return {
                type: 'single',
                success,
                recipient: recipients,
                sentAt: new Date(),
            };
        }

        // Bulk email case
        if (Array.isArray(recipients)) {
            console.log(`📧 Sending bulk emails to ${recipients.length} recipients`);
            const results = await sendEmailsInChunks(recipients, options);
            
            return {
                type: 'bulk',
                ...results,
            };
        }

        throw new Error('Invalid recipients format. Must be string or array.');

    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return {
            type: 'error',
            error: error.message,
            timestamp: new Date(),
        };
    }
};

/**
 * Send notification emails (optimized for notifications)
 * @param {Array} emails - Array of email objects
 * @returns {Promise<Object>} Results
 */
const sendNotificationEmails = async (emails) => {
    console.log(`🔔 Sending ${emails.length} notification emails`);
    
    // Optimized settings for notifications
    const options = {
        chunkSize: 10,        // Larger chunks for notifications
        chunkDelay: 1500,     // Shorter delay between chunks
        emailDelay: 300,      // Shorter delay between emails
    };

    return await sendEmailsInChunks(emails, options);
};

/**
 * Send advertisement emails (optimized for marketing)
 * @param {Array} emails - Array of email objects
 * @returns {Promise<Object>} Results
 */
const sendAdvertisementEmails = async (emails) => {
    console.log(`📢 Sending ${emails.length} advertisement emails`);
    
    // Conservative settings for advertisements
    const options = {
        chunkSize: 5,         // Smaller chunks to avoid spam detection
        chunkDelay: 3000,     // Longer delay between chunks
        emailDelay: 1000,     // Longer delay between emails
    };

    return await sendEmailsInChunks(emails, options);
};

/**
 * Test email service connection
 * @returns {Promise<boolean>} Connection status
 */
const testEmailService = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email service connection failed:', error.message);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendSingleEmail,
    sendEmailsInChunks,
    sendNotificationEmails,
    sendAdvertisementEmails,
    testEmailService,
};