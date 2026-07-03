import type { Request, Response } from "express";
const RecruitmentRound = require("../models/RecruitmentRound");
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const TaDocumentSubmission = require("../models/documentModel");
const User = require("../models/User");

const viewTADocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Get all documents with user details populated
    const documents = await TaDocumentSubmission.find({})
      .populate("userId", "name indexNumber email role")
      .lean();

    if (!documents || documents.length === 0) {
      return res.status(200).json({ tas: [] });
    }

    const validDocuments = documents.filter((doc: any) => doc.userId != null);

    // 2. Build response for each TA
    const tasPromises = validDocuments.map(async (doc: any) => {
      const userId = doc.userId._id;
      const userName = doc.userId.name;
      const userIndex = doc.userId.indexNumber;

      // OPTIMIZATION: Use Mongoose Deep Population to get Module and Series data in one go
      const acceptedApplications = await TaApplication.find({
        userId: userId,
        status: "accepted",
      })
        .populate({
          path: "moduleId",
          select: "moduleCode moduleName semester recruitmentSeriesId",
          populate: {
            path: "recruitmentSeriesId",
            select: "name", // Grab the series name directly
          },
        })
        .lean();

      // Now this is completely synchronous and blazing fast - no DB calls in the loop!
      const acceptedModules = acceptedApplications.map((app: any) => {
        const module = app.moduleId;
        let year = new Date().getFullYear();
        
        // Extract year from the deeply populated recruitmentSeriesId
        if (module?.recruitmentSeriesId?.name) {
          const yearMatch = module.recruitmentSeriesId.name.match(/(\d{4})/);
          if (yearMatch) {
            year = parseInt(yearMatch[1]);
          }
        }

        return {
          moduleId: module._id.toString(),
          moduleCode: module.moduleCode,
          moduleName: module.moduleName,
          semester: module.semester,
          year: year,
        };
      });

      // SYNC: Format documents to match updated frontend expectations
      const formatFileMeta = (fileData: any) => {
        if (!fileData) return { submitted: false };
        return {
          submitted: true,
          id: fileData.id || "",
          name: fileData.name || "",
          viewLink: fileData.viewLink || "",
          downloadLink: fileData.downloadLink || "",
          uploadedAt: doc.updatedAt || doc.createdAt,
        };
      };

      const documentsList = {
        bankPassbook: formatFileMeta(doc.driveFiles?.bankPassbook),
        nicCopy: formatFileMeta(doc.driveFiles?.nicCopy),
        cv: formatFileMeta(doc.driveFiles?.cv),
        degreeCertificate: formatFileMeta(doc.driveFiles?.degreeCertificate),
        declarationForm: formatFileMeta(doc.driveFiles?.declarationForm),
      };

      return {
        userId: userId.toString(),
        name: userName,
        indexNumber: userIndex,
        role: doc.userId.role,
        acceptedModules: acceptedModules,
        documents: documentsList,
        personalDetails: {
          bankAccountName: doc.bankAccountName || "",
          address: doc.address || "",
          nicNumber: doc.nicNumber || "",
          accountNumber: doc.accountNumber || "",
        },
      };
    });

    const tas = await Promise.all(tasPromises);

    return res.status(200).json({ tas });
  } catch (error) {
    console.error("Error fetching TA documents:", error);
    return res.status(500).json({
      error: "Failed to fetch TA documents",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

module.exports = { viewTADocuments };