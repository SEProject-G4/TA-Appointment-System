const { emailQueue, JOB_TYPES } = require('./jobQueue');
const emailService = require('./emailService');

/**
 * Process bulk email jobs in batches with rate limiting
 * @param {Object} job - Bull job object
 * @param {Function} done - Callback function to mark job completion
 */
const processBulkEmailJob = async (job, done) => {
  const { emails, jobType, seriesId, metadata } = job.data;
  const batchSize = 15;
  const batchDelay = 2000;
  
  const results = {
    successful: 0,
    failed: 0,
    details: [],
    startTime: new Date(),
  };

  try {
    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (email) => {
        try {
          const success = await emailService.sendEmailDirect(email.to, email.subject, email.html);
          if (success) {
            results.successful++;
            results.details.push({
              to: email.to,
              status: 'success',
              sentAt: new Date(),
              metadata: email.metadata || {},
            });
          } else {
            results.failed++;
            results.details.push({
              to: email.to,
              status: 'failed',
              reason: 'Email service returned false',
              metadata: email.metadata || {},
            });
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            to: email.to,
            status: 'failed',
            reason: error.message,
            metadata: email.metadata || {},
          });
        }
      });

      await Promise.allSettled(batchPromises);

      // Update progress
      const progress = Math.round((i + batch.length) / emails.length * 100);
      job.progress(progress);

      // Add delay between batches (except for the last batch)
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    done(null, results);

  } catch (error) {
    results.endTime = new Date();
    results.error = error.message;
    done(error, results);
  }
};

/**
 * Process single email jobs
 * @param {Object} job - Bull job object
 * @param {Function} done - Callback function to mark job completion
 */
const processSingleEmailJob = async (job, done) => {
  const { to, subject, html, metadata } = job.data;

  try {
    const success = await emailService.sendEmailDirect(to, subject, html);
    
    if (success) {
      done(null, { 
        status: 'success', 
        to, 
        sentAt: new Date(),
        metadata: metadata || {},
      });
    } else {
      throw new Error('Email service returned false');
    }
  } catch (error) {
    done(error, { 
      status: 'failed', 
      to, 
      reason: error.message,
      metadata: metadata || {},
    });
  }
};

/**
 * Set up job processors for the email queue
 */
const setupJobProcessors = () => {
  // Process bulk email jobs (reduced concurrency for cloud)
  emailQueue.process(JOB_TYPES.SEND_BULK_EMAILS, 1, processBulkEmailJob);

  // Process single email jobs (reduced concurrency for cloud)
  emailQueue.process(JOB_TYPES.SEND_SINGLE_EMAIL, 3, processSingleEmailJob);

  // Set up automatic cleanup for Redis Cloud storage optimization
  const { cleanOldJobs } = require('./jobQueue');
  
  // Clean old jobs every 2 hours to maintain storage limits
  setInterval(async () => {
    await cleanOldJobs();
  }, 2 * 60 * 60 * 1000); // Every 2 hours

  // Essential event listeners only
  emailQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed: ${error.message}`);
  });

  emailQueue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled and will be retried`);
  });
};

module.exports = {
  processBulkEmailJob,
  processSingleEmailJob,
  setupJobProcessors,
};