import type { Request, Response } from "express";
const AppliedModules = require("../models/AppliedModules");
const RecruitmentRound = require("../models/RecruitmentRound");

const viewTADocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Get IDs of all currently active recruitment rounds
    const activeRounds = await RecruitmentRound.find({ status: "active" })
      .select("_id")
      .lean();
      
    const activeRoundIds = activeRounds.map((round: any) => round._id);

    if (activeRoundIds.length === 0) {
      return res.status(200).json({ groupedData: [] });
    }

    // 2. Query AppliedModules filtered by active rounds
    const submittedRecords = await AppliedModules.find({
      recSeriesId: { $in: activeRoundIds },
      isDocSubmitted: true,
      Documents: { $exists: true, $ne: null }
    })
      .populate("recSeriesId", "name") // NEW: Get the series name directly
      .populate("userId", "name indexNumber email role")
      .populate("Documents")
      .populate({
        path: "appliedModules",
        match: { status: "accepted" },
        populate: {
          path: "moduleId",
          select: "moduleCode moduleName requiredTAHours",
        },
      })
      .lean();

    if (!submittedRecords || submittedRecords.length === 0) {
      return res.status(200).json({ groupedData: [] });
    }

    // 3. Format and Group the response using .reduce()
    const groupedResult = submittedRecords.reduce((acc: any, record: any) => {
      // Setup group keys
      const seriesId = record.recSeriesId._id.toString();
      const seriesName = record.recSeriesId.name;

      // Initialize the group if it doesn't exist yet
      if (!acc[seriesId]) {
        acc[seriesId] = {
          recSeriesId: seriesId,
          recSeriesName: seriesName,
          tas: []
        };
      }

      // Extract user and doc data
      const user = record.userId;
      const doc = record.Documents;
      
      const acceptedApps = record.appliedModules.filter((app: any) => app != null && app.moduleId != null);

      const formattedModules = acceptedApps.map((app: any) => {
        const module = app.moduleId;
        return {
          moduleId: module._id.toString(),
          moduleCode: module.moduleCode,
          moduleName: module.moduleName,
          taHours: module.requiredTAHours || 0,
        };
      });

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

      // Push the formatted TA into their respective series group
      acc[seriesId].tas.push({
        userId: user._id.toString(),
        name: user.name,
        indexNumber: user.indexNumber,
        role: user.role,
        email: user.email,
        acceptedModules: formattedModules,
        personalDetails: {
          bankAccountName: doc.bankAccountName || "",
          address: doc.address || "",
          nicNumber: doc.nicNumber || "",
          accountNumber: doc.accountNumber || "",
        },
        documents: {
          bankPassbook: formatFileMeta(doc.driveFiles?.bankPassbook),
          nicCopy: formatFileMeta(doc.driveFiles?.nicCopy),
          cv: formatFileMeta(doc.driveFiles?.cv),
          degreeCertificate: formatFileMeta(doc.driveFiles?.degreeCertificate),
          declarationForm: formatFileMeta(doc.driveFiles?.declarationForm),
        }
      });

      return acc;
    }, {});

    // Convert the dictionary object back into a clean array for the frontend
    const groupedDataArray = Object.values(groupedResult);

    return res.status(200).json({ groupedData: groupedDataArray });
  } catch (error) {
    console.error("Error fetching TA documents:", error);
    return res.status(500).json({ error: "Failed to fetch TA documents" });
  }
};

module.exports = { viewTADocuments };