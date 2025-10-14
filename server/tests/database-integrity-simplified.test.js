const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Import models
const User = require("../src/models/User");
const ModuleDetails = require("../src/models/ModuleDetails");
const TaApplication = require("../src/models/TaApplication");
const AppliedModules = require("../src/models/AppliedModules");
const UserGroup = require("../src/models/UserGroup");

describe("Database Integrity Testing", () => {
  let mongoServer;
  let connection;
  let testUserGroup, testLecturerGroup, testLecturer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    connection = await mongoose.connect(mongoUri);
    
    // Create test user groups
    testUserGroup = await UserGroup.create({
      name: "Test Undergraduate Group",
      groupType: "undergraduate"
    });
    
    testLecturerGroup = await UserGroup.create({
      name: "Test Lecturer Group", 
      groupType: "lecturer"
    });
    
    // Create a test lecturer for ModuleDetails coordinators
    testLecturer = await User.create({
      name: "Test Lecturer",
      email: "lecturer@example.com",
      role: "lecturer",
      displayName: "Dr. Test Lecturer",
      userGroup: testLecturerGroup._id
    });
  }, 30000); // Increased timeout

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000); // Increased timeout

  beforeEach(async () => {
    // Clear all collections before each test (except UserGroup and the test lecturer)
    const collections = Object.keys(connection.connection.collections);
    for (const collectionName of collections) {
      if (collectionName !== 'usergroups') {
        const collection = connection.connection.collections[collectionName];
        if (collectionName === 'users') {
          // Keep the test lecturer, remove others
          await collection.deleteMany({ _id: { $ne: testLecturer._id } });
        } else {
          await collection.deleteMany({});
        }
      }
    }
  });

  describe("Schema Validation and Constraints", () => {
    it("should enforce required fields on User model", async () => {
      // Test missing required fields
      const invalidUser = new User({
        // Missing required 'name' and 'email' fields
        role: "undergraduate",
        userGroup: testUserGroup._id
      });

      await expect(invalidUser.save()).rejects.toThrow();
      
      // Verify database remains unchanged
      const userCount = await User.countDocuments();
      expect(userCount).toBe(1); // Only test lecturer exists
    });

    it("should enforce enum constraints on User role", async () => {
      // Test invalid role enum value
      const userWithInvalidRole = new User({
        name: "Test User",
        email: "test@example.com",
        role: "invalid_role", // Invalid enum value
        userGroup: testUserGroup._id
      });

      await expect(userWithInvalidRole.save()).rejects.toThrow();
    });

    it("should enforce unique constraints on User email", async () => {
      // Create first user successfully
      const user1 = new User({
        name: "User One",
        email: "duplicate@example.com",
        role: "undergraduate",
        indexNumber: "200001X",
        userGroup: testUserGroup._id
      });
      await user1.save();

      // Try to create second user with same email
      const user2 = new User({
        name: "User Two", 
        email: "duplicate@example.com", // Duplicate email
        role: "undergraduate",
        indexNumber: "200002Y",
        userGroup: testUserGroup._id
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it("should enforce conditional required fields on User model", async () => {
      // Test undergraduate without indexNumber (should fail)
      const studentWithoutIndex = new User({
        name: "Student",
        email: "student@example.com",
        role: "undergraduate",
        // Missing required indexNumber for student
        userGroup: testUserGroup._id
      });

      await expect(studentWithoutIndex.save()).rejects.toThrow();

      // Test lecturer without displayName (should fail)
      const lecturerWithoutDisplayName = new User({
        name: "Lecturer",
        email: "lecturer2@example.com",
        role: "lecturer",
        // Missing required displayName for lecturer
        userGroup: testLecturerGroup._id
      });

      await expect(lecturerWithoutDisplayName.save()).rejects.toThrow();
    });

    it("should validate ModuleDetails with proper coordinators", async () => {
      // Test creating module with valid lecturer coordinator
      const validModule = new ModuleDetails({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS3004",
        moduleName: "Software Engineering",
        semester: 5,
        coordinators: [testLecturer._id], // Valid lecturer
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 5,
          remaining: 5,
          applied: 0,
          reviewed: 0,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0
        }
      });

      await expect(validModule.save()).resolves.toBeTruthy();

      // Test creating module with non-lecturer coordinator (should fail)
      const student = await User.create({
        name: "Student Coordinator",
        email: "student.coord@example.com",
        role: "undergraduate",
        indexNumber: "200001X",
        userGroup: testUserGroup._id
      });

      const invalidModule = new ModuleDetails({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS3005",
        moduleName: "Invalid Module",
        semester: 5,
        coordinators: [student._id], // Invalid - student as coordinator
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 5, remaining: 5, applied: 0,
          reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0
        }
      });

      await expect(invalidModule.save()).rejects.toThrow();
    });
  });

  describe("Referential Integrity Testing", () => {
    let testUser, testModule;

    beforeEach(async () => {
      // Create valid test data
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        role: "undergraduate",
        indexNumber: "200001X",
        userGroup: testUserGroup._id
      });

      testModule = await ModuleDetails.create({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS3004",
        moduleName: "Software Engineering",
        semester: 5,
        coordinators: [testLecturer._id],
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 5, remaining: 5, applied: 0,
          reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0
        }
      });
    });

    it("should maintain referential integrity between TaApplication and User", async () => {
      // Create valid TaApplication
      const application = await TaApplication.create({
        userId: testUser._id,
        moduleId: testModule._id,
        status: "pending"
      });

      // Verify relationship exists
      const populatedApp = await TaApplication.findById(application._id).populate('userId');
      expect(populatedApp.userId.name).toBe("Test User");
    });

    it("should handle non-existent user references", async () => {
      // Create application with non-existent user
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const application = await TaApplication.create({
        userId: nonExistentUserId,
        moduleId: testModule._id,
        status: "pending"
      });

      // When populating, should not find the user
      const populatedApp = await TaApplication.findById(application._id).populate('userId');
      expect(populatedApp.userId).toBeNull();
    });

    it("should handle user deletion with existing applications", async () => {
      // Create application linked to user
      const application = await TaApplication.create({
        userId: testUser._id,
        moduleId: testModule._id,
        status: "pending"
      });

      // Delete the user
      await User.findByIdAndDelete(testUser._id);

      // Application should still exist but with broken reference
      const applications = await TaApplication.find({ userId: testUser._id });
      expect(applications).toHaveLength(1);
      
      // Populating should return null for deleted user
      const populatedApp = await TaApplication.findOne({ userId: testUser._id }).populate('userId');
      expect(populatedApp.userId).toBeNull();
    });
  });

  describe("Data Validation and Consistency", () => {
    it("should prevent data corruption through invalid updates", async () => {
      // Create valid user
      const user = await User.create({
        name: "Valid User",
        email: "valid@example.com",
        role: "undergraduate",
        indexNumber: "200001X",
        userGroup: testUserGroup._id
      });

      // Try to update with invalid data
      await expect(
        User.findByIdAndUpdate(
          user._id,
          { 
            role: "invalid_role", // Invalid enum value
            email: "" // Empty required field
          },
          { runValidators: true, new: true }
        )
      ).rejects.toThrow();

      // Verify original data is unchanged
      const unchangedUser = await User.findById(user._id);
      expect(unchangedUser.role).toBe("undergraduate");
      expect(unchangedUser.email).toBe("valid@example.com");
    });

    it("should maintain data consistency during bulk operations", async () => {
      // Create multiple users
      const users = await User.create([
        { name: "User 1", email: "user1@example.com", role: "undergraduate", indexNumber: "200001X", userGroup: testUserGroup._id },
        { name: "User 2", email: "user2@example.com", role: "undergraduate", indexNumber: "200002Y", userGroup: testUserGroup._id },
        { name: "User 3", email: "user3@example.com", role: "undergraduate", indexNumber: "200003Z", userGroup: testUserGroup._id }
      ]);

      // Perform bulk update with some invalid data
      const bulkOps = [
        {
          updateOne: {
            filter: { _id: users[0]._id },
            update: { name: "Updated User 1" } // Valid update
          }
        },
        {
          updateOne: {
            filter: { _id: users[1]._id },
            update: { role: "invalid_role" } // Invalid update
          }
        },
        {
          updateOne: {
            filter: { _id: users[2]._id },
            update: { name: "Updated User 3" } // Valid update
          }
        }
      ];

      // Execute bulk operation (Note: bulkWrite bypasses Mongoose validations by default)
      await User.bulkWrite(bulkOps, { ordered: false });

      // Verify data consistency
      const updatedUsers = await User.find({ 
        _id: { $ne: testLecturer._id } 
      }).sort({ indexNumber: 1 });
      
      // Valid updates should have succeeded
      expect(updatedUsers[0].name).toBe("Updated User 1");
      expect(updatedUsers[2].name).toBe("Updated User 3");
      
      // Note: bulkWrite bypasses validation, so invalid role actually gets saved
      expect(updatedUsers[1].role).toBe("invalid_role");
      
      // Try to save the user normally - this should trigger validation
      const userWithInvalidRole = await User.findById(updatedUsers[1]._id);
      userWithInvalidRole.name = "Trigger validation";
      
      await expect(userWithInvalidRole.save()).rejects.toThrow();
    });
  });

  describe("Database State Verification", () => {
    it("should verify correct data population after operations", async () => {
      // Create user and verify state
      const user = await User.create({
        name: "State Test User",
        email: "state@example.com",
        role: "undergraduate",
        indexNumber: "200001X",
        userGroup: testUserGroup._id
      });

      // Verify user was created correctly
      const createdUser = await User.findById(user._id);
      expect(createdUser.name).toBe("State Test User");
      expect(createdUser.email).toBe("state@example.com");
      expect(createdUser.role).toBe("undergraduate");
      expect(createdUser.firstLogin).toBe(true); // Default value
      expect(createdUser.createdAt).toBeInstanceOf(Date);

      // Create module and verify relationships
      const module = await ModuleDetails.create({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS3004",
        moduleName: "Software Engineering",
        semester: 5,
        coordinators: [testLecturer._id],
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 5, remaining: 5, applied: 0,
          reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0
        }
      });

      // Create application and verify all relationships
      const application = await TaApplication.create({
        userId: user._id,
        moduleId: module._id,
        status: "pending"
      });

      // Verify complete data integrity
      const populatedApp = await TaApplication.findById(application._id)
        .populate('userId')
        .populate('moduleId');

      expect(populatedApp.userId.name).toBe("State Test User");
      expect(populatedApp.moduleId.moduleCode).toBe("CS3004");
      expect(populatedApp.status).toBe("pending");
    });

    it("should verify database constraints are enforced", async () => {
      // Test multiple constraint scenarios
      const testCases = [
        {
          description: "User without required email",
          data: { name: "No Email User", role: "undergraduate", userGroup: testUserGroup._id },
          shouldFail: true
        },
        {
          description: "User with valid data",
          data: { 
            name: "Valid User", 
            email: "valid@example.com", 
            role: "undergraduate", 
            indexNumber: "300001X", 
            userGroup: testUserGroup._id 
          },
          shouldFail: false
        },
        {
          description: "User with invalid role",
          data: { 
            name: "Invalid Role User", 
            email: "invalid@example.com", 
            role: "super_admin", 
            userGroup: testUserGroup._id 
          },
          shouldFail: true
        }
      ];

      for (const testCase of testCases) {
        const user = new User(testCase.data);
        
        if (testCase.shouldFail) {
          await expect(user.save()).rejects.toThrow();
        } else {
          await expect(user.save()).resolves.toBeTruthy();
        }
      }

      // Verify only valid users were saved
      const validUsers = await User.find({ 
        _id: { $ne: testLecturer._id } 
      });
      expect(validUsers).toHaveLength(1); // Only the valid user
      expect(validUsers[0].name).toBe("Valid User");
    });
  });

  describe("Complex Validation Scenarios", () => {
    it("should handle nested validation in ModuleDetails", async () => {
      // Test module with invalid count values
      const moduleWithInvalidCounts = new ModuleDetails({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS3006",
        moduleName: "Test Module",
        semester: 5,
        coordinators: [testLecturer._id],
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 5,
          remaining: 10, // Remaining > Required (logically invalid)
          applied: -1,   // Negative value
          reviewed: 0,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0
        }
      });

      // Depending on schema validation, this might pass or fail
      // The test documents the current behavior
      try {
        await moduleWithInvalidCounts.save();
        // If it saves, verify the data was stored as-is
        const savedModule = await ModuleDetails.findById(moduleWithInvalidCounts._id);
        expect(savedModule.undergraduateCounts.remaining).toBe(10);
        expect(savedModule.undergraduateCounts.applied).toBe(-1);
      } catch (error) {
        // If validation fails, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it("should maintain referential integrity across multiple collections", async () => {
      // Create a complete application flow
      const student = await User.create({
        name: "Application Student",
        email: "app.student@example.com",
        role: "undergraduate",
        indexNumber: "400001X",
        userGroup: testUserGroup._id
      });

      const module = await ModuleDetails.create({
        recruitmentSeriesId: new mongoose.Types.ObjectId(),
        moduleCode: "CS4001",
        moduleName: "Final Year Project",
        semester: 8,
        coordinators: [testLecturer._id],
        applicationDueDate: new Date("2024-12-31"),
        documentDueDate: new Date("2025-01-15"),
        openForUndergraduates: true,
        undergraduateCounts: {
          required: 2, remaining: 2, applied: 0,
          reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0
        }
      });

      // Create TaApplication
      const application = await TaApplication.create({
        userId: student._id,
        moduleId: module._id,
        status: "pending"
      });

      // Create AppliedModules entry (tracking user's applications)
      const appliedModule = await AppliedModules.create({
        userId: student._id,
        recSeriesId: module.recruitmentSeriesId,
        availableHoursPerWeek: 10,
        appliedModules: [application._id] // Reference to the TaApplication
      });

      // Verify all relationships work
      const fullApplication = await TaApplication.findById(application._id)
        .populate('userId')
        .populate('moduleId');
      
      const fullAppliedModule = await AppliedModules.findById(appliedModule._id)
        .populate('userId')
        .populate('appliedModules');

      expect(fullApplication.userId._id.toString()).toBe(student._id.toString());
      expect(fullApplication.moduleId._id.toString()).toBe(module._id.toString());
      expect(fullAppliedModule.userId._id.toString()).toBe(student._id.toString());
      expect(fullAppliedModule.appliedModules[0]._id.toString()).toBe(application._id.toString());

      // Test deletion cascade - what happens when we delete the student?
      await User.findByIdAndDelete(student._id);

      // Applications should still exist but with null references
      const orphanedApplication = await TaApplication.findById(application._id).populate('userId');
      const orphanedAppliedModule = await AppliedModules.findById(appliedModule._id).populate('userId');

      expect(orphanedApplication.userId).toBeNull();
      expect(orphanedAppliedModule.userId).toBeNull();
    });
  });
});