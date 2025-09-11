const RecruitmentSeries = require('../models/recruitmentSeries');
const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const TaDocumentSubmission = require('../models/TaDocumentSubmission');
const User = require('../models/User');

// const viewTADocuments = async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }

//     // Active recruitment series
//     const activeSeries = await RecruitmentSeries.find({ status: 'initialised' }).select('_id');
//     const activeSeriesIds = new Set(activeSeries.map(rs => rs._id.toString()));

//     // Modules in active series
//     const modules = await ModuleDetails.find({ recruitmentSeriesId: { $in: [...activeSeriesIds] } })
//       .select('_id moduleCode moduleName semester year recruitmentSeriesId');

//     if (!modules || modules.length === 0) {
//       return res.status(200).json({ tas: [] });
//     }

//     const moduleIdObjects = modules.map(m => m._id);
//     const moduleMap = modules.reduce((acc, m) => { acc[m._id.toString()] = m; return acc; }, {});

//     // Accepted applications in these modules
//     const applications = await TaApplication.find({
//       moduleId: { $in: moduleIdObjects },
//       status: 'accepted'
//     }).lean();
//     console.log("applications", applications);

//     if (applications.length === 0) {
//       return res.status(200).json({ tas: [] });
//     }

//     const userIds = [...new Set(applications.map(a => a.userId))];
//     const userIdsStrings = userIds.map(id => id.toString());

//     // Only TAs whose document submission is fully submitted (status === 'submitted')
//     const docSubs = await TaDocumentSubmission.find({ userId: { $in: userIdsStrings }, status: 'submitted' })
//       .select('userId documents status').lean();
//     console.log("docSubs", docSubs);

//     const submittedUserIds = new Set(docSubs.map(d => d.userId));
//     console.log("submittedUserIds", submittedUserIds);

//     // Filter applications to those users only
//     const filteredApps = applications.filter(a => submittedUserIds.has(a.userId));
//     if (filteredApps.length === 0) {
//       return res.status(200).json({ tas: [] });
//     }
//     console.log("filteredApps", filteredApps);

//     const filteredUserIds = [...new Set(filteredApps.map(a => a.userId))];

//     const users = await User.find({ _id: { $in: filteredUserIds } }).select('name indexNumber');
//     const userMap = users.reduce((acc, u) => { acc[u._id] = { name: u.name, indexNumber: u.indexNumber }; return acc; }, {});

//     const docMap = docSubs.reduce((acc, d) => { acc[d.userId] = d.documents || {}; return acc; }, {});

//     const normalize = (d) => {
//       if (!d) return { submitted: false };
//       if (typeof d === 'string') {
//         return { submitted: true, fileUrl: d };
//       }
//       return {
//         submitted: Boolean(d.submitted || d.fileUrl),
//         fileUrl: d.fileUrl,
//         fileName: d.fileName,
//         uploadedAt: d.uploadedAt
//       };
//     };

//     // Group accepted modules per TA
//     const modulesByUser = new Map();
//     for (const app of filteredApps) {
//       const mod = moduleMap[String(app.moduleId)];
//       if (!mod) continue;
//       if (!modulesByUser.has(app.userId)) modulesByUser.set(app.userId, []);
//       modulesByUser.get(app.userId).push({
//         moduleId: mod._id,
//         moduleCode: mod.moduleCode,
//         moduleName: mod.moduleName,
//         semester: mod.semester,
//         year: mod.year
//       });
//     }

//     const tas = filteredUserIds.map(uid => {
//       const docs = docMap[uid] || {};
//       const documents = {
//         bankPassbookCopy: normalize(docs.bankPassbookCopy),
//         nicCopy: normalize(docs.nicCopy),
//         cv: normalize(docs.cv),
//         degreeCertificate: normalize(docs.degreeCertificate)
//       };
//       return {
//         userId: uid,
//         name: userMap[uid]?.name || 'Unknown',
//         indexNumber: userMap[uid]?.indexNumber || 'N/A',
//         acceptedModules: modulesByUser.get(uid) || [],
//         documents
//       };
//     });

//     return res.status(200).json({ tas });
//   } catch (error) {
//     console.error('Error in viewTADocuments:', error);
//     return res.status(500).json({ error: 'Failed to fetch TA documents' });
//   }
// }

const viewTADocuments = async (req, res) => {
    try {
        // Optional auth guard if middleware attaches req.user
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // 1) Active recruitment series
        const activeSeries = await RecruitmentSeries.find({ status: 'initialised' }).select('_id');
        const activeSeriesIds = new Set(activeSeries.map(rs => rs._id.toString()));

        // 2) Modules in active series
        const modules = await ModuleDetails.find({ recruitmentSeriesId: { $in: [...activeSeriesIds] } })
            .select('_id moduleCode moduleName semester year recruitmentSeriesId');
        console.log("modules", modules);

        if (!modules || modules.length === 0) {
            return res.status(200).json({ tas: [] });
        }

        const moduleIdObjects = modules.map(m => m._id);
        const moduleMap = modules.reduce((acc, m) => { acc[m._id.toString()] = m; return acc; }, {});

        // 3) Accepted applications in these modules
        const applications = await TaApplication.find({
            moduleId: { $in: moduleIdObjects },
            status: 'accepted'
        }).lean();
        console.log("applications", applications);

        if (applications.length === 0) {
            return res.status(200).json({ tas: [] });
        }

        const userIds = [...new Set(applications.map(a => a.userId))];
        const userIdsStrings = userIds.map(id => id.toString());

        // 4) Only TAs whose document submission is fully submitted
        const docSubs = await TaDocumentSubmission.find({ userId: { $in: userIdsStrings }, status: 'submitted' })
            .select('userId documents status').lean();

        const submittedUserIds = new Set(docSubs.map(d => d.userId));

        // 5) Filter applications to those users only
        const filteredApps = applications.filter(a => submittedUserIds.has(a.userId));
        if (filteredApps.length === 0) {
            return res.status(200).json({ tas: [] });
        }

        const filteredUserIds = [...new Set(filteredApps.map(a => a.userId))];

        const users = await User.find({ _id: { $in: filteredUserIds } }).select('name indexNumber');
        const userMap = users.reduce((acc, u) => { acc[u._id] = { name: u.name, indexNumber: u.indexNumber }; return acc; }, {});

        const docMap = docSubs.reduce((acc, d) => { acc[d.userId] = d.documents || {}; return acc; }, {});

        const normalize = (d) => {
            if (!d) return { submitted: false };
            if (typeof d === 'string') {
                return { submitted: true, fileUrl: d };
            }
            return {
                submitted: Boolean(d.submitted || d.fileUrl),
                fileUrl: d.fileUrl,
                fileName: d.fileName,
                uploadedAt: d.uploadedAt
            };
        };

        // 6) Group accepted modules per TA
        const modulesByUser = new Map();
        for (const app of filteredApps) {
            const mod = moduleMap[String(app.moduleId)];
            if (!mod) continue;
            if (!modulesByUser.has(app.userId)) modulesByUser.set(app.userId, []);
            modulesByUser.get(app.userId).push({
                moduleId: mod._id,
                moduleCode: mod.moduleCode,
                moduleName: mod.moduleName,
                semester: mod.semester,
                year: mod.year
            });
        }

        const tas = filteredUserIds.map(uid => {
            const docs = docMap[uid] || {};
            const documents = {
                bankPassbookCopy: normalize(docs.bankPassbookCopy),
                nicCopy: normalize(docs.nicCopy),
                cv: normalize(docs.cv),
                degreeCertificate: normalize(docs.degreeCertificate)
            };
            return {
                userId: uid,
                name: userMap[uid]?.name || 'Unknown',
                indexNumber: userMap[uid]?.indexNumber || 'N/A',
                acceptedModules: modulesByUser.get(uid) || [],
                documents
            };
        });

        return res.status(200).json({ tas });
    } catch (error) {
        console.error('Error in viewTADocuments:', error);
        return res.status(500).json({ error: 'Failed to fetch TA documents' });
    }
}

module.exports = { viewTADocuments }