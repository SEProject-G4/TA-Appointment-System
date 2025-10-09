// tests/taControllers-getAllRequests.test.js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Import the real models instead of creating test-only ones
const User = require("../src/models/User");
const UserGroup = require("../src/models/UserGroup");
const RecruitmentRound = require("../src/models/RecruitmentRound");
const AppliedModules = require("../src/models/AppliedModules");
const ModuleDetails = require("../src/models/ModuleDetails");
const TaApplication = require("../src/models/TaApplication");

// Import the controller
const { getAllRequests } = require("../src/controllers/taControllers");

// small helper to mock Express res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getAllRequests", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {});

    // Optional: ensure there are no compiled models causing issues in other tests
    // (not usually necessary if you use the conditional model creation above)
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // clear collections between tests
    await Promise.all([
      User.deleteMany(),
      UserGroup.deleteMany(),
      RecruitmentRound.deleteMany(),
      AppliedModules.deleteMany(),
      ModuleDetails.deleteMany(),
      TaApplication.deleteMany(),
    ]);
  });

  it("TC01-should fetch advertised modules for an undergraduate user", async () => {
    // Create required user groups first
    const studentGroup = await UserGroup.create({
      name: "Undergraduate Group A",
      groupType: "undergraduate"
    });

    const lecturerGroup = await UserGroup.create({
      name: "Lecturers Group",
      groupType: "lecturer"
    });

    // create a normal undergraduate user
    const student = await User.create({
      googleId: "student123",
      name: "Dinara",
      email: "dinara@test.com",
      role: "undergraduate",
      userGroup: studentGroup._id,
      indexNumber: "UG123"
    });

    // create a lecturer user for coordinator validation (ModuleDetails has a pre-validate check)
    const lecturer = await User.create({
      googleId: "lecturer123",
      name: "Dr. Lect",
      email: "lecturer@test.com",
      displayName: "Dr. Lecturer",
      role: "lecturer",
      userGroup: lecturerGroup._id
    });

    // active recruitment series that includes student's group in undergrad mailing list
    const recSeries = await RecruitmentRound.create({
      name: "Fall 2024 Recruitment",
      status: "active",
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      undergradHourLimit: 6,
      postgradHourLimit: 8,
      undergradMailingList: [studentGroup._id],
      postgradMailingList: []
    });

    // create an advertised module that is open for undergraduates
    await ModuleDetails.create({
      recruitmentSeriesId: recSeries._id,
      moduleCode: "CS200",
      moduleName: "Algorithms",
      semester: 1,
      coordinators: [lecturer._id], // must be a lecturer
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      moduleStatus: "advertised",
      requiredTAHours: 3,
      openForUndergraduates: true,
      undergraduateCounts: {
        required: 2,
        remaining: 2,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      openForPostgraduates: false
    });

    const req = { query: { userId: student._id.toString() } };
    const res = mockResponse();

    await getAllRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedModules: expect.any(Array),
        availableHoursPerWeek: 6, // default for undergraduate when no AppliedModules exist
      })
    );
  });

  it("TC02-should exclude modules that the user already applied for", async () => {
    // Create user group first
    const userGroup = await UserGroup.create({
      name: "Group B",
      groupType: "undergraduate"
    });

    const user = await User.create({
      googleId: "ravi123",
      name: "Ravi",
      email: "ravi@test.com",
      role: "undergraduate",
      userGroup: userGroup._id,
      indexNumber: "UG456"
    });

    const recSeries = await RecruitmentRound.create({
      name: "Test Series",
      status: "active",
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      undergradHourLimit: 6,
      postgradHourLimit: 8,
      undergradMailingList: [userGroup._id],
      postgradMailingList: []
    });

    // Create lecturer for coordinators
    const lecturerGroup = await UserGroup.create({
      name: "Lecturers Group 2",
      groupType: "lecturer"
    });

    const lecturer = await User.create({
      googleId: "lecturer456",
      name: "Dr. Professor",
      email: "prof@test.com",
      displayName: "Dr. Professor",
      role: "lecturer",
      userGroup: lecturerGroup._id
    });

    const module1 = await ModuleDetails.create({
      recruitmentSeriesId: recSeries._id,
      moduleCode: "CS201",
      moduleName: "Databases",
      semester: 2,
      coordinators: [lecturer._id],
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      moduleStatus: "advertised",
      requiredTAHours: 2,
      openForUndergraduates: true,
      undergraduateCounts: {
        required: 1,
        remaining: 1,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      openForPostgraduates: false
    });

    const module2 = await ModuleDetails.create({
      recruitmentSeriesId: recSeries._id,
      moduleCode: "CS202",
      moduleName: "Networks",
      semester: 2,
      coordinators: [lecturer._id],
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      moduleStatus: "advertised",
      requiredTAHours: 2,
      openForUndergraduates: true,
      undergraduateCounts: {
        required: 1,
        remaining: 1,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      openForPostgraduates: false
    });

    // Simulate user already applied for module1
    const taApp = await TaApplication.create({
      userId: user._id,
      moduleId: module1._id,
      status: "pending"
    });

    await AppliedModules.create({
      userId: user._id,
      recSeriesId: recSeries._id,
      appliedModules: [taApp._id],
      availableHoursPerWeek: 5,
    });

    const req = { query: { userId: user._id.toString() } };
    const res = mockResponse();

    await getAllRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.updatedModules.length).toBe(1);
    expect(data.updatedModules[0].moduleCode).toBe("CS202");
  });

  it("TC03-should filter out modules that exceed available TA hours", async () => {
    // Create user group first
    const userGroup = await UserGroup.create({
      name: "Group C",
      groupType: "undergraduate"
    });

    const user = await User.create({
      googleId: "isurika123",
      name: "Isurika",
      email: "isurika@test.com",
      role: "undergraduate",
      userGroup: userGroup._id,
      indexNumber: "UG789"
    });

    const recSeries = await RecruitmentRound.create({
      name: "Test Hours Series",
      status: "active",
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      undergradHourLimit: 6,
      postgradHourLimit: 8,
      undergradMailingList: [userGroup._id],
      postgradMailingList: []
    });

    // Create lecturer for coordinators
    const lecturerGroup = await UserGroup.create({
      name: "Lecturers Group 3",
      groupType: "lecturer"
    });

    const lecturer = await User.create({
      googleId: "lecturer789",
      name: "Dr. Smith",
      email: "smith@test.com",
      displayName: "Dr. Smith",
      role: "lecturer",
      userGroup: lecturerGroup._id
    });

    await AppliedModules.create({
      userId: user._id,
      recSeriesId: recSeries._id,
      appliedModules: [],
      availableHoursPerWeek: 3, // low hours
    });

    await ModuleDetails.create({
      recruitmentSeriesId: recSeries._id,
      moduleCode: "CS300",
      moduleName: "AI",
      semester: 2,
      coordinators: [lecturer._id],
      applicationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      documentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      moduleStatus: "advertised",
      requiredTAHours: 5, // exceeds available hours (3)
      openForUndergraduates: true,
      undergraduateCounts: {
        required: 1,
        remaining: 1,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      openForPostgraduates: false
    });

    const req = { query: { userId: user._id.toString() } };
    const res = mockResponse();

    await getAllRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.updatedModules.length).toBe(0); // filtered out due to insufficient hours
    expect(data.availableHoursPerWeek).toBe(3); // should return user's available hours
  });
  it("TC04-should handle errors and return 500", async () => {
  const req = { query: { userId: "123" } }; // invalid ID
  const res = mockResponse();

  await getAllRequests(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      message: "Error fetching available TA positions",
    })
  );
});



});
