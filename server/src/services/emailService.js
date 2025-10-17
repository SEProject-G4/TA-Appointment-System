const nodemailer = require('nodemailer');
const config = require('../config');
const { addBulkEmailJob, addSingleEmailJob, emailQueue, JOB_TYPES } = require('./jobQueue');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., 'Gmail', 'SendGrid', etc.
    auth: {
        user: config.GMAIL_USER, // Use environment variables
        pass: config.GMAIL_PASS,
    },
});

/**
 * Universal email sending function - handles single and bulk emails via job queue
 * @param {String|Array} to - Email address or array of addresses
 * @param {String} subject - Email subject
 * @param {String} htmlContent - Email HTML content
 * @param {Object} options - Additional options
 * @param {Number} options.priority - Job priority (1=normal, 2=high for lecturer notifications)
 * @param {Number} options.delay - Delay before processing (milliseconds)
 * @param {Object} options.metadata - Additional metadata for tracking
 * @param {String} options.jobType - Type of job ('general_email', 'notify_lecturers', 'advertise_modules')
 * @param {String} options.seriesId - Recruitment series ID for tracking campaigns
 * @returns {Promise<Object>} Job information with jobId for tracking
 */
const sendEmail = async (to, subject, htmlContent, options = {}) => {
    try {
        const {
            priority,
            delay = 0,
            metadata = {},
            jobType = 'general_email',
            seriesId = null
        } = options;

        // Auto-set priority based on job type if not specified
        const jobPriority = priority || (jobType === 'notify_lecturers' ? 2 : 1);

        // If sending to multiple recipients, use bulk email job
        if (Array.isArray(to) && to.length > 1) {
            const emails = to.map(recipient => ({
                to: recipient,
                subject,
                html: htmlContent,
                metadata: { ...metadata, recipient }
            }));

            const jobData = {
                emails,
                jobType,
                seriesId,
                metadata: {
                    ...metadata,
                    queuedAt: new Date(),
                    totalEmails: emails.length,
                },
                priority: jobPriority,
            };

            const jobInfo = await addBulkEmailJob(jobData);
            
            return {
                success: true,
                jobId: jobInfo.jobId,
                queueName: jobInfo.queueName,
                emailCount: jobInfo.emailCount,
                estimatedDuration: jobInfo.estimatedDuration,
                seriesId,
                message: `${emails.length} emails queued for processing`,
            };
        }

        // Single email job
        const emailData = {
            to: Array.isArray(to) ? to[0] : to,
            subject,
            html: htmlContent,
            metadata: {
                ...metadata,
                jobType,
                seriesId,
                queuedAt: new Date(),
            },
        };

        const job = await emailQueue.add(JOB_TYPES.SEND_SINGLE_EMAIL, emailData, {
            priority: jobPriority,
            delay,
        });
        
        return {
            success: true,
            jobId: job.id,
            queueName: emailQueue.name,
            seriesId,
            message: 'Email queued for processing',
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Send a single email directly (used only by job processors)
 * @param {String|Array} to - Email address or array of addresses
 * @param {String} subject - Email subject
 * @param {String} htmlContent - Email HTML content
 * @returns {Promise<Boolean>} Success status
 */
const sendEmailDirect = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: config.GMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        return false;
    }
};



/**
 * Test email configuration
 * @returns {Promise<Boolean>} Configuration test result
 */
const testEmailConfig = async () => {
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = {
    sendEmail,           // Universal queue-based email sending (single function for all needs)
    sendEmailDirect,     // Direct sending (used by job processors only)
    testEmailConfig,     // Test configuration
};