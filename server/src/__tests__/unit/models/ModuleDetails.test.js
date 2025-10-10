const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ModuleDetails = require('../../../models/ModuleDetails');
const User = require('../../../models/User');

describe('ModuleDetails Model', () => {
  let testUser1, testUser2;
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
    // Clear collections before each test
    await ModuleDetails.deleteMany({});
    await User.deleteMany({});

    // Create test users
    testUser1 = new User({
      name: 'Dr. Smith',
      email: 'smith@example.com',
      role: 'lecturer',
      displayName: 'Dr. John Smith',
      userGroup: new mongoose.Types.ObjectId()
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Dr. Brown',
      email: 'brown@example.com',
      role: 'lecturer',
      displayName: 'Dr. Jane Brown',
      userGroup: new mongoose.Types.ObjectId()
    });
    await testUser2.save();
  });

  describe('ModuleDetails Schema Validation', () => {
    test('should create a valid module with required fields', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        requiredTAHours: 40,
        openForUndergraduates: true,
        openForPostgraduates: false,
        userGroup: new mongoose.Types.ObjectId()
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule._id).toBeDefined();
      expect(savedModule.moduleCode).toBe(moduleData.moduleCode);
      expect(savedModule.moduleName).toBe(moduleData.moduleName);
      expect(savedModule.semester).toBe(moduleData.semester);
      expect(savedModule.coordinators).toEqual(moduleData.coordinators);
      expect(savedModule.applicationDueDate).toEqual(moduleData.applicationDueDate);
      expect(savedModule.documentDueDate).toEqual(moduleData.documentDueDate);
      expect(savedModule.requiredTAHours).toBe(moduleData.requiredTAHours);
      expect(savedModule.openForUndergraduates).toBe(moduleData.openForUndergraduates);
      expect(savedModule.openForPostgraduates).toBe(moduleData.openForPostgraduates);
    });

    test('should require recruitmentSeriesId', async () => {
      const moduleData = {
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should require moduleCode', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should require moduleName', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should require semester', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should require applicationDueDate', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should require documentDueDate', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.requiredTAHours).toBe(0);
      expect(savedModule.openForUndergraduates).toBe(true);
      expect(savedModule.openForPostgraduates).toBe(false);
      expect(savedModule.moduleStatus).toBe('initialised');
      expect(savedModule.requirements).toBe('');
      expect(savedModule.undergraduateCounts).toBeDefined();
      expect(savedModule.postgraduateCounts).toBeDefined();
    });

    test('should validate moduleStatus enum values', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false,
        moduleStatus: 'invalid-status'
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should validate requiredTAHours minimum value', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false,
        requiredTAHours: -10
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should allow multiple coordinators', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id, testUser2._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.coordinators).toHaveLength(2);
      expect(savedModule.coordinators).toContain(testUser1._id);
      expect(savedModule.coordinators).toContain(testUser2._id);
    });
  });

  describe('Pre-validation Hook', () => {
    test('should validate that all coordinators are lecturers', async () => {
      // Create a non-lecturer user
      const nonLecturer = new User({
        name: 'John Student',
        email: 'student@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      });
      await nonLecturer.save();

      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id, nonLecturer._id], // Mix of lecturer and non-lecturer
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });

    test('should allow empty coordinators array', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.coordinators).toHaveLength(0);
    });
  });

  describe('Count Objects', () => {
    test('should initialize undergraduateCounts with default values', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.undergraduateCounts.required).toBe(0);
      expect(savedModule.undergraduateCounts.remaining).toBe(0);
      expect(savedModule.undergraduateCounts.applied).toBe(0);
      expect(savedModule.undergraduateCounts.reviewed).toBe(0);
      expect(savedModule.undergraduateCounts.accepted).toBe(0);
      expect(savedModule.undergraduateCounts.docSubmitted).toBe(0);
      expect(savedModule.undergraduateCounts.appointed).toBe(0);
    });

    test('should initialize postgraduateCounts with default values', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.postgraduateCounts.required).toBe(0);
      expect(savedModule.postgraduateCounts.remaining).toBe(0);
      expect(savedModule.postgraduateCounts.applied).toBe(0);
      expect(savedModule.postgraduateCounts.reviewed).toBe(0);
      expect(savedModule.postgraduateCounts.accepted).toBe(0);
      expect(savedModule.postgraduateCounts.docSubmitted).toBe(0);
      expect(savedModule.postgraduateCounts.appointed).toBe(0);
    });

    test('should validate count minimum values', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false,
        undergraduateCounts: {
          required: -1, // Invalid negative value
          remaining: 0,
          applied: 0,
          reviewed: 0,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0
        }
      };

      const module = new ModuleDetails(moduleData);
      await expect(module.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add timestamps', async () => {
      const moduleData = {
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        coordinators: [testUser1._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      };

      const module = new ModuleDetails(moduleData);
      const savedModule = await module.save();

      expect(savedModule.createdAt).toBeDefined();
      expect(savedModule.updatedAt).toBeDefined();
    });
  });
});
