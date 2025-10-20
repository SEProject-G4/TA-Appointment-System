const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AppliedModules = require('../../../models/AppliedModules');
const User = require('../../../models/User');
const TaApplication = require('../../../models/TaApplication');

describe('AppliedModules Model', () => {
  let testUser, testTaApplication;
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
    await AppliedModules.deleteMany({});
    await User.deleteMany({});
    await TaApplication.deleteMany({});

    // Create test user
    testUser = new User({
      name: 'John Student',
      email: 'student@example.com',
      role: 'undergraduate',
      indexNumber: '123456',
      userGroup: new mongoose.Types.ObjectId()
    });
    await testUser.save();

    // Create test TA application
    testTaApplication = new TaApplication({
      userId: testUser._id,
      moduleId: new mongoose.Types.ObjectId(),
      status: 'pending'
    });
    await testTaApplication.save();
  });

  describe('AppliedModules Schema Validation', () => {
    test('should create a valid applied modules record with required fields', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules._id).toBeDefined();
      expect(savedAppliedModules.userId).toEqual(testUser._id);
      expect(savedAppliedModules.recSeriesId).toEqual(appliedModulesData.recSeriesId);
      expect(savedAppliedModules.availableHoursPerWeek).toBe(appliedModulesData.availableHoursPerWeek);
      expect(savedAppliedModules.appliedModules).toEqual(appliedModulesData.appliedModules);
    });

    test('should require userId field', async () => {
      const appliedModulesData = {
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });

    test('should require recSeriesId field', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });

    test('should require availableHoursPerWeek field', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });

    test('should default appliedModules to empty array when not provided', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20
        // appliedModules not provided
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.appliedModules).toEqual([]);
    });

    test('should set default values correctly', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.isDocSubmitted).toBe(false);
      expect(savedAppliedModules.Documents).toBeUndefined();
    });

    test('should validate minimum value for availableHoursPerWeek', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: -5, // Invalid negative value
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });

    test('should allow zero value for availableHoursPerWeek', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 0,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.availableHoursPerWeek).toBe(0);
    });

    test('should handle empty appliedModules array', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: []
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.appliedModules).toEqual([]);
    });

    test('should handle multiple applied modules', async () => {
      // Create another TA application
      const testTaApplication2 = new TaApplication({
        userId: testUser._id,
        moduleId: new mongoose.Types.ObjectId(),
        status: 'accepted'
      });
      await testTaApplication2.save();

      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id, testTaApplication2._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.appliedModules).toHaveLength(2);
      expect(savedAppliedModules.appliedModules).toContain(testTaApplication._id);
      expect(savedAppliedModules.appliedModules).toContain(testTaApplication2._id);
    });
  });

  describe('ObjectId References', () => {
    test('should store valid ObjectId for userId', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.userId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedAppliedModules.userId.toString()).toBe(testUser._id.toString());
    });

    test('should store valid ObjectId for recSeriesId', async () => {
      const recSeriesId = new mongoose.Types.ObjectId();
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: recSeriesId,
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.recSeriesId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedAppliedModules.recSeriesId.toString()).toBe(recSeriesId.toString());
    });

    test('should store valid ObjectIds for appliedModules', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.appliedModules[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedAppliedModules.appliedModules[0].toString()).toBe(testTaApplication._id.toString());
    });

    test('should reject invalid ObjectId for userId', async () => {
      const appliedModulesData = {
        userId: 'invalid-object-id',
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });

    test('should reject invalid ObjectId for recSeriesId', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: 'invalid-object-id',
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await expect(appliedModules.save()).rejects.toThrow();
    });
  });

  describe('Document Submission', () => {
    test('should handle document submission flag', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id],
        isDocSubmitted: true
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.isDocSubmitted).toBe(true);
    });

    test('should handle document reference', async () => {
      const documentId = new mongoose.Types.ObjectId();
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id],
        Documents: documentId
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.Documents).toEqual(documentId);
    });
  });

  describe('Collection Name', () => {
    test('should use correct collection name', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await appliedModules.save();

      // Check if the document exists in the correct collection
      const foundAppliedModules = await mongoose.connection.db.collection('appliedmodules').findOne({
        _id: appliedModules._id
      });

      expect(foundAppliedModules).toBeDefined();
    });
  });

  describe('Model Methods', () => {
    test('should find applied modules by userId', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await appliedModules.save();

      const foundAppliedModules = await AppliedModules.find({ userId: testUser._id });
      expect(foundAppliedModules).toHaveLength(1);
      expect(foundAppliedModules[0].userId.toString()).toBe(testUser._id.toString());
    });

    test('should find applied modules by recSeriesId', async () => {
      const recSeriesId = new mongoose.Types.ObjectId();
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: recSeriesId,
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await appliedModules.save();

      const foundAppliedModules = await AppliedModules.find({ recSeriesId: recSeriesId });
      expect(foundAppliedModules).toHaveLength(1);
      expect(foundAppliedModules[0].recSeriesId.toString()).toBe(recSeriesId.toString());
    });

    test('should find applied modules by document submission status', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id],
        isDocSubmitted: true
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await appliedModules.save();

      const foundAppliedModules = await AppliedModules.find({ isDocSubmitted: true });
      expect(foundAppliedModules).toHaveLength(1);
      expect(foundAppliedModules[0].isDocSubmitted).toBe(true);
    });

    test('should update applied modules data', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 20,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      await appliedModules.save();

      appliedModules.availableHoursPerWeek = 25;
      appliedModules.isDocSubmitted = true;
      const updatedAppliedModules = await appliedModules.save();

      expect(updatedAppliedModules.availableHoursPerWeek).toBe(25);
      expect(updatedAppliedModules.isDocSubmitted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large availableHoursPerWeek values', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 168, // 24 * 7 hours per week
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.availableHoursPerWeek).toBe(168);
    });

    test('should handle decimal availableHoursPerWeek values', async () => {
      const appliedModulesData = {
        userId: testUser._id,
        recSeriesId: new mongoose.Types.ObjectId(),
        availableHoursPerWeek: 15.5,
        appliedModules: [testTaApplication._id]
      };

      const appliedModules = new AppliedModules(appliedModulesData);
      const savedAppliedModules = await appliedModules.save();

      expect(savedAppliedModules.availableHoursPerWeek).toBe(15.5);
    });
  });
});
