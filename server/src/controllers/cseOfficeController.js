const RecruitmentRound = require('../models/RecruitmentRound');
const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const TaDocumentSubmission = require('../models/documentModel');
const User = require('../models/User');

const viewTADocuments = async (req, res) => {
    try {
        // Get all documents with user details populated
        const documents = await TaDocumentSubmission.find({})
            .populate('userId', 'name indexNumber email role')
            .lean();

        if (!documents || documents.length === 0) {
            return res.status(200).json({ tas: [] });
        }

        // Build response for each TA
        const tasPromises = documents.map(async (doc) => {
            const userId = doc.userId._id;
            const userName = doc.userId.name;
            const userIndex = doc.userId.indexNumber;

            // Find all accepted TA applications for this user
            const acceptedApplications = await TaApplication.find({
                userId: userId,
                status: 'accepted'
            })
            .populate('moduleId', 'moduleCode moduleName semester')
            .lean();

            // Get recruitment series info to extract the year
            const acceptedModules = await Promise.all(
                acceptedApplications.map(async (app) => {
                    const module = await ModuleDetails.findById(app.moduleId)
                        .populate('recruitmentSeriesId', 'name')
                        .lean();
                    
                    // Try to extract year from recruitment series name (e.g., "2024/2025 Semester 1")
                    let year = new Date().getFullYear();
                    if (module?.recruitmentSeriesId?.name) {
                        const yearMatch = module.recruitmentSeriesId.name.match(/(\d{4})/);
                        if (yearMatch) {
                            year = parseInt(yearMatch[1]);
                        }
                    }
                    
                    return {
                        moduleId: app.moduleId._id.toString(),
                        moduleCode: app.moduleId.moduleCode,
                        moduleName: app.moduleId.moduleName,
                        semester: app.moduleId.semester,
                        year: year
                    };
                })
            );

            // Format documents to match frontend expectations
            const formatFileMeta = (fileData) => {
                if (!fileData) return { submitted: false };
                return {
                    submitted: true,
                    fileUrl: fileData.viewLink || fileData.downloadLink || '',
                    fileName: fileData.name || '',
                    uploadedAt: doc.updatedAt || doc.createdAt
                };
            };

            const documents = {
                bankPassbook: formatFileMeta(doc.driveFiles?.bankPassbook),
                nicCopy: formatFileMeta(doc.driveFiles?.nicCopy),
                cv: formatFileMeta(doc.driveFiles?.cv),
                degreeCertificate: formatFileMeta(doc.driveFiles?.degreeCertificate),
                declarationForm: formatFileMeta(doc.driveFiles?.declarationForm)
            };

            return {
                userId: userId.toString(),
                name: userName,
                indexNumber: userIndex,
                role: doc.userId.role,
                acceptedModules: acceptedModules,
                documents: documents
            };
        });

        const tas = await Promise.all(tasPromises);

        return res.status(200).json({ tas });

    } catch (error) {
        console.error('Error fetching TA documents:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch TA documents',
            details: error.message 
        });
    }
}

module.exports = { viewTADocuments }