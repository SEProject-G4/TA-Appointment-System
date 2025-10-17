const express = require('express');
const router = express.Router();
const { protected, authorize } = require('../middleware/authMiddleware');
const { getJobStatus, getQueueStats } = require('../services/jobQueue');

/**
 * Get status of a specific job
 * GET /api/jobs/:jobId/status
 */
router.get('/:jobId/status', protected, authorize(['admin']), async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!jobId || isNaN(jobId)) {
            return res.status(400).json({ error: 'Valid jobId is required' });
        }

        const jobStatus = await getJobStatus(parseInt(jobId));
        
        if (jobStatus.status === 'not_found') {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.status(200).json({
            success: true,
            job: jobStatus
        });

    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Internal server error while checking job status' });
    }
});

/**
 * Get queue statistics
 * GET /api/jobs/queue/stats
 */
router.get('/queue/stats', protected, authorize(['admin']), async (req, res) => {
    try {
        const stats = await getQueueStats();
        
        if (stats.error) {
            return res.status(500).json({ error: stats.error });
        }

        res.status(200).json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('Error getting queue stats:', error);
        res.status(500).json({ error: 'Internal server error while getting queue statistics' });
    }
});

module.exports = router;