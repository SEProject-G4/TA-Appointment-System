const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserGroup = require('../../../models/UserGroup');

describe('UserGroup Model', () => {
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
    // Clear the user groups collection before each test
    await UserGroup.deleteMany({});
  });

  describe('UserGroup Schema Validation', () => {
    test('should create a valid user group with required fields', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup._id).toBeDefined();
      expect(savedGroup.name).toBe(groupData.name);
      expect(savedGroup.groupType).toBe(groupData.groupType);
    });

    test('should require name field', async () => {
      const groupData = {
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    test('should require groupType field', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates'
      };

      const group = new UserGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.userCount).toBe(0);
    });

    test('should validate groupType enum values', async () => {
      const validGroupTypes = [
        'undergraduate',
        'postgraduate',
        'lecturer',
        'hod',
        'cse-office',
        'admin'
      ];
      
      for (const groupType of validGroupTypes) {
        const groupData = {
          name: `Test ${groupType} Group`,
          groupType: groupType
        };

        const group = new UserGroup(groupData);
        const savedGroup = await group.save();
        expect(savedGroup.groupType).toBe(groupType);
      }
    });

    test('should reject invalid groupType values', async () => {
      const groupData = {
        name: 'Invalid Group',
        groupType: 'invalid-type'
      };

      const group = new UserGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    test('should allow custom userCount values', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate',
        userCount: 150
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.userCount).toBe(150);
    });

    test('should allow zero userCount', async () => {
      const groupData = {
        name: 'Empty Group',
        groupType: 'undergraduate',
        userCount: 0
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.userCount).toBe(0);
    });
  });

  describe('Unique Index Constraint', () => {
    test('should enforce unique constraint on name and groupType combination', async () => {
      const groupData1 = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const groupData2 = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate' // Same name and groupType
      };

      const group1 = new UserGroup(groupData1);
      await group1.save();

      const group2 = new UserGroup(groupData2);
      await expect(group2.save()).rejects.toThrow();
    });

    test('should allow same name with different groupType', async () => {
      const groupData1 = {
        name: 'Computer Science Group',
        groupType: 'undergraduate'
      };

      const groupData2 = {
        name: 'Computer Science Group',
        groupType: 'postgraduate' // Different groupType
      };

      const group1 = new UserGroup(groupData1);
      const group2 = new UserGroup(groupData2);
      
      await group1.save();
      await group2.save();

      expect(group1._id).toBeDefined();
      expect(group2._id).toBeDefined();
    });

    test('should allow same groupType with different name', async () => {
      const groupData1 = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const groupData2 = {
        name: 'Mathematics Undergraduates',
        groupType: 'undergraduate' // Same groupType, different name
      };

      const group1 = new UserGroup(groupData1);
      const group2 = new UserGroup(groupData2);
      
      await group1.save();
      await group2.save();

      expect(group1._id).toBeDefined();
      expect(group2._id).toBeDefined();
    });
  });

  describe('Model Methods', () => {
    test('should find user groups by name', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      await group.save();

      const foundGroup = await UserGroup.findOne({ name: 'Computer Science Undergraduates' });
      expect(foundGroup).toBeDefined();
      expect(foundGroup.name).toBe('Computer Science Undergraduates');
    });

    test('should find user groups by groupType', async () => {
      const groupData1 = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const groupData2 = {
        name: 'Mathematics Undergraduates',
        groupType: 'undergraduate'
      };

      const group1 = new UserGroup(groupData1);
      const group2 = new UserGroup(groupData2);
      
      await group1.save();
      await group2.save();

      const foundGroups = await UserGroup.find({ groupType: 'undergraduate' });
      expect(foundGroups).toHaveLength(2);
    });

    test('should find user groups by userCount range', async () => {
      const groupData1 = {
        name: 'Small Group',
        groupType: 'undergraduate',
        userCount: 10
      };

      const groupData2 = {
        name: 'Large Group',
        groupType: 'undergraduate',
        userCount: 200
      };

      const group1 = new UserGroup(groupData1);
      const group2 = new UserGroup(groupData2);
      
      await group1.save();
      await group2.save();

      const foundGroups = await UserGroup.find({ userCount: { $gte: 100 } });
      expect(foundGroups).toHaveLength(1);
      expect(foundGroups[0].name).toBe('Large Group');
    });

    test('should update user group data', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate',
        userCount: 50
      };

      const group = new UserGroup(groupData);
      await group.save();

      group.userCount = 75;
      const updatedGroup = await group.save();

      expect(updatedGroup.userCount).toBe(75);
    });

    test('should delete user groups', async () => {
      const groupData = {
        name: 'Computer Science Undergraduates',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      await group.save();

      await UserGroup.findByIdAndDelete(group._id);

      const foundGroup = await UserGroup.findById(group._id);
      expect(foundGroup).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long group names', async () => {
      const longName = 'A'.repeat(1000);
      const groupData = {
        name: longName,
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.name).toBe(longName);
    });

    test('should handle special characters in group names', async () => {
      const groupData = {
        name: 'Computer Science & Engineering (CSE) - Undergraduates 2024',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.name).toBe(groupData.name);
    });

    test('should handle empty string group names', async () => {
      const groupData = {
        name: '',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    test('should handle very large userCount values', async () => {
      const groupData = {
        name: 'Very Large Group',
        groupType: 'undergraduate',
        userCount: 999999
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.userCount).toBe(999999);
    });
  });

  describe('Index Validation', () => {
    test('should have compound index on name and groupType', async () => {
      // Test that the unique constraint works (which requires the index)
      // This is a more reliable way to test index functionality in in-memory MongoDB
      
      const groupData1 = {
        name: 'Test Group',
        groupType: 'undergraduate'
      };

      const groupData2 = {
        name: 'Test Group',
        groupType: 'undergraduate' // Same name and groupType should fail
      };

      const group1 = new UserGroup(groupData1);
      await group1.save();

      const group2 = new UserGroup(groupData2);
      
      // This should fail due to the unique compound index
      await expect(group2.save()).rejects.toThrow();
      
      // If we get here, the unique constraint (and therefore the index) is working
      expect(true).toBe(true);
    });
  });

  describe('Data Types', () => {
    test('should store name as string', async () => {
      const groupData = {
        name: 'Test Group',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.name).toBe('string');
    });

    test('should store groupType as string', async () => {
      const groupData = {
        name: 'Test Group',
        groupType: 'undergraduate'
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.groupType).toBe('string');
    });

    test('should store userCount as number', async () => {
      const groupData = {
        name: 'Test Group',
        groupType: 'undergraduate',
        userCount: 100
      };

      const group = new UserGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.userCount).toBe('number');
    });
  });
});
