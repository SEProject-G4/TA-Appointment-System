const request = require('supertest');
const mongoose = require('mongoose');
const lecturerController = require('../../controllers/lecturerController');
const ModuleDetails = require('../../models/ModuleDetails');
const User = require('../../models/User');

// Mock the models
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/User');

describe('lecturerController.editModuleRequirments', () => {
  let mockReq, mockRes, mockUser, mockModule;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      params: { id: 'module123' },
      body: {
        requiredTAHours: 8,
        requiredUndergraduateTACount: 4,
        requiredPostgraduateTACount: 2,
        requirements: 'Strong programming skills required'
      },
      user: { _id: 'lecturer123' }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock user object
    mockUser = {
      _id: 'lecturer123',
      displayName: 'Dr. Smith',
      email: 'dr.smith@university.edu'
    };

    // Mock module object
    mockModule = {
      _id: 'module123',
      moduleCode: 'CS1010',
      moduleName: 'Introduction to Computer Science',
      coordinators: ['lecturer123'],
      moduleStatus: 'pending changes',
      requiredTAHours: 6,
      requiredUndergraduateTACount: 3,
      requiredPostgraduateTACount: 1,
      requirements: 'Basic programming knowledge',
      undergraduateCounts: {
        required: 3,
        remaining: 3,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      postgraduateCounts: {
        required: 1,
        remaining: 1,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      openForUndergraduates: true,
      openForPostgraduates: true,
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnValue(this)
    };

    // Mock ModuleDetails.findById
    ModuleDetails.findById.mockResolvedValue(mockModule);
    
    // Mock ModuleDetails.findByIdAndUpdate
    ModuleDetails.findByIdAndUpdate.mockResolvedValue({
      ...mockModule,
      requiredTAHours: 8,
      requiredUndergraduateTACount: 4,
      requiredPostgraduateTACount: 2,
      requirements: 'Strong programming skills required'
    });
  });

  describe('Successful cases', () => {
    it('should successfully update module requirements for pending changes status', async () => {
      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(ModuleDetails.findById).toHaveBeenCalledWith('module123');
      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        {
          $set: expect.objectContaining({
            requiredTAHours: 8,
            requiredUndergraduateTACount: 4,
            requiredPostgraduateTACount: 2,
            requirements: 'Strong programming skills required',
            updatedBy: 'lecturer123',
            moduleStatus: 'changes submitted'
          })
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should successfully update module requirements for changes submitted status', async () => {
      mockModule.moduleStatus = 'changes submitted';
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should successfully update module requirements for advertised status', async () => {
      mockModule.moduleStatus = 'advertised';
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle zero values for TA counts', async () => {
      mockReq.body = {
        requiredTAHours: 0,
        requiredUndergraduateTACount: 0,
        requiredPostgraduateTACount: 0,
        requirements: 'No TAs required'
      };

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        {
          $set: expect.objectContaining({
            requiredTAHours: 0,
            requiredUndergraduateTACount: 0,
            requiredPostgraduateTACount: 0,
            requirements: 'No TAs required'
          })
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should update openForUndergraduates and openForPostgraduates flags correctly', async () => {
      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        {
          $set: expect.objectContaining({
            openForUndergraduates: true,
            openForPostgraduates: true
          })
        },
        { new: true, runValidators: true }
      );
    });
  });

  describe('Authentication and authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = null;

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 401 if user ID is missing', async () => {
      mockReq.user = {};

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 403 if lecturer is not a coordinator for the module', async () => {
      mockModule.coordinators = ['otherLecturer123'];
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authorized to edit this module' });
    });
  });

  describe('Module validation', () => {
    it('should return 404 if module is not found', async () => {
      ModuleDetails.findById.mockResolvedValue(null);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module not found' });
    });

    it('should return 400 if module is not in an editable status', async () => {
      mockModule.moduleStatus = 'recruitment closed';
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module is not in an editable status' });
    });

    it('should return 400 if module status is recruitment completed', async () => {
      mockModule.moduleStatus = 'recruitment completed';
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module is not in an editable status' });
    });
  });

  describe('Validation for advertised modules', () => {
    it('should return 400 if reducing undergraduate TA count below applied count for advertised module', async () => {
      mockModule.moduleStatus = 'advertised';
      mockModule.undergraduateCounts = {
        required: 5,
        remaining: 3,
        applied: 4,
        reviewed: 2,
        accepted: 1,
        docSubmitted: 0,
        appointed: 0
      };
      ModuleDetails.findById.mockResolvedValue(mockModule);
      
      mockReq.body.requiredUndergraduateTACount = 2; // Less than applied count (4)

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Cannot reduce undergraduate TA count to 2 because 4 students have already applied.' 
      });
    });

    it('should return 400 if reducing postgraduate TA count below applied count for advertised module', async () => {
      mockModule.moduleStatus = 'advertised';
      mockModule.postgraduateCounts = {
        required: 3,
        remaining: 1,
        applied: 2,
        reviewed: 1,
        accepted: 1,
        docSubmitted: 0,
        appointed: 0
      };
      ModuleDetails.findById.mockResolvedValue(mockModule);
      
      mockReq.body.requiredPostgraduateTACount = 1; // Less than applied count (2)

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Cannot reduce postgraduate TA count to 1 because 2 students have already applied.' 
      });
    });

    it('should allow reducing TA counts to applied count for advertised module', async () => {
      mockModule.moduleStatus = 'advertised';
      mockModule.undergraduateCounts = {
        required: 5,
        remaining: 3,
        applied: 3,
        reviewed: 2,
        accepted: 1,
        docSubmitted: 0,
        appointed: 0
      };
      ModuleDetails.findById.mockResolvedValue(mockModule);
      
      mockReq.body.requiredUndergraduateTACount = 3; // Equal to applied count

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error handling', () => {
    it('should return 500 if database findById fails', async () => {
      ModuleDetails.findById.mockRejectedValue(new Error('Database connection failed'));

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update module requirements' });
    });

    it('should return 500 if database findByIdAndUpdate fails', async () => {
      ModuleDetails.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update module requirements' });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined/null values in request body', async () => {
      mockReq.body = {
        requiredTAHours: undefined,
        requiredUndergraduateTACount: null,
        requiredPostgraduateTACount: 0,
        requirements: 'Test requirements'
      };

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        {
          $set: expect.objectContaining({
            requiredTAHours: undefined,
            requiredUndergraduateTACount: null,
            requiredPostgraduateTACount: 0,
            requirements: 'Test requirements'
          })
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty string requirements', async () => {
      mockReq.body.requirements = '';

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        {
          $set: expect.objectContaining({
            requirements: ''
          })
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing undergraduateCounts in module', async () => {
      mockModule.undergraduateCounts = null;
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing postgraduateCounts in module', async () => {
      mockModule.postgraduateCounts = null;
      ModuleDetails.findById.mockResolvedValue(mockModule);

      await lecturerController.editModuleRequirments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
