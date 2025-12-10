const nodemailer = require("nodemailer");
import type { Transporter } from "nodemailer";
const config = require("../config/index");

/**
 * Direct Email Service with Chunk Processing
 * Optimized for better performance with bulk email sending
 */

const transporter: Transporter = nodemailer.createTransport({
  service: "Gmail",
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
const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  from: string = "TA Appointment System - CSE"
): Promise<boolean> => {
  try {
    // Handle both single email and array of emails
    const recipients = Array.isArray(to) ? to.join(", ") : to;

    const mailOptions = {
      from: `${from} <${config.GMAIL_USER}>`,
      to: recipients,
      subject,
      html, // This ensures HTML content is rendered
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Email sent to ${Array.isArray(to) ? to.length + " recipients" : to}: ${result.messageId}`
    );
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to send email to ${Array.isArray(to) ? to.length + " recipients" : to}:`,
      errorMessage
    );
    return false;
  }
};

module.exports = { sendEmail };