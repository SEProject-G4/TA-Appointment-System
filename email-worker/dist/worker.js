"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
const nodemailer_1 = __importDefault(require("nodemailer"));
const EmailTemplates = __importStar(require("./emails"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const TemplateMap = {
    MODULE_NOTIFYING: EmailTemplates.getModuleNotifyingEmail,
    ADVERTISING_ONE_MODULE: EmailTemplates.getOneModuleAdvertisingEmail,
    ADVERTISING_MODULES: EmailTemplates.getModulesAdvertisingEmail,
    MODULES_READY_FOR_APPROVAL: EmailTemplates.getModulesReadyForApprovalEmail,
    APPROVE_TA_REQUESTS: EmailTemplates.getApproveTARequestsForModuleEmail,
    PROVIDE_DETAILS_FOR_APPOINTMENT: EmailTemplates.getProvideNecessaryDetailsForAppointmentEmail,
    TAS_READY_FOR_APPOINTMENT: EmailTemplates.getTAsReadyForAppointmentEmail,
};
const worker = new bullmq_1.Worker("email-queue", async (job) => {
    const { from, recipients, params } = job.data;
    const templateId = job.name;
    console.log(`Processing ${templateId} for ${recipients.join(", ")}...`);
    const templateFunction = TemplateMap[templateId];
    if (!templateFunction)
        throw new Error(`Template ${templateId} not found`);
    const { subject, html } = templateFunction(params);
    await transporter.sendMail({
        from: `"${from}" <${process.env.EMAIL_USER}>`,
        to: recipients,
        subject,
        html,
    });
    console.log(`Email ${templateId} sent to ${recipients.join(", ")}`);
}, {
    connection: {
        host: process.env.REDDIS_HOST,
        port: process.env.REDDIS_PORT ? parseInt(process.env.REDDIS_PORT) : 6379,
        password: process.env.REDDIS_PASSWORD,
    },
    concurrency: 5,
});
worker.on("completed", (job) => console.log(`Job ${job.id} done!`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`));
