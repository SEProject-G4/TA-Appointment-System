const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

interface EmailContent {
  subject: string;
  html: string;
}

interface ModuleNotifyingParams {
  coordName?: string;
  moduleName: string;
  moduleCode: string;
  semester: number;
}

const getModuleNotifyingEmail = (
  params: ModuleNotifyingParams
): EmailContent => {
  const subject = `Please enter your TA requests for ${params.moduleCode} - ${params.moduleName} in semester ${params.semester}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>TA Request Required</h2>
        <p>Dear ${params.coordName || "Module Coordinator"},</p>
        <p>This is a reminder to submit your TA requirements for the following module:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
            <strong>Module:</strong> ${params.moduleCode} - ${
    params.moduleName
  }<br>
            <strong>Semester:</strong> ${params.semester}<br>
        </div>
        <p>Please log into the TA Appointment System to review and submit your TA requirements.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login" 
                style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access TA Appointment System
            </a>
        </div>
        <p>If you have any questions or need assistance, please contact the system administrators.</p>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

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

const getOneModuleAdvertisingEmail = (
  params: OneModuleAdvertisingEmailParams
): EmailContent => {
  const subject = `New TA Opportunities Available: ${params.moduleCode} - ${params.moduleName}`;

  const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
            <p>Dear ${
              params.type === "undergraduate" ? "Undergraduate" : "Postgraduate"
            } Student,</p>
            <p>TA positions are now available for the following module:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-left: 4px solid #28a745; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <strong style="font-size: 16px; color: #28a745;">${
                      params.moduleCode
                    } - ${params.moduleName}</strong><br>
                    <span style="color: #6c757d; font-size: 14px;">Semester: ${
                      params.semester
                    }</span><br>
                    <span style="color: #007bff; font-weight: 500;">Positions Available: ${
                      params.positionsCount
                    }</span><br>
                    <span style="color: #fd7e14; font-weight: 500;">Hours per week: ${
                      params.hoursPerWeek
                    }</span><br>
                    <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                        <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br>
                        <span style="color: #dc3545; font-size: 13px;">Application Due: ${
                          new Date(params.applicationDeadline).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        }</span><br>
                        <span style="color: #dc3545; font-size: 13px;">Document Due: ${
                          new Date(params.docSubmittingDeadline).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        }</span>
                    </div>
                </div>
            </div>

            <p>Don't miss this opportunity to gain valuable teaching experience and enhance your academic journey!</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/login" 
                   style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Apply Now
                </a>
            </div>

            <p style="font-size: 14px; color: #6c757d;">
                For questions or support, please contact the TA Appointment System administrators.
            </p>
            <p>Best regards,<br>TA Appointment System</p>
        </div>
    `;

  return { subject, html: htmlContent };
};

interface ModulesAdvertisingEmailParams {
  modules: AdvertisingModuleDetails[];
  type: "undergraduate" | "postgraduate";
  semesters: number[];
}

const getModulesAdvertisingEmail = (
  params: ModulesAdvertisingEmailParams
): EmailContent => {
  const subject = `New TA Opportunities Available for Semester${
    params.semesters.length > 1 ? "s" : ""
  } ${params.semesters.sort().join(", ")}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
        <p>Dear ${
          params.type === "undergraduate" ? "Undergraduate" : "Postgraduate"
        } Student,</p>
        <p>TA positions are now available for the following modules in semester${
          params.semesters.length > 1 ? "s" : ""
        } ${params.semesters.sort().join(", ")}:</p>
        <div style="margin: 20px 0;">
            ${params.modules
              .map(
                (module) => `
                <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 8px;">
                        <strong style="font-size: 16px; color: #28a745;">${module.moduleCode} - ${module.moduleName}</strong>
                    </div>
                    <div style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                        <span style="display: inline-block; margin-right: 15px;"><strong>Semester:</strong> ${module.semester}</span><br>
                        <span style="display: inline-block; margin-right: 15px;"><strong>Positions Available:</strong> ${module.positionsCount}</span><br>
                        <span style="display: inline-block; margin-right: 15px;"><strong>Hours per week:</strong> ${module.hoursPerWeek}</span><br>
                        <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                            <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br
                            <span style="color: #dc3545; font-size: 13px;">Application Due: ${new Date(module.applicationDeadline).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}</span><br>
                            <span style="color: #dc3545; font-size: 13px;">Document Due: ${new Date(module.docSubmittingDeadline).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}</span>
                            </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login"
                style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Apply Now
            </a>
        </div>
        <p style="font-size: 14px; color: #6c757d;">
            For questions or support, please contact the TA Appointment System administrators.
        </p>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

interface ModuleReadyForApproval {
  moduleName: string;
  moduleCode: string;
  semester: number;
  coordinators: string[];
}

interface ModulesReadyForApprovalEmailParams {
  isApplicationDueDatePassed?: boolean;
  modules: ModuleReadyForApproval[];
}

const getModulesReadyForApprovalEmail = (
  params: ModulesReadyForApprovalEmailParams
): EmailContent => {
  const subject = `Modules: Ready for Approval`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Modules Ready for Approval</h2>
        <p>Dear Admin,</p>
        <p>The following modules ${params.isApplicationDueDatePassed ? "<b>with passed application deadlines</b>" : ""} have unreviewed applications</p>
        
        <div style="margin: 20px 0;">
            ${params.modules
              .map(
                (module) => `
                <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 8px;">
                        <strong style="font-size: 16px; color: #007bff;">${
                          module.moduleCode
                        } - ${module.moduleName}</strong>
                    </div>
                    <div style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                        <span style="display: inline-block; margin-right: 15px;"><strong>Semester:</strong> ${
                          module.semester
                        }</span><br>
                        <span style="display: inline-block; margin-right: 15px;"><strong>Coordinators:</strong> ${module.coordinators.join(
                          ", "
                        )}</span>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login"
                style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Access TA Appointment System
            </a>
        </div>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

interface ApproveTARequestsForModuleParams {
  moduleName: string;
  moduleCode: string;
  semester: number;
  coordName: string;
  type: "undergraduate" | "postgraduate";
}

const getApproveTARequestsForModuleEmail = (
  params: ApproveTARequestsForModuleParams
): EmailContent => {
  const subject = `Please approve ${params.type} TA requests for ${params.moduleCode} - ${params.moduleName} in semester ${params.semester}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>TA Requests Awaiting Your Approval</h2>
        <p>Dear ${params.coordName},</p>
        <p>The ${
          params.type
        } TA requests for the following module have been submitted and are awaiting your approval:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
            <strong>Module:</strong> ${params.moduleCode} - ${
    params.moduleName
  }<br>
            <strong>Semester:</strong> ${params.semester}<br>
            <strong>Type:</strong> ${
              params.type === "undergraduate" ? "Undergraduate" : "Postgraduate"
            }<br>
        </div>
        <p>Please log into the TA Appointment System to review and approve the TA requests.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login" 
                style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access TA Appointment System
            </a>
        </div>
        <p>If you have any questions or need assistance, please contact the system administrators.</p>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

interface ProvideNecessaryDetailsForAppointmentParams {
  studentName: string;
  moduleName: string;
  moduleCode: string;
  semester: number;
}

const getProvideNecessaryDetailsForAppointmentEmail = (
  params: ProvideNecessaryDetailsForAppointmentParams
): EmailContent => {
  const subject = `Please Provide Necessary Details for Your TA Appointment in ${params.moduleCode} - ${params.moduleName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Application for TA Position in ${params.moduleCode} - ${params.moduleName} is approved!</h2>
        <p>Dear ${params.studentName},</p>
        <p>Congratulations! Your application for the TA position in the following module has been approved:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
            <strong>Module:</strong> ${params.moduleCode} - ${params.moduleName}<br>
            <strong>Semester:</strong> ${params.semester}<br>
        </div>
        <p>To proceed with your appointment, please log into the TA Appointment System and provide the necessary details.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login" 
                style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access TA Appointment System
            </a>
        </div>
        <p>If you have any questions or need assistance, please contact the system administrators.</p>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

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

const getTAsReadyForAppointmentEmail = (
  tas: TAReadyForAppointment[]
): EmailContent => {
  const subject = `TAs Ready for Appointment`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">TAs Ready for Appointment</h2>
        <p>The following TAs have provided the necessary details and are ready for appointment:</p>
        <div style="margin: 20px 0;">
            ${tas
              .map(
                (ta) => `
                <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 8px;">
                        <strong style="font-size: 16px; color: #28a745;">${
                          ta.index
                        } - ${ta.name} (${
                  ta.studentType === "undergraduate"
                    ? "Undergraduate"
                    : "Postgraduate"
                })</strong>
                    </div>
                    <div style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                        ${ta.modules
                          .map(
                            (module) => `
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; margin-right: 15px;"><strong>Module:</strong> ${module.moduleCode} - ${module.moduleName}</span><br>
                                <span style="display: inline-block;"><strong>Hours per week:</strong> ${module.hoursPerWeek}</span>
                            </div>`
                          )
                          .join("")}
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login"
                style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Access TA Appointment System
            </a>
        </div>
        <p>Best regards,<br>TA Appointment System</p>
    </div>
`;
  return { subject, html: htmlContent };
};

export {
  getModuleNotifyingEmail,
  getOneModuleAdvertisingEmail,
  getModulesAdvertisingEmail,
  getModulesReadyForApprovalEmail,
  getApproveTARequestsForModuleEmail,
  getProvideNecessaryDetailsForAppointmentEmail,
  getTAsReadyForAppointmentEmail,
};
