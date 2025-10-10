const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../models/User');

describe('User Model', () => {
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
    // Clear the users collection before each test
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.indexNumber).toBe(userData.indexNumber);
      expect(savedUser.firstLogin).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
    });

    test('should require name field', async () => {
      const userData = {
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require email field', async () => {
      const userData = {
        name: 'John Doe',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should default role to undergraduate when not provided', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
        // role not provided
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('undergraduate');
    });

    test('should enforce unique email constraint', async () => {
      const userData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const userData2 = {
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
        role: 'postgraduate',
        indexNumber: '789012',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique indexNumber for students', async () => {
      const userData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const userData2 = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'undergraduate',
        indexNumber: '123456', // Same index number
        userGroup: new mongoose.Types.ObjectId()
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should require indexNumber for undergraduate role', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require indexNumber for postgraduate role', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'postgraduate',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should not require indexNumber for lecturer role', async () => {
      const userData = {
        name: 'Dr. Smith',
        email: 'smith@example.com',
        role: 'lecturer',
        displayName: 'Dr. John Smith',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser._id).toBeDefined();
    });

    test('should require displayName for lecturer role', async () => {
      const userData = {
        name: 'Dr. Smith',
        email: 'smith@example.com',
        role: 'lecturer',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require displayName for hod role', async () => {
      const userData = {
        name: 'Dr. Head',
        email: 'head@example.com',
        role: 'hod',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should validate role enum values', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'invalid-role',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.firstLogin).toBe(true);
      expect(savedUser.profilePicture).toBe('https://www.gravatar.com/avatar?d=mp');
      expect(savedUser.createdAt).toBeDefined();
    });

    test('should allow googleId to be unique and sparse', async () => {
      const userData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        googleId: 'google123',
        userGroup: new mongoose.Types.ObjectId()
      };

      const userData2 = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'undergraduate',
        indexNumber: '789012',
        googleId: 'google456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user1 = new User(userData1);
      const user2 = new User(userData2);
      
      await user1.save();
      await user2.save();

      expect(user1.googleId).toBe('google123');
      expect(user2.googleId).toBe('google456');
    });

    test('should enforce unique googleId when provided', async () => {
      const userData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        googleId: 'google123',
        userGroup: new mongoose.Types.ObjectId()
      };

      const userData2 = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'undergraduate',
        indexNumber: '789012',
        googleId: 'google123', // Same googleId
        userGroup: new mongoose.Types.ObjectId()
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Model Methods', () => {
    test('should save user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser).toBeDefined();
      expect(savedUser._id).toBeDefined();
    });

    test('should find user by email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ email: 'john@example.com' });
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('john@example.com');
    });

    test('should update user data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'undergraduate',
        indexNumber: '123456',
        userGroup: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      await user.save();

      user.name = 'John Updated';
      const updatedUser = await user.save();

      expect(updatedUser.name).toBe('John Updated');
    });
  });
});
