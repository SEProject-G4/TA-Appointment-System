import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Worker } from "bullmq";
import * as EmailTemplates from "./emails";
import { startScheduler } from "./scheduler";
import { transporter } from "./transporter";

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ta-appointment";
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB().then(() => {
  // Start the scheduler after DB connection
  startScheduler();
  console.log("✅ Background task manager initialized");
});

const TemplateMap: Record<string, Function> = {
  MODULE_NOTIFYING: EmailTemplates.getModuleNotifyingEmail,
  ADVERTISING_ONE_MODULE: EmailTemplates.getOneModuleAdvertisingEmail,
  ADVERTISING_MODULES: EmailTemplates.getModulesAdvertisingEmail,
  MODULES_READY_FOR_APPROVAL: EmailTemplates.getModulesReadyForApprovalEmail,
  APPROVE_TA_REQUESTS: EmailTemplates.getApproveTARequestsForModuleEmail,
  PROVIDE_DETAILS_FOR_APPOINTMENT:
    EmailTemplates.getProvideNecessaryDetailsForAppointmentEmail,
  TAS_READY_FOR_APPOINTMENT: EmailTemplates.getTAsReadyForAppointmentEmail,
};

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { from, recipients, params } = job.data;
    const templateId = job.name;
    console.log(`Processing ${templateId} for ${recipients.join(", ")}...`);

    const templateFunction = TemplateMap[templateId];
    if (!templateFunction) throw new Error(`Template ${templateId} not found`);

    const { subject, html } = templateFunction(params);

    await transporter.sendMail({
      from: `"${from}" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });

    console.log(`Email ${templateId} sent to ${recipients.join(", ")}`);
  },
  {
    connection: {
      host: process.env.REDDIS_HOST,
      port: process.env.REDDIS_PORT ? parseInt(process.env.REDDIS_PORT) : 6379,
      // password: process.env.REDDIS_PASSWORD,
    },
    concurrency: 5,
  }
);

worker.on("completed", (job) => console.log(`Job ${job.id} done!`));
worker.on("failed", (job, err) =>
  console.error(`Job ${job?.id} failed: ${err.message}`)
);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await worker.close();
  await mongoose.connection.close();
  console.log("✅ Shutdown complete");
  process.exit(0);
});
