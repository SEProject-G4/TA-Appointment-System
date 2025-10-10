const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TaDocumentSubmission = require('../../../models/TaDocumentSubmission');

describe('TaDocumentSubmission Model', () => {
  let mongoServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
  }, 30000); // 30 second timeout for the entire beforeAll

  afterAll(async () => {
    // Clean up and close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000); // 30 second timeout for the entire afterAll

  beforeEach(async () => {
    // Clear the document submissions collection before each test
    await TaDocumentSubmission.deleteMany({});
  });

  describe('TaDocumentSubmission Schema Validation', () => {
    test('should create a valid document submission with required fields', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John Doe',
        address: '123 Main St, City',
        nicNumber: '123456789V',
        bank: 'Commercial Bank',
        branch: 'Main Branch',
        accountNumber: '1234567890'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission._id).toBeDefined();
      expect(savedSubmission.userId).toBe(submissionData.userId);
      expect(savedSubmission.nameAsInBankAccount).toBe(submissionData.nameAsInBankAccount);
      expect(savedSubmission.address).toBe(submissionData.address);
      expect(savedSubmission.nicNumber).toBe(submissionData.nicNumber);
      expect(savedSubmission.bank).toBe(submissionData.bank);
      expect(savedSubmission.branch).toBe(submissionData.branch);
      expect(savedSubmission.accountNumber).toBe(submissionData.accountNumber);
    });

    test('should require userId field', async () => {
      const submissionData = {
        nameAsInBankAccount: 'John Doe',
        address: '123 Main St, City'
      };

      const submission = new TaDocumentSubmission(submissionData);
      await expect(submission.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const submissionData = {
        userId: 'user123'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.status).toBe('pending');
      expect(savedSubmission.documents.bankPassbookCopy).toBeNull();
      expect(savedSubmission.documents.nicCopy).toBeNull();
      expect(savedSubmission.documents.cv).toBeNull();
      expect(savedSubmission.documents.degreeCertificate).toBeNull();
    });

    test('should validate status enum values', async () => {
      const validStatuses = ['pending', 'submitted'];
      
      for (const status of validStatuses) {
        const submissionData = {
          userId: 'user123',
          status: status
        };

        const submission = new TaDocumentSubmission(submissionData);
        const savedSubmission = await submission.save();
        expect(savedSubmission.status).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const submissionData = {
        userId: 'user123',
        status: 'invalid-status'
      };

      const submission = new TaDocumentSubmission(submissionData);
      await expect(submission.save()).rejects.toThrow();
    });
  });

  describe('File Metadata Schema', () => {
    test('should handle file metadata with all fields', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: {
            submitted: true,
            fileUrl: 'https://example.com/bank-passbook.pdf',
            fileName: 'bank-passbook.pdf',
            uploadedAt: new Date()
          }
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(true);
      expect(savedSubmission.documents.bankPassbookCopy.fileUrl).toBe('https://example.com/bank-passbook.pdf');
      expect(savedSubmission.documents.bankPassbookCopy.fileName).toBe('bank-passbook.pdf');
      expect(savedSubmission.documents.bankPassbookCopy.uploadedAt).toBeDefined();
    });

    test('should handle file metadata with default values', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: {
            submitted: false
          }
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(false);
      expect(savedSubmission.documents.bankPassbookCopy.fileUrl).toBeUndefined();
      expect(savedSubmission.documents.bankPassbookCopy.fileName).toBeUndefined();
      expect(savedSubmission.documents.bankPassbookCopy.uploadedAt).toBeUndefined();
    });
  });

  describe('File Input Normalization', () => {
    test('should normalize string input to file metadata object', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: 'https://example.com/file.pdf'
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(true);
      expect(savedSubmission.documents.bankPassbookCopy.fileUrl).toBe('https://example.com/file.pdf');
    });

    test('should handle object input as file metadata', async () => {
      const fileMeta = {
        submitted: true,
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'document.pdf'
      };

      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: fileMeta
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(fileMeta.submitted);
      expect(savedSubmission.documents.bankPassbookCopy.fileUrl).toBe(fileMeta.fileUrl);
      expect(savedSubmission.documents.bankPassbookCopy.fileName).toBe(fileMeta.fileName);
    });

    test('should handle null/undefined input', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: null,
          nicCopy: undefined
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy).toBeNull();
      expect(savedSubmission.documents.nicCopy).toBeNull();
    });

    test('should handle invalid input types', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: 123, // Invalid type
          nicCopy: true // Invalid type
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy).toBeNull();
      expect(savedSubmission.documents.nicCopy).toBeNull();
    });
  });

  describe('Document Types', () => {
    test('should handle all document types', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: {
            submitted: true,
            fileUrl: 'https://example.com/bank.pdf',
            fileName: 'bank.pdf'
          },
          nicCopy: {
            submitted: true,
            fileUrl: 'https://example.com/nic.pdf',
            fileName: 'nic.pdf'
          },
          cv: {
            submitted: true,
            fileUrl: 'https://example.com/cv.pdf',
            fileName: 'cv.pdf'
          },
          degreeCertificate: {
            submitted: true,
            fileUrl: 'https://example.com/degree.pdf',
            fileName: 'degree.pdf'
          }
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(true);
      expect(savedSubmission.documents.nicCopy.submitted).toBe(true);
      expect(savedSubmission.documents.cv.submitted).toBe(true);
      expect(savedSubmission.documents.degreeCertificate.submitted).toBe(true);
    });

    test('should handle mixed document submission status', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: {
            submitted: true,
            fileUrl: 'https://example.com/bank.pdf'
          },
          nicCopy: {
            submitted: false
          },
          cv: {
            submitted: true,
            fileUrl: 'https://example.com/cv.pdf'
          },
          degreeCertificate: null
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.documents.bankPassbookCopy.submitted).toBe(true);
      expect(savedSubmission.documents.nicCopy.submitted).toBe(false);
      expect(savedSubmission.documents.cv.submitted).toBe(true);
      expect(savedSubmission.documents.degreeCertificate).toBeNull();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add timestamps', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John Doe'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.createdAt).toBeDefined();
      expect(savedSubmission.updatedAt).toBeDefined();
    });

    test('should update updatedAt when document is modified', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John Doe'
      };

      const submission = new TaDocumentSubmission(submissionData);
      await submission.save();

      const originalUpdatedAt = submission.updatedAt;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      submission.status = 'submitted';
      await submission.save();

      expect(submission.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Model Methods', () => {
    test('should find document submissions by userId', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John Doe'
      };

      const submission = new TaDocumentSubmission(submissionData);
      await submission.save();

      const foundSubmissions = await TaDocumentSubmission.find({ userId: 'user123' });
      expect(foundSubmissions).toHaveLength(1);
      expect(foundSubmissions[0].userId).toBe('user123');
    });

    test('should find document submissions by status', async () => {
      const submissionData1 = {
        userId: 'user123',
        status: 'pending'
      };

      const submissionData2 = {
        userId: 'user456',
        status: 'submitted'
      };

      const submission1 = new TaDocumentSubmission(submissionData1);
      const submission2 = new TaDocumentSubmission(submissionData2);
      
      await submission1.save();
      await submission2.save();

      const pendingSubmissions = await TaDocumentSubmission.find({ status: 'pending' });
      const submittedSubmissions = await TaDocumentSubmission.find({ status: 'submitted' });

      expect(pendingSubmissions).toHaveLength(1);
      expect(submittedSubmissions).toHaveLength(1);
    });

    test('should update document submission data', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John Doe',
        status: 'pending'
      };

      const submission = new TaDocumentSubmission(submissionData);
      await submission.save();

      submission.status = 'submitted';
      submission.documents.bankPassbookCopy = {
        submitted: true,
        fileUrl: 'https://example.com/bank.pdf'
      };
      const updatedSubmission = await submission.save();

      expect(updatedSubmission.status).toBe('submitted');
      expect(updatedSubmission.documents.bankPassbookCopy.submitted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long string values', async () => {
      const longString = 'A'.repeat(1000);
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: longString,
        address: longString,
        nicNumber: longString,
        bank: longString,
        branch: longString,
        accountNumber: longString
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.nameAsInBankAccount).toBe(longString);
      expect(savedSubmission.address).toBe(longString);
    });

    test('should handle special characters in string fields', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: 'John O\'Connor-Smith',
        address: '123 Main St., Apt. #4B, New York, NY 10001',
        nicNumber: '123456789V',
        bank: 'Commercial Bank of Ceylon PLC',
        branch: 'Main Branch (Colombo 01)',
        accountNumber: '123-456-789-0'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.nameAsInBankAccount).toBe(submissionData.nameAsInBankAccount);
      expect(savedSubmission.address).toBe(submissionData.address);
    });

    test('should handle empty string values', async () => {
      const submissionData = {
        userId: 'user123',
        nameAsInBankAccount: '',
        address: '',
        nicNumber: '',
        bank: '',
        branch: '',
        accountNumber: ''
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(savedSubmission.nameAsInBankAccount).toBe('');
      expect(savedSubmission.address).toBe('');
    });
  });

  describe('Data Types', () => {
    test('should store userId as string', async () => {
      const submissionData = {
        userId: 'user123'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(typeof savedSubmission.userId).toBe('string');
    });

    test('should store status as string', async () => {
      const submissionData = {
        userId: 'user123',
        status: 'pending'
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(typeof savedSubmission.status).toBe('string');
    });

    test('should store file metadata as objects', async () => {
      const submissionData = {
        userId: 'user123',
        documents: {
          bankPassbookCopy: {
            submitted: true,
            fileUrl: 'https://example.com/file.pdf'
          }
        }
      };

      const submission = new TaDocumentSubmission(submissionData);
      const savedSubmission = await submission.save();

      expect(typeof savedSubmission.documents.bankPassbookCopy).toBe('object');
      expect(typeof savedSubmission.documents.bankPassbookCopy.submitted).toBe('boolean');
      expect(typeof savedSubmission.documents.bankPassbookCopy.fileUrl).toBe('string');
    });
  });
});
