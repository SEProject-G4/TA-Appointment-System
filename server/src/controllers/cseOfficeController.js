const RecruitmentSeries = require('../models/recruitmentSeries');
const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const TaDocumentSubmission = require('../models/TaDocumentSubmission');
const User = require('../models/User');

const viewTADocuments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // CSE office should see modules for active recruitment series only
    const activeSeries = await RecruitmentSeries.find({ status: 'initialised' }).select('_id');
    const activeSeriesIds = new Set(activeSeries.map(rs => rs._id.toString()));

    // Get modules in active series
    const modules = await ModuleDetails.find({ recruitmentSeriesId: { $in: [...activeSeriesIds] } })
      .select('_id moduleCode moduleName semester year recruitmentSeriesId requiredTACount requiredTAHours');

    if (!modules || modules.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const moduleIdObjects = modules.map(m => m._id);
    const moduleIdStrings = moduleIdObjects.map(id => id.toString());

    // Find accepted TA applications for these modules
    const applications = await TaApplication.find({
      moduleId: { $in: moduleIdObjects },
      status: 'accepted'
    }).lean();

    if (applications.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const userIds = [...new Set(applications.map(a => a.userId))];

    // Fetch user info
    const users = await User.find({ _id: { $in: userIds } }).select('name indexNumber');
    const userMap = users.reduce((acc, u) => {
      acc[u._id] = { name: u.name, indexNumber: u.indexNumber };
      return acc;
    }, {});

    // Fetch document submissions
    const docSubs = await TaDocumentSubmission.find({ userId: { $in: userIds } }).select('userId documents');
    const docMap = docSubs.reduce((acc, d) => { acc[d.userId] = d.documents || {}; return acc; }, {});

    // Build grouped response by module
    const appsByModule = new Map();
    for (const app of applications) {
      const key = String(app.moduleId);
      if (!appsByModule.has(key)) appsByModule.set(key, []);
      appsByModule.get(key).push(app);
    }

    const normalize = (d) => {
      if (!d) return { submitted: false };
      return {
        submitted: Boolean(d.submitted),
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        uploadedAt: d.uploadedAt
      };
    };

    const result = modules
      .filter(m => (appsByModule.get(m._id.toString()) || []).length > 0)
      .map(m => {
        const modId = m._id.toString();
        const modApps = appsByModule.get(modId) || [];
        const tas = modApps.map(a => {
          const docs = docMap[a.userId] || {};
          const documents = {
            bankPassbookCopy: normalize(docs.bankPassbookCopy),
            nicCopy: normalize(docs.nicCopy),
            cv: normalize(docs.cv),
            degreeCertificate: normalize(docs.degreeCertificate)
          };
          const submittedCount = [documents.bankPassbookCopy, documents.nicCopy, documents.cv, documents.degreeCertificate]
            .filter(d => d.submitted).length;
          return {
            userId: a.userId,
            name: userMap[a.userId]?.name || 'Unknown',
            indexNumber: userMap[a.userId]?.indexNumber || 'N/A',
            documents,
            documentSummary: {
              submittedCount,
              total: 4,
              allSubmitted: submittedCount === 4
            }
          };
        });

        return {
          moduleId: m._id,
          moduleCode: m.moduleCode,
          moduleName: m.moduleName,
          semester: m.semester,
          year: m.year,
          requiredTAHours: m.requiredTAHours,
          requiredTACount: m.requiredTACount,
          approvedTAs: tas
        };
      });

    return res.status(200).json({ modules: result });
  } catch (error) {
    console.error('Error in viewTADocuments:', error);
    return res.status(500).json({ error: 'Failed to fetch TA documents' });
  }
}

module.exports = { viewTADocuments }