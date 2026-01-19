# Background Task Manager

Independent background worker for the TA Appointment System that handles:
1. Email queue processing (BullMQ)
2. Scheduled cron jobs for deadline management
3. Automated status transitions for modules

## Features

### Email Worker
Processes email jobs from the Redis queue and sends emails using Nodemailer.

### Scheduled Tasks

#### Task 1: Check Advertised Modules (Every 15 minutes)
- Finds modules with status `advertised` and `applicationDueDate` passed
- Updates module status to `getting documents`
- Sends `MODULES_READY_FOR_APPROVAL` email to admins (if not already sent)
- Marks `hasEmail3Sent` as true after email is queued

#### Task 2: Close Modules (Every 30 minutes)
- Finds modules with status `getting documents` and `documentDueDate` passed
- Updates module status to `closed`

#### Task 3: Daily Tasks (Every day at 9:00 PM)
- Runs custom daily tasks
- Example: Find modules with deadlines approaching tomorrow
- Can be customized for:
  - Sending deadline reminders to students
  - Sending reminder emails to coordinators
  - Generating daily reports
  - Data cleanup

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Required Environment Variables:**
   - `MONGO_URI` - MongoDB connection string
   - `REDDIS_HOST` - Redis host for BullMQ
   - `REDDIS_PORT` - Redis port (default: 6379)
   - `EMAIL_USER` - Gmail account for sending emails
   - `EMAIL_PASS` - Gmail app-specific password
   - `FRONTEND_URL` - Frontend URL for email links

## Running

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Architecture

```
worker.ts
├── Connects to MongoDB
├── Initializes BullMQ Worker
├── Starts Scheduler
└── Handles graceful shutdown

scheduler.ts
├── Task 1: Check advertised modules → getting documents
├── Task 2: Check getting documents → closed
└── Task 3: Daily tasks at 9 PM

emails.ts
└── Email templates (HTML generation)
```

## Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Examples:
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes
- `0 21 * * *` - Daily at 9:00 PM (21:00)
- `0 9 * * 1` - Every Monday at 9:00 AM

## Customizing Task 3

To add custom logic to the daily 9 PM task, edit `scheduler.ts`:

```typescript
cron.schedule('0 21 * * *', async () => {
  // Your custom logic here
  
  // Example: Send reminders
  const admins = await User.find({ role: 'admin' });
  await queueEmail('CUSTOM_TEMPLATE', adminEmails, { data });
  
  // Example: Generate reports
  const report = await generateDailyReport();
  
  // Example: Clean up old data
  await cleanupExpiredSessions();
});
```

## Email Templates

Available email templates:
- `MODULE_NOTIFYING` - Notify coordinators to enter TA requests
- `ADVERTISING_ONE_MODULE` - Single module advertisement to students
- `ADVERTISING_MODULES` - Multiple modules advertisement to students
- `MODULES_READY_FOR_APPROVAL` - Notify admins of modules ready for approval
- `APPROVE_TA_REQUESTS` - Notify coordinators to approve TA requests
- `PROVIDE_DETAILS_FOR_APPOINTMENT` - Notify approved TAs to provide details
- `TAS_READY_FOR_APPOINTMENT` - Notify admin of TAs ready for appointment

## Monitoring

The worker logs all activities:
- ✅ Success indicators
- ❌ Error indicators
- 🔍 Search/check operations
- 📦 Data found
- ✉️ Email operations
- 📅 Scheduled task execution

## Graceful Shutdown

Press `Ctrl+C` to trigger graceful shutdown:
1. Closes BullMQ worker
2. Closes MongoDB connection
3. Exits process cleanly

## Troubleshooting

### Worker not processing jobs
- Check Redis connection (`REDDIS_HOST`, `REDDIS_PORT`)
- Verify queue name matches ("email-queue")

### Emails not sending
- Verify Gmail credentials
- Ensure app-specific password is used (not regular password)
- Check Gmail "Less secure app access" or use OAuth2

### Scheduler not running
- Check MongoDB connection
- Verify cron syntax
- Check server time zone for daily tasks

### Database queries failing
- Ensure MongoDB is running
- Verify `MONGO_URI` is correct
- Check model schemas match database collections
