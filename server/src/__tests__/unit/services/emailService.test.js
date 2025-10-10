// Mock nodemailer before importing emailService
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail
}));

jest.doMock('nodemailer', () => ({
  createTransport: mockCreateTransport
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
        from: process.env.EMAIL_USER,
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML Content</h1>'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Email sent successfully');
      expect(result).toBe(true);
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

      expect(consoleSpy).toHaveBeenCalledWith('Error sending email:', error);
      expect(result).toBe(false);
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
        from: process.env.EMAIL_USER,
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
        from: process.env.EMAIL_USER,
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
        from: process.env.EMAIL_USER,
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
        from: process.env.EMAIL_USER,
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

      expect(result).toBe(false);
    });
  });

  describe('Module Exports', () => {
    test('should export sendEmail function', () => {
      expect(emailService).toHaveProperty('sendEmail');
      expect(typeof emailService.sendEmail).toBe('function');
    });

    test('should be an async function', () => {
      expect(emailService.sendEmail.constructor.name).toBe('AsyncFunction');
    });
  });
});