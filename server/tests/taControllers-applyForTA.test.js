const mongoose = require("mongoose");
const { applyForTA } = require("../src/controllers/taControllers");

jest.mock("../src/models/ModuleDetails");
jest.mock("../src/models/TaApplication");
jest.mock("../src/models/AppliedModules");

const ModuleDetails = require("../src/models/ModuleDetails");
const TaApplication = require("../src/models/TaApplication");
const AppliedModules = require("../src/models/AppliedModules");

// --------------Test cases for applyForTA controller --------------

describe("applyForTA Controller", () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    req = {
      body: {
        userId: "user123",
        userRole: "postgraduate",
        moduleId: "mod123",
        recSeriesId: "rec001",
        taHours: 3,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
// positive test cases
  it("TC01-should successfully submit application", async () => {
    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    // Mock the chaining of .session() method
    TaApplication.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });
    AppliedModules.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });
    ModuleDetails.findOneAndUpdate.mockReturnValue({
      session: jest.fn().mockResolvedValue({ _id: "mod123" }),
    });
    TaApplication.prototype.save = jest.fn();
    AppliedModules.prototype.save = jest.fn();

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Application submitted successfully",
      })
    );
  });

  it("TC02-should successfully apply when user's available hours equals module's required taHours", async () => {
    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    // Module requires 3 hours
    req.body.taHours = 3;

    // Mock no existing application
    TaApplication.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    // Mock user has exactly the required available hours
    AppliedModules.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue({
        availableHoursPerWeek: 3, // User has exactly 3 hours available, matching module's requirement
      }),
    });

    // Mock successful module update
    ModuleDetails.findOneAndUpdate.mockReturnValue({
      session: jest.fn().mockResolvedValue({
        _id: "mod123",
      }),
    });

    TaApplication.prototype.save = jest.fn();
    AppliedModules.prototype.save = jest.fn();

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Application submitted successfully",
      })
    );
  });
  // negative test cases
  it("TC03-should return error if already applied", async () => {
    const mockSession = {
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
    TaApplication.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue({ _id: "existingApp" }),
    });

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You have already applied for this module",
      })
    );
  });

  it("TC04-should fail when user's available hours is less than module's required taHours", async () => {
    const mockSession = {
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    // Module requires 4 hours
    req.body.taHours = 4;

    // Mock no existing application
    TaApplication.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    // Mock user has insufficient available hours (less than module's requirement)
    AppliedModules.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue({
        availableHoursPerWeek: 2, // User only has 2 hours available, but module needs 4
      }),
    });

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Insufficient available hours to apply for this module",
      })
    );
  });

  it("TC05-should fail when module has no remaining TA slots", async () => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    TaApplication.findOne.mockImplementation(() => ({
      session: () => Promise.resolve(null),
    }));

    AppliedModules.findOne.mockImplementation(() => ({
      session: () => Promise.resolve(null),
    }));

    // 🚨 KEY CHANGE HERE
    ModuleDetails.findOneAndUpdate.mockResolvedValue(null);

    TaApplication.prototype.save = jest.fn();
    AppliedModules.prototype.save = jest.fn();

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "TA positions for this module are already filled",
      })
    );
  });

  it("TC06-should fail with invalid user role (not undergraduate or postgraduate)", async () => {
    const mockSession = {
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    // Set invalid user role
    req.body.userRole = "lecturer";

    TaApplication.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });
    AppliedModules.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    // Mock module update returning null due to invalid role
    ModuleDetails.findOneAndUpdate.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    await applyForTA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "TA positions for this module are already filled",
      })
    );
  });

  // it("should fail when userId is missing", async () => {
  //   const mockSession = {
  //     startTransaction: jest.fn(),
  //     commitTransaction: jest.fn(),
  //     abortTransaction: jest.fn(),
  //     endSession: jest.fn(),
  //   };
  //   mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

  //   // Remove userId
  //   delete req.body.userId;

  //   await applyForTA(req, res);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: expect.stringContaining("Cannot read properties"),
  //     })
  //   );
  // });

  // it("should fail when moduleId is missing", async () => {
  //   const mockSession = {
  //     startTransaction: jest.fn(),
  //     commitTransaction: jest.fn(),
  //     abortTransaction: jest.fn(),
  //     endSession: jest.fn(),
  //   };
  //   mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

  //   // Remove moduleId
  //   delete req.body.moduleId;

  //   await applyForTA(req, res);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: expect.stringContaining("Cannot read properties"),
  //     })
  //   );
  // });

  // it("should fail when recSeriesId is missing", async () => {
  //   const mockSession = {
  //     startTransaction: jest.fn(),
  //     commitTransaction: jest.fn(),
  //     abortTransaction: jest.fn(),
  //     endSession: jest.fn(),
  //   };
  //   mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

  //   // Remove recSeriesId
  //   delete req.body.recSeriesId;

  //   TaApplication.findOne.mockReturnValue({
  //     session: jest.fn().mockResolvedValue(null),
  //   });

  //   await applyForTA(req, res);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: expect.stringContaining("Cannot read properties"),
  //     })
  //   );
  // });

  // it("should fail when userRole is missing", async () => {
  //   const mockSession = {
  //     startTransaction: jest.fn(),
  //     abortTransaction: jest.fn(),
  //     endSession: jest.fn(),
  //   };
  //   mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

  //   // Remove userRole
  //   delete req.body.userRole;

  //   TaApplication.findOne.mockReturnValue({
  //     session: jest.fn().mockResolvedValue(null),
  //   });
  //   AppliedModules.findOne.mockReturnValue({
  //     session: jest.fn().mockResolvedValue(null),
  //   });

  //   // Mock module update returning null due to missing role
  //   ModuleDetails.findOneAndUpdate.mockReturnValue({
  //     session: jest.fn().mockResolvedValue(null),
  //   });

  //   await applyForTA(req, res);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: "TA positions for this module are already filled",
  //     })
  //   );
  // });

  // it("should fail when taHours is missing", async () => {
  //   const mockSession = {
  //     startTransaction: jest.fn(),
  //     commitTransaction: jest.fn(),
  //     abortTransaction: jest.fn(),
  //     endSession: jest.fn(),
  //   };
  //   mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

  //   // Remove taHours
  //   delete req.body.taHours;

  //   TaApplication.findOne.mockReturnValue({
  //     session: jest.fn().mockResolvedValue(null),
  //   });
  //   AppliedModules.findOne.mockReturnValue({
  //     session: jest.fn().mockResolvedValue({
  //       availableHoursPerWeek: 5,
  //       appliedModules: [],
  //     }),
  //   });

  //   await applyForTA(req, res);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: "Insufficient available hours to apply for this module",
  //     })
  //   );
  // });
});
