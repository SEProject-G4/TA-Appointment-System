import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import * as EmailTemplates from "./emails";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const TemplateMap: Record<string, Function> = {
  'MODULE_NOTIFYING': EmailTemplates.getModuleNotifyingEmail,
  'ADVERTISING_ONE_MODULE': EmailTemplates.getOneModuleAdvertisingEmail,
  'ADVERTISING_MODULES': EmailTemplates.getModulesAdvertisingEmail,
  'MODULES_READY_FOR_APPROVAL': EmailTemplates.getModulesReadyForApprovalEmail,
  'APPROVE_TA_REQUESTS': EmailTemplates.getApproveTARequestsForModuleEmail,
  'PROVIDE_DETAILS_FOR_APPOINTMENT':
    EmailTemplates.getProvideNecessaryDetailsForAppointmentEmail,
  'TAS_READY_FOR_APPOINTMENT': EmailTemplates.getTAsReadyForAppointmentEmail,
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
    connection: { host: "localhost", port: 6379 },
    concurrency: 5,
  }
);

worker.on('completed', job => console.log(`Job ${job.id} done!`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`));
