// import express from "express";
// import type { Request, Response } from "express";
// import { protectedMiddleware, authorize } from "../middleware/authMiddleware.js";
// import { getJobStatus, getQueueStats } from "../controllers/jobController.js";

// const router = express.Router();

// /**
//  * Get status of a specific job
//  * GET /api/jobs/:jobId/status
//  */
// router.get("/:jobId/status", protectedMiddleware, authorize(["admin"]), async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;

//     if (!jobId || isNaN(Number(jobId))) {
//       return res.status(400).json({ error: "Valid jobId is required" });
//     }

//     const jobStatus = await getJobStatus(parseInt(jobId));

//     if (jobStatus.status === "not_found") {
//       return res.status(404).json({ error: "Job not found" });
//     }

//     res.status(200).json({
//       success: true,
//       job: jobStatus,
//     });
//   } catch (error) {
//     console.error("Error getting job status:", error);
//     res.status(500).json({ error: "Internal server error while checking job status" });
//   }
// });

// /**
//  * Get queue statistics
//  * GET /api/jobs/queue/stats
//  */
// router.get("/queue/stats", protectedMiddleware, authorize(["admin"]), async (req: Request, res: Response) => {
//   try {
//     const stats = await getQueueStats();

//     if (stats.error) {
//       return res.status(500).json({ error: stats.error });
//     }

//     res.status(200).json({
//       success: true,
//       stats: stats,
//     });
//   } catch (error) {
//     console.error("Error getting queue stats:", error);
//     res.status(500).json({ error: "Internal server error while getting queue statistics" });
//   }
// });

// export default router;
