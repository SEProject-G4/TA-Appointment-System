import CommonAvatar from "../../assets/images/common_avatar.jpg";

interface ModuleDetails {
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
  
  undergraduateCounts: {
    required: number;
    remaining: number;
    applied: number;
    reviewed: number;
    accepted: number;
    docSubmitted: number;
    appointed: number;
  } ;

  postgraduateCounts: {
    required: number;
    remaining: number;
    applied: number;
    reviewed: number;
    accepted: number;
    docSubmitted: number;
    appointed: number;
  } ;
  requirements: string;
}

const ProgressBar = ({
  label,
  value,
  maxValue,
  upperLimit,
  requiredValue,
}: {
  label: string;
  value: number;
  maxValue: number;
  upperLimit: number;
  requiredValue: number;
}) => {
  const solidWidth = (value / maxValue) * 100;
  const shadeWidth = (maxValue / upperLimit) * 100;

  return (
    <div className="p-0 flex flex-col gap-y-2 w-full">
      <div className="flex items-start w-full">
        <p className="flex flex-1 text-text-primary">{label}</p>
        <p className="font-semibold">
          {value === requiredValue ? value : `${value} / ${maxValue}`}
        </p>
      </div>

      <div className="w-full flex justify-start p-0">
        <div
          className="w-full h-2 p-0 m-0 bg-text-secondary/20 flex justify-start rounded-full"
          style={{ width: `${shadeWidth}%` }}
        >
          <div
            className="h-2 m-0 bg-primary rounded-full transition-all"
            style={{ width: `${solidWidth}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const getClassForStatus = (status: string) => {
  switch (status) {
    case "initialised":
      return "bg-primary-light/20 text-primary";
    case "pending changes":
      return "bg-yellow-100 text-yellow-800";
    case "changes submitted":
      return "bg-lime-100 text-lime-800";
    case "advertised":
      return "bg-purple-100 text-purple-800";
    case "full":
      return "bg-green-100 text-green-800";
    case "getting-documents":
      return "bg-pink-100 text-pink-800";
    case "closed":
      return "bg-black text-white";
    default:
      return "bg-text-secondary/20 text-text-secondary";
  }
};

const BasicModuleInfoTab = ({ moduleData }: { moduleData: ModuleDetails }) => {
  const undergradUpperLimit = moduleData.undergraduateCounts.applied > moduleData.undergraduateCounts.required ? moduleData.undergraduateCounts.applied : moduleData.undergraduateCounts.required;
  const postgradUpperLimit = moduleData.postgraduateCounts.applied > moduleData.postgraduateCounts.required ? moduleData.postgraduateCounts.applied : moduleData.postgraduateCounts.required;
  
  return (
    <div className="w-full p-4 flex flex-col gap-y-3">
      <div className="flex w-full items-center justify-start">
        <p className="text-text-secondary text-md flex-[2] flex">
          Module Code:
          <span className="font-semibold text-text-primary ml-2">
            {moduleData.moduleCode}
          </span>
        </p>

        <p className="text-text-secondary text-md flex-1 flex">
          Semester:
          <span className="font-semibold text-text-primary ml-2">
            {moduleData.semester}
          </span>
        </p>
      </div>

      <p className="text-text-secondary text-md flex-1 flex">
        Module Name:
        <span className="font-semibold text-text-primary ml-2">
          {moduleData.moduleName}
        </span>
      </p>

      <div className="flex w-full items-center justify-start">
        <p className="text-text-secondary text-md flex-[2] flex">
          Module id:
          <span className="font-semibold text-text-primary ml-2">
            {moduleData._id}
          </span>
        </p>

        <p className="text-text-secondary text-md flex-1 flex items-center">
          Module Status:
          <span
            className={`px-3 py-1 rounded-full font-semibold text-text-primary ml-2 ${getClassForStatus(
              moduleData.moduleStatus
            )}`}
          >
            {moduleData.moduleStatus.charAt(0).toUpperCase() +
              moduleData.moduleStatus.slice(1)}
          </span>
        </p>
      </div>

      <div className="w-full flex items-start">
        <div className="flex flex-col flex-[2] rounded-md">
          <p className="w-full border-b-[0px] border-text-secondary/80 text-md text-text-secondary">
            Coordinators
          </p>
          <div className="mt-2 p-2 flex flex-col gap-y-2">
            {moduleData.coordinators.map((coordinator) => (
              <div key={coordinator.id} className="flex gap-x-2 items-center py-2 px-3 outline outline-1 outline-text-secondary/50 rounded-md w-fit">
                <img
                  src={coordinator.profilePicture || CommonAvatar}
                  alt={coordinator.displayName}
                  className="rounded-full size-10 border-2 border-text-secondary/70 object-cover"
                />
                <div className="flex flex-col items-start">
                  <p className="text-md text-text-primary font-semibold">
                    {coordinator.displayName}
                  </p>
                  <a
                    href={`mailto:${coordinator.email}`}
                    className="text-sm text-text-secondary hover:underline hover:text-primary transition"
                  >
                    {coordinator.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col flex-1 rounded-md">
          <p className="w-full border-b-[0px] border-text-secondary/80 text-md text-text-secondary">
            Due dates
          </p>
          <div className="ml-2 p-1 flex flex-col gap-y-1">
            <p className="text-text-secondary text-md mt-1">
              Application:{" "}
              <span className="font-semibold text-text-primary/90">
                {new Date(moduleData.applicationDueDate).toLocaleString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </span>
            </p>
            <p className="text-text-secondary text-md">
              Document Submission:{" "}
              <span className="font-semibold text-text-primary/90">
                {new Date(moduleData.documentDueDate).toLocaleString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-text-secondary text-md flex-1 flex items-center mt-3">
        Requirements/ Special Notes:
      </p>
      <p
        className={`px-3 py-1 rounded-md font-semibold text-text-primary mb-8 mx-2 outline outline-1 outline-text-secondary/50`}
      >
        {moduleData.requirements ||
          "N/A (No special requirements or notes specified)"}
      </p>

      <div className="w-full flex items-start gap-x-8 px-2">
        <div className="flex flex-col flex-1 rounded-md px-4 py-5 outline outline-1 outline-text-secondary/20 gap-y-3">
          <p className="text-text-primary text-2xl w-full text-center mb-2">
        Undergraduates
          </p>
          <p className="text-text-primary text-7xl w-full text-center font-raleway">
        {moduleData.undergraduateCounts.required}
          </p>
          <p className="text-text-primary text-md w-full text-center mb-2">
        Required
          </p>
          <div className="flex flex-col gap-y-8 mt-2 w-full p-2">
        <ProgressBar
          label="Applied so far"
          value={moduleData.undergraduateCounts.applied}
          maxValue={moduleData.undergraduateCounts.applied}
          upperLimit={undergradUpperLimit}
          requiredValue={moduleData.undergraduateCounts.required}
        />

        <ProgressBar
          label="Reviewed applications"
          value={moduleData.undergraduateCounts.reviewed }
          maxValue={moduleData.undergraduateCounts.applied}
          upperLimit={undergradUpperLimit}
          requiredValue={moduleData.undergraduateCounts.required}
        />

        <ProgressBar
          label="Approved applications"
          value={moduleData.undergraduateCounts.accepted}
          maxValue={moduleData.undergraduateCounts.reviewed}
          upperLimit={undergradUpperLimit}
          requiredValue={moduleData.undergraduateCounts.required}
        />

        <ProgressBar
          label="Document submitted"
          value={moduleData.undergraduateCounts.docSubmitted}
          maxValue={moduleData.undergraduateCounts.accepted}
          upperLimit={undergradUpperLimit}
          requiredValue={moduleData.undergraduateCounts.required}
        />

        <ProgressBar
          label="Appointed"
          value={moduleData.undergraduateCounts.appointed}
          maxValue={moduleData.undergraduateCounts.docSubmitted}
          upperLimit={undergradUpperLimit}
          requiredValue={moduleData.undergraduateCounts.required}
        />
          </div>
        </div>

        <div className="flex flex-col flex-1 rounded-md px-4 py-5 outline outline-1 outline-text-secondary/20 gap-y-3">
          <p className="text-text-primary text-2xl w-full text-center mb-2">
            Postgraduates
          </p>
          <p className="text-text-primary text-7xl w-full text-center font-raleway">
            {moduleData.postgraduateCounts.required}
          </p>
          <p className="text-text-primary text-md w-full text-center mb-2">
            Required
          </p>
          <div className="flex flex-col gap-y-8 mt-2 w-full p-2">
            <ProgressBar
              label="Applied so far"
              value={moduleData.postgraduateCounts.applied}
              maxValue={moduleData.postgraduateCounts.applied}
              upperLimit={postgradUpperLimit}
              requiredValue={moduleData.postgraduateCounts.required}
            />

            <ProgressBar
              label="Reviewed applications"
              value={moduleData.postgraduateCounts.reviewed}
              maxValue={moduleData.postgraduateCounts.applied}
              upperLimit={postgradUpperLimit}
              requiredValue={moduleData.postgraduateCounts.required}
            />

            <ProgressBar
              label="Approved applications"
              value={moduleData.postgraduateCounts.accepted}
              maxValue={moduleData.postgraduateCounts.reviewed}
              upperLimit={postgradUpperLimit}
              requiredValue={moduleData.postgraduateCounts.required}
            />

            <ProgressBar
          label="Document submitted"
          value={moduleData.postgraduateCounts.docSubmitted}
          maxValue={moduleData.postgraduateCounts.accepted}
          upperLimit={postgradUpperLimit}
          requiredValue={moduleData.postgraduateCounts.required}
        />

        <ProgressBar
          label="Appointed"
          value={moduleData.postgraduateCounts.appointed}
          maxValue={moduleData.postgraduateCounts.docSubmitted}
          upperLimit={postgradUpperLimit}
          requiredValue={moduleData.postgraduateCounts.required}
        />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicModuleInfoTab;
