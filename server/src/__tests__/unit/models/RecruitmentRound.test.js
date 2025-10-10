const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const RecruitmentRound = require('../../../models/RecruitmentRound');

describe('RecruitmentRound Model', () => {
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
    // Clear the recruitment rounds collection before each test
    await RecruitmentRound.deleteMany({});
  });

  describe('RecruitmentRound Schema Validation', () => {
    test('should create a valid recruitment round with required fields', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound._id).toBeDefined();
      expect(savedRound.name).toBe(roundData.name);
      expect(savedRound.applicationDueDate).toEqual(roundData.applicationDueDate);
      expect(savedRound.documentDueDate).toEqual(roundData.documentDueDate);
      expect(savedRound.undergradHourLimit).toBe(roundData.undergradHourLimit);
      expect(savedRound.postgradHourLimit).toBe(roundData.postgradHourLimit);
    });

    test('should require name field', async () => {
      const roundData = {
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should require applicationDueDate field', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should require documentDueDate field', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should require undergradHourLimit field', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should require postgradHourLimit field', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.status).toBe('initialised');
      expect(savedRound.moduleCount).toBe(0);
      expect(savedRound.undergraduateTAPositionsCount).toBe(0);
      expect(savedRound.postgraduateTAPositionsCount).toBe(0);
      expect(savedRound.undergradMailingList).toEqual([]);
      expect(savedRound.postgradMailingList).toEqual([]);
    });

    test('should validate status enum values', async () => {
      const validStatuses = ['initialised', 'active', 'archived'];
      
      for (const status of validStatuses) {
        const roundData = {
          name: 'Fall 2024 TA Recruitment',
          applicationDueDate: new Date('2024-12-31'),
          documentDueDate: new Date('2025-01-15'),
          undergradHourLimit: 20,
          postgradHourLimit: 30,
          status: status
        };

        const round = new RecruitmentRound(roundData);
        const savedRound = await round.save();
        expect(savedRound.status).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        status: 'invalid-status'
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should validate minimum values for hour limits', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: -10, // Invalid negative value
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should validate minimum values for counts', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        moduleCount: -5, // Invalid negative value
        undergraduateTAPositionsCount: -3,
        postgraduateTAPositionsCount: -2
      };

      const round = new RecruitmentRound(roundData);
      await expect(round.save()).rejects.toThrow();
    });

    test('should allow zero values for counts', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        moduleCount: 0,
        undergraduateTAPositionsCount: 0,
        postgraduateTAPositionsCount: 0
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.moduleCount).toBe(0);
      expect(savedRound.undergraduateTAPositionsCount).toBe(0);
      expect(savedRound.postgraduateTAPositionsCount).toBe(0);
    });
  });

  describe('Mailing Lists', () => {
    test('should handle empty mailing lists', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        undergradMailingList: [],
        postgradMailingList: []
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.undergradMailingList).toEqual([]);
      expect(savedRound.postgradMailingList).toEqual([]);
    });

    test('should handle mailing lists with ObjectIds', async () => {
      const userGroupId1 = new mongoose.Types.ObjectId();
      const userGroupId2 = new mongoose.Types.ObjectId();

      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        undergradMailingList: [userGroupId1],
        postgradMailingList: [userGroupId2]
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.undergradMailingList).toContain(userGroupId1);
      expect(savedRound.postgradMailingList).toContain(userGroupId2);
    });

    test('should handle multiple mailing list entries', async () => {
      const userGroupIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        undergradMailingList: userGroupIds
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.undergradMailingList).toHaveLength(3);
      expect(savedRound.undergradMailingList).toEqual(expect.arrayContaining(userGroupIds));
    });
  });

  describe('String Trimming', () => {
    test('should trim name field', async () => {
      const roundData = {
        name: '  Fall 2024 TA Recruitment  ',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      const savedRound = await round.save();

      expect(savedRound.name).toBe('Fall 2024 TA Recruitment');
    });
  });

  describe('Collection Name', () => {
    test('should use correct collection name', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await round.save();

      // Check if the document exists in the correct collection
      const foundRound = await mongoose.connection.db.collection('recruitmentrounds').findOne({
        _id: round._id
      });

      expect(foundRound).toBeDefined();
    });
  });

  describe('Model Methods', () => {
    test('should find recruitment rounds by name', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await round.save();

      const foundRound = await RecruitmentRound.findOne({ name: 'Fall 2024 TA Recruitment' });
      expect(foundRound).toBeDefined();
      expect(foundRound.name).toBe('Fall 2024 TA Recruitment');
    });

    test('should find recruitment rounds by status', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30,
        status: 'active'
      };

      const round = new RecruitmentRound(roundData);
      await round.save();

      const foundRounds = await RecruitmentRound.find({ status: 'active' });
      expect(foundRounds).toHaveLength(1);
      expect(foundRounds[0].status).toBe('active');
    });

    test('should update recruitment round data', async () => {
      const roundData = {
        name: 'Fall 2024 TA Recruitment',
        applicationDueDate: new Date('2024-12-31'),
        documentDueDate: new Date('2025-01-15'),
        undergradHourLimit: 20,
        postgradHourLimit: 30
      };

      const round = new RecruitmentRound(roundData);
      await round.save();

      round.status = 'active';
      round.moduleCount = 5;
      const updatedRound = await round.save();

      expect(updatedRound.status).toBe('active');
      expect(updatedRound.moduleCount).toBe(5);
    });
  });
});
