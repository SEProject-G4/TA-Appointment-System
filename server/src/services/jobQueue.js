const Queue = require('bull');
const { getRedisClient } = require('../config/redis');

// Create email job queue optimized for Redis Cloud (30MB limit)
const emailQueue = new Queue('email processing', process.env.REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 20,  // Keep only 20 completed jobs (reduced for storage)
    removeOnFail: 10,      // Keep only 10 failed jobs (reduced for storage)  
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 seconds delay
    },
    // Auto-remove jobs after 24 hours to save space
    ttl: 24 * 60 * 60 * 1000, 
  },
});

// Job types
const JOB_TYPES = {
  SEND_BULK_EMAILS: 'send_bulk_emails',
  SEND_SINGLE_EMAIL: 'send_single_email',
};

/**
 * Add a bulk email job to the queue
 * @param {Object} jobData - Job data containing email details
 * @param {Array} jobData.emails - Array of email objects {to, subject, html, metadata}
 * @param {String} jobData.jobType - Type of job (notify_lecturers, advertise_modules)
 * @param {String} jobData.seriesId - Recruitment series ID
 * @param {Object} jobData.metadata - Additional metadata for tracking
 * @returns {Promise<Object>} Job object with ID for tracking
 */
const addBulkEmailJob = async (jobData) => {
  try {
    const job = await emailQueue.add(JOB_TYPES.SEND_BULK_EMAILS, jobData, {
      priority: jobData.priority || 1,
      delay: jobData.delay || 0,
    });

    return {
      jobId: job.id,
      queueName: emailQueue.name,
      emailCount: jobData.emails.length,
      estimatedDuration: Math.ceil(jobData.emails.length / 10) * 2,
    };
  } catch (error) {
    throw new Error('Failed to queue email job: ' + error.message);
  }
};

/**
 * Add a single email job to the queue
 * @param {Object} emailData - Single email data {to, subject, html}
 * @returns {Promise<Object>} Job object with ID for tracking
 */
const addSingleEmailJob = async (emailData) => {
  try {
    const job = await emailQueue.add(JOB_TYPES.SEND_SINGLE_EMAIL, emailData);
    return { jobId: job.id, queueName: emailQueue.name };
  } catch (error) {
    throw new Error('Failed to queue email job: ' + error.message);
  }
};

/**
 * Get job status and progress
 * @param {String} jobId - Job ID to check
 * @returns {Promise<Object>} Job status information
 */
const getJobStatus = async (jobId) => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found', message: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();
    
    return {
      jobId: job.id,
      status: state,
      progress: progress,
      data: job.data,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    };
  } catch (error) {
    console.error(`❌ Error getting job status for ${jobId}:`, error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get queue statistics
 * @returns {Promise<Object>} Queue statistics
 */
const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaiting(),
      emailQueue.getActive(),
      emailQueue.getCompleted(),
      emailQueue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  } catch (error) {
    console.error('❌ Error getting queue stats:', error);
    return { error: error.message };
  }
};

/**
 * Clean old jobs from the queue (optimized for 30MB Redis Cloud)
 * @param {Number} gracePeriod - Grace period in milliseconds (default 6 hours)
 */
const cleanOldJobs = async (gracePeriod = 6 * 60 * 60 * 1000) => {
  try {
    // More aggressive cleaning for limited storage
    await emailQueue.clean(gracePeriod, 'completed');
    await emailQueue.clean(gracePeriod, 'failed');
    await emailQueue.clean(0, 'active');  // Clean stalled active jobs
    await emailQueue.clean(0, 'waiting'); // Clean old waiting jobs if any
    
    console.log('🧹 Cleaned old jobs from email queue (Redis Cloud optimized)');
    
    // Log current queue size for monitoring
    const stats = await getQueueStats();
    console.log(`📊 Queue stats: ${stats.waiting} waiting, ${stats.active} active, ${stats.completed} completed, ${stats.failed} failed`);
  } catch (error) {
    console.error('❌ Error cleaning old jobs:', error);
  }
};

/**
 * Pause the queue (stops processing new jobs)
 */
const pauseQueue = async () => {
  try {
    await emailQueue.pause();
    console.log('⏸️ Email queue paused');
  } catch (error) {
    console.error('❌ Error pausing queue:', error);
  }
};

/**
 * Resume the queue
 */
const resumeQueue = async () => {
  try {
    await emailQueue.resume();
    console.log('▶️ Email queue resumed');
  } catch (error) {
    console.error('❌ Error resuming queue:', error);
  }
};

/**
 * Close the queue gracefully
 */
const closeQueue = async () => {
  try {
    await emailQueue.close();
    console.log('🔴 Email queue closed gracefully');
  } catch (error) {
    console.error('❌ Error closing queue:', error);
  }
};

module.exports = {
  emailQueue,
  JOB_TYPES,
  addBulkEmailJob,
  addSingleEmailJob,
  getJobStatus,
  getQueueStats,
  cleanOldJobs,
  pauseQueue,
  resumeQueue,
  closeQueue,
};