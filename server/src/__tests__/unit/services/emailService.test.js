// Mock nodemailer before importing emailService
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail,
  verify: mockVerify
}));

jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport
}));

// Mock config
jest.mock('../../../config', () => ({
  GMAIL_USER: 'taappointmentsystem.cse@gmail.com',
  GMAIL_PASS: 'test-password'
}));

const emailService = require('../../../services/emailService');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail function', () => {
    test('should send email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await emailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<h1>Test HTML Content</h1>'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'taappointmentsystem.cse@gmail.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML Content</h1>'
      });
      expect(consoleSpy).toHaveBeenCalledWith('✅ Email sent to test@example.com: test-message-id');
      expect(result).toEqual({
        type: 'single',
        success: true,
        recipient: 'test@example.com',
        sentAt: expect.any(Date)
      });
      consoleSpy.mockRestore();
    });

    test('should return false when email sending fails', async () => {
      const error = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await emailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<h1>Test HTML Content</h1>'
      );

      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to send email to test@example.com:', 'SMTP connection failed');
      expect(result).toEqual({
        type: 'single',
        success: false,
        recipient: 'test@example.com',
        sentAt: expect.any(Date)
      });
      consoleSpy.mockRestore();
    });

    test('should handle different email addresses', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await emailService.sendEmail(
        'different@example.com',
        'Different Subject',
        '<p>Different content</p>'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'taappointmentsystem.cse@gmail.com',
        to: 'different@example.com',
        subject: 'Different Subject',
        html: '<p>Different content</p>'
      });
    });

    test('should handle empty HTML content', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await emailService.sendEmail(
        'test@example.com',
        'Empty Content Subject',
        ''
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'taappointmentsystem.cse@gmail.com',
        to: 'test@example.com',
        subject: 'Empty Content Subject',
        html: ''
      });
    });

    test('should handle special characters in subject and content', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await emailService.sendEmail(
        'test@example.com',
        'Subject with émojis 🚀 and special chars: @#$%',
        '<h1>Content with émojis 🎉 and special chars: @#$%</h1>'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'taappointmentsystem.cse@gmail.com',
        to: 'test@example.com',
        subject: 'Subject with émojis 🚀 and special chars: @#$%',
        html: '<h1>Content with émojis 🎉 and special chars: @#$%</h1>'
      });
    });

    test('should handle multiple recipients', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await emailService.sendEmail(
        'user1@example.com,user2@example.com',
        'Multiple Recipients',
        '<p>Email to multiple recipients</p>'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'taappointmentsystem.cse@gmail.com',
        to: 'user1@example.com,user2@example.com',
        subject: 'Multiple Recipients',
        html: '<p>Email to multiple recipients</p>'
      });
    });

    test('should not throw error when sendMail fails', async () => {
      const error = new Error('Network error');
      mockSendMail.mockRejectedValueOnce(error);

      const result = await emailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<h1>Test Content</h1>'
      );

      expect(result).toEqual({
        type: 'single',
        success: false,
        recipient: 'test@example.com',
        sentAt: expect.any(Date)
      });
    });
  });

  describe('Module Exports', () => {
    test('should export all required functions', () => {
      expect(emailService).toHaveProperty('sendEmail');
      expect(emailService).toHaveProperty('sendSingleEmail');
      expect(emailService).toHaveProperty('sendEmailsInChunks');
      expect(emailService).toHaveProperty('sendNotificationEmails');
      expect(emailService).toHaveProperty('sendAdvertisementEmails');
      expect(emailService).toHaveProperty('testEmailService');
    });

    test('should export functions with correct types', () => {
      expect(typeof emailService.sendEmail).toBe('function');
      expect(typeof emailService.sendSingleEmail).toBe('function');
      expect(typeof emailService.sendEmailsInChunks).toBe('function');
      expect(typeof emailService.sendNotificationEmails).toBe('function');
      expect(typeof emailService.sendAdvertisementEmails).toBe('function');
      expect(typeof emailService.testEmailService).toBe('function');
    });

    test('should be async functions', () => {
      expect(emailService.sendEmail.constructor.name).toBe('AsyncFunction');
      expect(emailService.sendSingleEmail.constructor.name).toBe('AsyncFunction');
      expect(emailService.sendEmailsInChunks.constructor.name).toBe('AsyncFunction');
    });
  });
});