import cron from "node-cron";
import mongoose from "mongoose";
import * as EmailTemplates from "./emails";
import { transporter } from "./transporter";

const ModuleDetails = require("./models/ModuleDetails");
const User = require("./models/User");

interface ModuleReadyForApproval {
  moduleName: string;
  moduleCode: string;
  semester: number;
  coordinators: string[];
}

// Helper function to send email directly
async function sendEmail(
  templateId: string,
  recipients: string[],
  params: any,
  from = "TA Appointment System - CSE",
) {
  try {
    // Get the template function
    const templateMap: Record<string, Function> = {
      MODULES_READY_FOR_APPROVAL:
        EmailTemplates.getModulesReadyForApprovalEmail,
      // Add more templates as needed
    };

    const templateFunction = templateMap[templateId];
    if (!templateFunction) {
      throw new Error(`Template ${templateId} not found`);
    }

    const { subject, html } = templateFunction(params);

    await transporter.sendMail({
      from: `"${from}" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });

    console.log(
      `✉️ Email ${templateId} sent directly to ${recipients.join(", ")}`,
    );
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

export const startScheduler = () => {
  console.log("⏳ Scheduler started...");

  // ============================================================================
  // TASK 1: Check advertised modules and transition to 'getting documents'
  // Runs every 15 minutes
  // ============================================================================
  cron.schedule("*/15 * * * *", async () => {
    console.log(
      "🔍 [Task 1] Checking advertised modules with passed application deadlines...",
    );
    const now = new Date();

    try {
      // Find all advertised modules with passed application deadline
      const modulesToUpdate = await ModuleDetails.find({
        moduleStatus: "advertised",
        applicationDueDate: { $lte: now },
      }).populate("coordinators", "name email");

      if (modulesToUpdate.length === 0) {
        console.log("✅ [Task 1] No modules to update");
        return;
      }

      const modulesWithUnreviewedApplications: ModuleReadyForApproval[] = [];
      console.log(
        `📦 [Task 1] Found ${modulesToUpdate.length} module(s) to update`,
      );

      // Update each module and send emails if needed
      for (const module of modulesToUpdate) {
        // Update status
        module.moduleStatus = "getting documents";
        await module.save();

        console.log(
          `✅ [Task 1] Updated module ${module.moduleCode} to 'getting documents'`,
        );

        let shouldSendEmail3 = false;
        if (module.openForUndergraduates) {
          shouldSendEmail3 =
            module.undergraduateCounts.applied >
            module.undergraduateCounts.reviewed;
        }
        if (!shouldSendEmail3 && module.openForPostgraduates) {
          shouldSendEmail3 =
            module.postgraduateCounts.applied >
            module.postgraduateCounts.reviewed;
        }
        // Send email to admin if not already sent
        if (shouldSendEmail3) {
          // Get admin users
          modulesWithUnreviewedApplications.push({
            moduleName: module.moduleName,
            moduleCode: module.moduleCode,
            semester: module.semester,
            coordinators: module.coordinators.map(
              (coord: any) => coord.name || coord.email,
            ),
          });
        }
      }

      const admins = await User.find({ role: "admin" }, "email");
      const adminEmails = admins
        .map((admin: any) => admin.email)
        .filter(Boolean);

      if (
        modulesWithUnreviewedApplications.length > 0 &&
        adminEmails.length > 0
      ) {
        // Queue the email
        await sendEmail("MODULES_READY_FOR_APPROVAL", adminEmails, {
          isApplicationDueDatePassed: true,
          modules: modulesWithUnreviewedApplications,
        });
        console.log(`✉️ [Task 1] Queued approval email for modules to admins`);
      }

      console.log(
        `✅ [Task 1] Completed processing ${modulesToUpdate.length} module(s)`,
      );
    } catch (err) {
      console.error("❌ [Task 1] Scheduler Error:", err);
    }
  });

  // ============================================================================
  // TASK 2: Check 'getting documents' modules and transition to 'closed'
  // Runs every 30 minutes
  // ============================================================================
  cron.schedule("*/30 * * * *", async () => {
    console.log(
      '🔍 [Task 2] Checking modules in "getting documents" with passed document deadlines...',
    );
    const now = new Date();

    try {
      // Find all modules in 'getting documents' status with passed document deadline
      const result = await ModuleDetails.updateMany(
        {
          moduleStatus: "getting documents",
          documentDueDate: { $lte: now },
        },
        {
          $set: { moduleStatus: "closed" },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ [Task 2] Updated ${result.modifiedCount} module(s) to 'closed'`,
        );
      } else {
        console.log("✅ [Task 2] No modules to update");
      }
    } catch (err) {
      console.error("❌ [Task 2] Scheduler Error:", err);
    }
  });

  // ============================================================================
  // TASK 3: Daily task at 9:00 PM
  // Send reminder emails or perform daily checks
  // ============================================================================
  cron.schedule("0 15 * * *", async () => {
    console.log("🔍 [Task 3] Running daily 9 PM task...");

    try {
      // Example: Send reminders for modules nearing deadlines
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Send Email 3
      const applicationFullModules = await ModuleDetails.find({
        moduleStatus: "full",
        hasEmail3Sent: false,
      }).populate("coordinators", "name email");

      const emailParamModules: ModuleReadyForApproval[] =
        applicationFullModules.map((module: any) => ({
          moduleName: module.moduleName,
          moduleCode: module.moduleCode,
          semester: module.semester,
          coordinators: module.coordinators.map(
            (coord: any) => coord.name || coord.email,
          ),
        }));

      if (emailParamModules.length > 0) {
        const admins = await User.find({ role: "admin" }, "email");
        const adminEmails = admins
          .map((admin: any) => admin.email)
          .filter(Boolean);
        if (adminEmails.length > 0) {
          await sendEmail("MODULES_READY_FOR_APPROVAL", adminEmails, {
            isApplicationDueDatePassed: false,
            modules: emailParamModules,
          }).then(async () => {
            // Mark modules as email sent
            for (const module of applicationFullModules) {
              module.hasEmail3Sent = true;
              await module.save();
            }
          });
        }
      }

      console.log(
        `📦 [Task 3] Found ${applicationFullModules.length} module(s) with deadlines tomorrow`,
      );

      // TODO: Add your custom logic here
      // Examples:
      // - Send reminder emails to students about upcoming deadlines
      // - Send reminder emails to coordinators about pending approvals
      // - Generate daily reports
      // - Clean up old data
      // - Check for modules that need attention

      console.log("✅ [Task 3] Daily task completed");
    } catch (err) {
      console.error("❌ [Task 3] Scheduler Error:", err);
    }
  });

  console.log("✅ Scheduler configuration complete:");
  console.log("   📅 Task 1: Every 15 minutes - Check advertised modules");
  console.log(
    "   📅 Task 2: Every 30 minutes - Check getting documents modules",
  );
  console.log("   📅 Task 3: Daily at 9:00 PM - Custom daily tasks");
};
