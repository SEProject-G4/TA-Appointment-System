import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDDIS_HOST || 'localhost',
  port: parseInt(process.env.REDDIS_PORT || '6379'),
  password: process.env.REDDIS_PASSWORD || '',
};

const emailQueue = new Queue('email-queue', { connection });

interface ModuleNotifyingParams {
  coordName?: string;
  moduleName: string;
  moduleCode: string;
  semester: number;
}

interface AdvertisingModuleDetails {
  moduleName: string;
  moduleCode: string;
  semester: number;
  positionsCount: number;
  hoursPerWeek: number;
  applicationDeadline: string;
  docSubmittingDeadline: string;
}

interface OneModuleAdvertisingEmailParams extends AdvertisingModuleDetails {
  type: "undergraduate" | "postgraduate";
}

interface ModulesAdvertisingEmailParams {
  modules: AdvertisingModuleDetails[];
  type: "undergraduate" | "postgraduate";
  semesters: number[];
}

interface ModuleReadyForApproval {
  moduleName: string;
  moduleCode: string;
  semester: number;
  coordinators: string[];
}

interface ModuleReadyForApprovalEmailParams {
  modules: ModuleReadyForApproval[];
}

interface ApproveTARequestsForModuleParams {
  moduleName: string;
  moduleCode: string;
  semester: number;
  coordName: string;
}

interface ProvideNecessaryDetailsForAppointmentParams {
  studentName: string;
  moduleName: string;
  moduleCode: string;
  semester: number;
}

interface TAReadyForAppointment {
  index: string;
  name: string;
  email: string;
  studentType: "undergraduate" | "postgraduate";
  modules: {
    moduleName: string;
    moduleCode: string;
    hoursPerWeek: number;
  }[];
}

export const EmailService = {

  /**
   * Adds an email job to the background queue.
   * @param templateId The name of the template function (e.g., 'MODULE_NOTIFYING')
   * @param recipients The target email address array
   * @param data The parameters required by that specific template
   */
  async queueEmail(templateId: string, recipients: string[], params: any, from = "TA Appointment System - CSE") {
    try {
      await emailQueue.add(templateId, { from, recipients, params }, {
        attempts: 3, // Retry 3 times if it fails
        backoff: { type: 'exponential', delay: 5000 } // Wait 5s, then 10s, etc.
      });
      console.log(`Job ${templateId} queued for ${recipients.join(', ')}`);
    } catch (error) {
      console.error('Failed to queue email:', error);
    }
  },

  async enqueueModuleNotifyingEmail(
    recipients: string[],
    params: ModuleNotifyingParams
  ) {
    await this.queueEmail('MODULE_NOTIFYING', recipients, params);
  },

  async enqueueOneModuleAdvertisingEmail(
    recipients: string[],
    params: OneModuleAdvertisingEmailParams
  ) {
    await this.queueEmail('ADVERTISING_ONE_MODULE', recipients, params);
  },

  async enqueueModulesAdvertisingEmail(
    recipients: string[],
    params: ModulesAdvertisingEmailParams
  ) {
    await this.queueEmail('ADVERTISING_MODULES', recipients, params);
  },

  async enqueueModulesReadyForApprovalEmail(
    recipients: string[],
    params: ModuleReadyForApprovalEmailParams
  ) {
    await this.queueEmail('MODULES_READY_FOR_APPROVAL', recipients, params);
  },

  async enqueueApproveTARequestsForModuleEmail(
    recipients: string[],
    params: ApproveTARequestsForModuleParams
  ) {
    await this.queueEmail('APPROVE_TA_REQUESTS', recipients, params);
  },

  async enqueueProvideNecessaryDetailsForAppointmentEmail(
    recipients: string[],
    params: ProvideNecessaryDetailsForAppointmentParams
  ) {
    await this.queueEmail('PROVIDE_DETAILS_FOR_APPOINTMENT', recipients, params);
  },

  async enqueueTAsReadyForAppointmentEmail(
    recipients: string[],
    params: TAReadyForAppointment[]
  ) {
    await this.queueEmail('TAS_READY_FOR_APPOINTMENT', recipients, params);
  }

};