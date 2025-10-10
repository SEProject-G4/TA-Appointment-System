const recruitmentController = require('../../controllers/recruitmentController');
const RecruitmentRound = require('../../models/RecruitmentRound');
const UserGroup = require('../../models/UserGroup');
const ModuleDetails = require('../../models/ModuleDetails');
const User = require('../../models/User');

jest.mock('../../models/RecruitmentRound');
jest.mock('../../models/UserGroup');
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/User');

describe('recruitmentController (admin operations)', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { params: {}, body: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('createRecruitmentRound', () => {
    it('creates a new recruitment round', async () => {
      mockReq.body = {
        name: 'Series 1',
        applicationDueDate: '2025-01-01',
        documentDueDate: '2025-01-10',
        undergradHourLimit: 15,
        postgradHourLimit: 20,
        undergradMailingList: [{ _id: 'g1' }],
        postgradMailingList: [{ _id: 'g2' }]
      };

      const saved = { _id: 's1', ...mockReq.body, status: 'initialised' };
      RecruitmentRound.mockImplementation((doc) => ({ ...doc, save: jest.fn().mockResolvedValue(saved) }));

      await recruitmentController.createRecruitmentRound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Series 1' }));
    });

    it('returns 500 on error', async () => {
      mockReq.body = { name: 'Series 1', undergradMailingList: [], postgradMailingList: [] };
      RecruitmentRound.mockImplementation(() => ({ save: jest.fn().mockRejectedValue(new Error('db')) }));

      await recruitmentController.createRecruitmentRound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllRecruitmentRounds', () => {
    it('returns series with populated group objects', async () => {
      const series = [{ _id: 's1', _doc: { name: 'S1' }, undergradMailingList: ['g1'], postgradMailingList: ['g2'] }];
      RecruitmentRound.find.mockResolvedValue(series);
      UserGroup.findById
        .mockResolvedValueOnce({ _id: 'g1', name: 'UG' })
        .mockResolvedValueOnce({ _id: 'g2', name: 'PG' });

      await recruitmentController.getAllRecruitmentRounds({}, mockRes);

      expect(RecruitmentRound.find).toHaveBeenCalled();
      expect(UserGroup.findById).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        expect.objectContaining({ undergradMailingList: [{ _id: 'g1', name: 'UG' }], postgradMailingList: [{ _id: 'g2', name: 'PG' }] })
      ]);
    });

    it('filters out null groups', async () => {
      const series = [{ _id: 's1', _doc: { name: 'S1' }, undergradMailingList: ['g1'], postgradMailingList: ['g2'] }];
      RecruitmentRound.find.mockResolvedValue(series);
      UserGroup.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: 'g2', name: 'PG' });

      await recruitmentController.getAllRecruitmentRounds({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        expect.objectContaining({ undergradMailingList: [], postgradMailingList: [{ _id: 'g2', name: 'PG' }] })
      ]);
    });

    it('returns 500 on error', async () => {
      RecruitmentRound.find.mockRejectedValue(new Error('db'));

      await recruitmentController.getAllRecruitmentRounds({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addModuleToRecruitmentRound', () => {
    it('adds a new module to a series and sets fields based on counts', async () => {
      mockReq.params = { seriesId: 's1' };
      mockReq.body = {
        moduleCode: 'CS1010',
        moduleName: 'Intro',
        semester: '1',
        coordinators: ['l1'],
        applicationDueDate: '2025-01-01',
        documentDueDate: '2025-01-10',
        requiredTAHours: 12,
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 0,
        requirements: 'Req'
      };

      RecruitmentRound.findById.mockResolvedValue({ _id: 's1' });
      ModuleDetails.mockImplementation((doc) => ({ ...doc, save: jest.fn().mockResolvedValue({}) }));

      await recruitmentController.addModuleToRecruitmentRound(mockReq, mockRes);

      expect(ModuleDetails).toHaveBeenCalledWith(expect.objectContaining({
        openForUndergraduates: true,
        openForPostgraduates: false,
        undergraduateCounts: { required: 2, remaining: 2 },
        postgraduateCounts: null,
        moduleStatus: 'initialised'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if series not found', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockResolvedValue(null);

      await recruitmentController.addModuleToRecruitmentRound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recruitment series not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockRejectedValue(new Error('db'));

      await recruitmentController.addModuleToRecruitmentRound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getModuleDetailsBySeriesId', () => {
    it('returns modules with coordinator details', async () => {
      mockReq.params = { seriesId: 's1' };
      ModuleDetails.find.mockResolvedValue([
        { _id: 'm1', coordinators: ['u1'], _doc: { moduleCode: 'C' } }
      ]);
      User.findById.mockResolvedValue({ _id: 'u1', displayName: 'Lec', email: 'l@x', profilePicture: 'p' });

      await recruitmentController.getModuleDetailsBySeriesId(mockReq, mockRes);

      expect(ModuleDetails.find).toHaveBeenCalledWith({ recruitmentSeriesId: 's1' });
      expect(User.findById).toHaveBeenCalledWith('u1', 'displayName email profilePicture');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        expect.objectContaining({ coordinators: [{ id: 'u1', displayName: 'Lec', email: 'l@x', profilePicture: 'p' }] })
      ]);
    });

    it('returns 500 on error', async () => {
      mockReq.params = { seriesId: 's1' };
      ModuleDetails.find.mockRejectedValue(new Error('db'));

      await recruitmentController.getModuleDetailsBySeriesId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEligibleUndergraduates', () => {
    it('fetches users in undergrad mailing list', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockResolvedValue({ _id: 's1', undergradMailingList: ['g1', 'g2'] });
      User.find.mockResolvedValue([{ _id: 'u1' }]);

      await recruitmentController.getEligibleUndergraduates(mockReq, mockRes);

      expect(User.find).toHaveBeenCalledWith({ userGroup: { $in: ['g1', 'g2'] }, role: 'undergraduate' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when series not found', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockResolvedValue(null);

      await recruitmentController.getEligibleUndergraduates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recruitment series not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockRejectedValue(new Error('db'));

      await recruitmentController.getEligibleUndergraduates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEligiblePostgraduates', () => {
    it('fetches users in postgrad mailing list', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockResolvedValue({ _id: 's1', postgradMailingList: ['g1'] });
      User.find.mockResolvedValue([{ _id: 'u1' }]);

      await recruitmentController.getEligiblePostgraduates(mockReq, mockRes);

      expect(User.find).toHaveBeenCalledWith({ userGroup: { $in: ['g1'] }, role: 'postgraduate' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when series not found', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockResolvedValue(null);

      await recruitmentController.getEligiblePostgraduates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recruitment series not found' });
    });

    it('returns 500 on error', async () => {
      mockReq.params = { seriesId: 's1' };
      RecruitmentRound.findById.mockRejectedValue(new Error('db'));

      await recruitmentController.getEligiblePostgraduates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});


