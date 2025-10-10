const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TaApplication = require('../../../models/TaApplication');
const User = require('../../../models/User');
const ModuleDetails = require('../../../models/ModuleDetails');

describe('TaApplication Model', () => {
  let testUser, testModule, testLecturer;
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
    await TaApplication.deleteMany({});
    await User.deleteMany({});
    await ModuleDetails.deleteMany({});

    // Create test user
    testUser = new User({
      name: 'John Student',
      email: 'student@example.com',
      role: 'undergraduate',
      indexNumber: '123456',
      userGroup: new mongoose.Types.ObjectId()
    });
    await testUser.save();

    // Create test lecturer for coordinators
    testLecturer = new User({
      name: 'Dr. Smith',
      email: 'smith@example.com',
      role: 'lecturer',
      displayName: 'Dr. John Smith',
      userGroup: new mongoose.Types.ObjectId()
    });
    await testLecturer.save();

    // Create test module with valid lecturer coordinator
    testModule = new ModuleDetails({
      recruitmentSeriesId: new mongoose.Types.ObjectId(),
      moduleCode: 'CS101',
      moduleName: 'Introduction to Programming',
      semester: 1,
      coordinators: [testLecturer._id],
      applicationDueDate: new Date('2024-12-31'),
      documentDueDate: new Date('2025-01-15'),
      openForUndergraduates: true,
      openForPostgraduates: false
    });
    await testModule.save();
  });

  describe('TaApplication Schema Validation', () => {
    test('should create a valid TA application with required fields', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication._id).toBeDefined();
      expect(savedApplication.userId).toEqual(testUser._id);
      expect(savedApplication.moduleId).toEqual(testModule._id);
      expect(savedApplication.status).toBe('pending');
    });

    test('should require userId field', async () => {
      const applicationData = {
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should require moduleId field', async () => {
      const applicationData = {
        userId: testUser._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should set default status to pending', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id
      };

      const application = new TaApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.status).toBe('pending');
    });

    test('should validate status enum values', async () => {
      const validStatuses = ['pending', 'accepted', 'rejected'];
      
      for (const status of validStatuses) {
        const applicationData = {
          userId: testUser._id,
          moduleId: testModule._id,
          status: status
        };

        const application = new TaApplication(applicationData);
        const savedApplication = await application.save();
        expect(savedApplication.status).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'invalid-status'
      };

      const application = new TaApplication(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should allow status to be updated', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await application.save();

      application.status = 'accepted';
      const updatedApplication = await application.save();

      expect(updatedApplication.status).toBe('accepted');
    });
  });

  describe('ObjectId References', () => {
    test('should store valid ObjectId for userId', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.userId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedApplication.userId.toString()).toBe(testUser._id.toString());
    });

    test('should store valid ObjectId for moduleId', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.moduleId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedApplication.moduleId.toString()).toBe(testModule._id.toString());
    });

    test('should reject invalid ObjectId for userId', async () => {
      const applicationData = {
        userId: 'invalid-object-id',
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should reject invalid ObjectId for moduleId', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: 'invalid-object-id',
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await expect(application.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add timestamps', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.createdAt).toBeDefined();
      expect(savedApplication.updatedAt).toBeDefined();
    });

    test('should update updatedAt when document is modified', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await application.save();

      const originalUpdatedAt = application.updatedAt;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      application.status = 'accepted';
      await application.save();

      expect(application.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Collection Name', () => {
    test('should use correct collection name', async () => {
      const applicationData = {
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      };

      const application = new TaApplication(applicationData);
      await application.save();

      // Check if the document exists in the correct collection
      const foundApplication = await mongoose.connection.db.collection('taapplications').findOne({
        _id: application._id
      });

      expect(foundApplication).toBeDefined();
    });
  });

  describe('Multiple Applications', () => {
    test('should allow multiple applications from same user to different modules', async () => {
      // Create another lecturer for the second module
      const testLecturer2 = new User({
        name: 'Dr. Brown',
        email: 'brown@example.com',
        role: 'lecturer',
        displayName: 'Dr. Jane Brown',
        userGroup: new mongoose.Types.ObjectId()
      });
      await testLecturer2.save();

      // Create another module
      const testModule2 = new ModuleDetails({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: 'CS102',
        moduleName: 'Data Structures',
        semester: 2,
        coordinators: [testLecturer2._id],
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        openForUndergraduates: true,
        openForPostgraduates: false
      });
      await testModule2.save();

      const application1 = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      });

      const application2 = new TaApplication({
        userId: testUser._id,
        moduleId: testModule2._id,
        status: 'accepted'
      });

      await application1.save();
      await application2.save();

      const applications = await TaApplication.find({ userId: testUser._id });
      expect(applications).toHaveLength(2);
    });

    test('should allow multiple applications from different users to same module', async () => {
      // Create another user
      const testUser2 = new User({
        name: 'Jane Student',
        email: 'jane@example.com',
        role: 'undergraduate',
        indexNumber: '789012',
        userGroup: new mongoose.Types.ObjectId()
      });
      await testUser2.save();

      const application1 = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      });

      const application2 = new TaApplication({
        userId: testUser2._id,
        moduleId: testModule._id,
        status: 'accepted'
      });

      await application1.save();
      await application2.save();

      const applications = await TaApplication.find({ moduleId: testModule._id });
      expect(applications).toHaveLength(2);
    });
  });

  describe('Model Methods', () => {
    test('should find applications by userId', async () => {
      const application = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      });
      await application.save();

      const foundApplications = await TaApplication.find({ userId: testUser._id });
      expect(foundApplications).toHaveLength(1);
      expect(foundApplications[0].userId.toString()).toBe(testUser._id.toString());
    });

    test('should find applications by moduleId', async () => {
      const application = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      });
      await application.save();

      const foundApplications = await TaApplication.find({ moduleId: testModule._id });
      expect(foundApplications).toHaveLength(1);
      expect(foundApplications[0].moduleId.toString()).toBe(testModule._id.toString());
    });

    test('should find applications by status', async () => {
      const application1 = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'pending'
      });
      await application1.save();

      const application2 = new TaApplication({
        userId: testUser._id,
        moduleId: testModule._id,
        status: 'accepted'
      });
      await application2.save();

      const pendingApplications = await TaApplication.find({ status: 'pending' });
      const acceptedApplications = await TaApplication.find({ status: 'accepted' });

      expect(pendingApplications).toHaveLength(1);
      expect(acceptedApplications).toHaveLength(1);
    });
  });
});
