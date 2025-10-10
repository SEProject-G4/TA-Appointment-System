const moduleController = require('../../controllers/moduleController');
const ModuleDetails = require('../../models/ModuleDetails');
const User = require('../../models/User');
const RecruitmentRound = require('../../models/RecruitmentRound');
const emailService = require('../../services/emailService');

jest.mock('../../models/ModuleDetails');
jest.mock('../../models/User');
jest.mock('../../models/RecruitmentRound');
jest.mock('../../services/emailService', () => ({ sendEmail: jest.fn() }));

describe('moduleController (admin operations)', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { params: {}, body: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('getModuleDetailsById', () => {
    it('returns module with populated coordinators', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockResolvedValue({
        _id: 'm1',
        coordinators: ['u1', 'u2'],
        _doc: { moduleCode: 'CS1010' }
      });
      User.findById
        .mockResolvedValueOnce({ _id: 'u1', displayName: 'A', email: 'a@x', profilePicture: 'p1' })
        .mockResolvedValueOnce({ _id: 'u2', displayName: 'B', email: 'b@x', profilePicture: 'p2' });

      await moduleController.getModuleDetailsById(mockReq, mockRes);

      expect(ModuleDetails.findById).toHaveBeenCalledWith('m1');
      expect(User.findById).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        coordinators: [
          { id: 'u1', displayName: 'A', email: 'a@x', profilePicture: 'p1' },
          { id: 'u2', displayName: 'B', email: 'b@x', profilePicture: 'p2' }
        ]
      }));
    });

    it('returns 404 when module not found', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockResolvedValue(null);

      await moduleController.getModuleDetailsById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockRejectedValue(new Error('db'));

      await moduleController.getModuleDetailsById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('changeModuleStatus', () => {
    it('updates module status', async () => {
      mockReq.params = { moduleId: 'm1' };
      mockReq.body = { status: 'advertised' };
      const save = jest.fn().mockResolvedValue({});
      ModuleDetails.findById.mockResolvedValue({ _id: 'm1', moduleStatus: 'initialised', save });

      await moduleController.changeModuleStatus(mockReq, mockRes);

      expect(ModuleDetails.findById).toHaveBeenCalledWith('m1');
      expect(save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ moduleStatus: 'advertised' }));
    });

    it('returns 404 when module not found', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockResolvedValue(null);

      await moduleController.changeModuleStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockRejectedValue(new Error('db'));

      await moduleController.changeModuleStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('advertiseModule', () => {
    it('marks module advertised and emails all users in mailing lists', async () => {
      mockReq.params = { moduleId: 'm1' };
      const save = jest.fn().mockResolvedValue({});
      ModuleDetails.findById.mockResolvedValue({
        _id: 'm1',
        moduleCode: 'CS1010',
        moduleName: 'Intro',
        recruitmentSeriesId: 's1',
        moduleStatus: 'initialised',
        save
      });
      RecruitmentRound.findById.mockResolvedValue({
        _id: 's1',
        undergradMailingList: ['g1'],
        postgradMailingList: ['g2']
      });
      User.find.mockResolvedValue([
        { email: 'a@x', name: 'A' },
        { email: 'b@x', name: 'B' }
      ]);
      emailService.sendEmail.mockResolvedValue(true);

      await moduleController.advertiseModule(mockReq, mockRes);

      expect(save).toHaveBeenCalled();
      expect(RecruitmentRound.findById).toHaveBeenCalledWith('s1');
      expect(User.find).toHaveBeenCalledWith({ userGroup: { $in: ['g1', 'g2'] } }, 'email name');
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Module advertised successfully' });
    });

    it('returns 404 when module not found', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockResolvedValue(null);

      await moduleController.advertiseModule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module not found' });
    });

    it('returns 400 when module has no recruitment series id', async () => {
      mockReq.params = { moduleId: 'm1' };
      const save = jest.fn().mockResolvedValue({});
      ModuleDetails.findById.mockResolvedValue({ _id: 'm1', moduleCode: 'C', moduleName: 'N', recruitmentSeriesId: null, save });

      await moduleController.advertiseModule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Module is not associated with any recruitment series' });
    });

    it('returns 404 when recruitment series not found', async () => {
      mockReq.params = { moduleId: 'm1' };
      const save = jest.fn().mockResolvedValue({});
      ModuleDetails.findById.mockResolvedValue({ _id: 'm1', moduleCode: 'C', moduleName: 'N', recruitmentSeriesId: 's1', save });
      RecruitmentRound.findById.mockResolvedValue(null);

      await moduleController.advertiseModule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recruitment series not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { moduleId: 'm1' };
      ModuleDetails.findById.mockRejectedValue(new Error('db'));

      await moduleController.advertiseModule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});


