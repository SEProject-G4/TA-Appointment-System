export interface ModuleDetails {
    _id: string;
  recruitmentSeriesId: string;
  moduleCode: string;
  moduleName: string;
  semester: number;
  moduleStatus: string;
  coordinators: {
    id: string;
    displayName: string;
    email: string;
    profilePicture: string;
  }[];
  applicationDueDate: Date;
  documentDueDate: Date;
  requiredTAHours: number;
  openForUndergraduates: boolean;
  openForPostgraduates: boolean;
  hasEmail3Sent: boolean;
  sentEmail4: number;

  undergraduateCounts: {
    required: number;
    remaining: number;
    applied: number;
    reviewed: number;
    accepted: number;
    docSubmitted: number;
    appointed: number;
  };

  postgraduateCounts: {
    required: number;
    remaining: number;
    applied: number;
    reviewed: number;
    accepted: number;
    docSubmitted: number;
    appointed: number;
  };
  requirements: string;
};

