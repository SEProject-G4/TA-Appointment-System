import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";
import { useModal } from "../../contexts/ModalProvider";
import { useToast } from "../../contexts/ToastContext";

import { AiOutlineDelete } from "react-icons/ai";

import Loader from "../common/Loader";
import { AddApplicantsModal } from "./RSModuleCard";
import CommonAvatar from "../../assets/images/common_avatar.jpg";

interface Application {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    indexNumber?: string;
    profilePicture?: string;
    role: "undergraduate" | "postgraduate";
  };
  moduleId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

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
}

const getStatusClass = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-green-700 text-white";
    case "rejected":
      return "bg-red-700 text-white";
    case "pending":
      return "bg-yellow-600 text-white";
    default:
      return "bg-text-secondary/20 text-text-secondary";
  }
};

const ApplicationsTab = ({ moduleData }: { moduleData:ModuleDetails }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const undergraduateApplications = applications.filter(
    (app) => app.userId.role === "undergraduate"
  );
  const postgraduateApplications = applications.filter(
    (app) => app.userId.role === "postgraduate"
  );

  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();

  const deleteApplication = async (applicationId: string) => {
    try {
      await axiosInstance.delete(`/applications/${applicationId}`);
      showToast("Application deleted successfully.", "success");
      setApplications((prevApps) =>
        prevApps.filter((app) => app._id !== applicationId)
      );
    } catch (error) {
      console.error("Error deleting application:", error);
      showToast("Failed to delete application. Please try again.", "error");
    }
  };

  const handleDeleteApplication = (application: Application) => {
    openModal(
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p>{`Are you sure you want to delete the application for this module from the following ${application.userId.role} student?`}</p>
        <p className="text-sm text-gray-500">
          {`${application.userId.name} (${application.userId.email}) ${
            application.userId.indexNumber
              ? `- ${application.userId.indexNumber}`
              : ""
          }`}
        </p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => {
              deleteApplication(application._id);
              closeModal();
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/modules/${moduleData._id}/applications`
        );
        console.log("Fetched applications:", response.data);
        setApplications(response.data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [moduleData._id]);

  if (isLoading) {
    return (
      <div className="w-full p-4 flex flex-col gap-y-3 items-center h-[50vh] justify-center">
        <Loader className="my-6 w-full" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="w-full p-4 flex flex-col gap-y-3">
        <p className="text-text-secondary text-center py-8">
          No applications found for this module.
        </p>
      </div>
    );
  }

  const ApplicationCard = ({ application }: { application: Application }) => (
    <div
      key={application._id}
      className="flex items-start gap-x-4 py-3 px-4 outline outline-1 outline-text-secondary/50 rounded-md hover:shadow-md transition relative"
    >
      {/* Profile Picture */}
      <img
        src={application.userId.profilePicture || CommonAvatar}
        alt={application.userId.name}
        className="rounded-full size-16 border-2 border-text-secondary/70 object-cover"
      />

      {/* Applicant Info */}
      <div className="flex flex-col flex-1">
        <p className="text-md text-text-primary font-semibold">
          {application.userId.name}
        </p>
        <p className="text-sm text-text-secondary">
          {application.userId.email}
        </p>
        {application.userId.indexNumber && (
          <div className="flex">
            <p className="text-sm text-text-secondary">Index:</p>
            <p className="ml-1 text-sm font-semibold text-text-primary">
              {application.userId.indexNumber}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-end absolute right-0 bottom-0">
        <div className="w-0 h-0 border-l-[28px] border-l-transparent border-r-[0px] border-r-text-secondary/30 border-b-[30px] border-b-text-secondary/30"></div>
        <p className="h-[30px] py-0 text-sm font-semibold pr-3 flex items-center pl-2 bg-text-secondary/30 text-text-primary rounded-br-md">
          {new Date(application.createdAt)
            .toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/am|pm/gi, (match) => match.toUpperCase())}
          {" - "}
          {new Date(application.createdAt).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>

      {/* Status */}
      <div
        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
          application.status
        )}`}
      >
        {application.status.charAt(0).toUpperCase() +
          application.status.slice(1)}
      </div>

      <div className="dropdown dropdown-left">
        <AiOutlineDelete
          className="p-1 hover:bg-warning hover:text-text-inverted hover:outline-warning text-warning rounded-md inline-block h-6 w-6 cursor-pointer outline outline-2 outline-warning/50 font-semibold transition"
          onClick={() => {
            handleDeleteApplication(application);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col p-4">
    <div className="w-full flex gap-x-4">
      {/* Undergraduate Applications */}
      <div className="flex-1 flex flex-col gap-y-3">
        <h3 className="text-text-primary text-lg font-semibold mb-2 sticky top-0 z-10">
          Undergraduate Applications ({undergraduateApplications.length})
        </h3>
        <div className="flex flex-col gap-y-3 w-full overflow-y-auto px-2 py-2 max-h-[calc(100vh-200px)]">
          {undergraduateApplications.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No undergraduate applications found.
            </p>
          ) : (
            undergraduateApplications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
              />
            ))
          )}
        </div>
      </div>

      {/* Postgraduate Applications */}
      <div className="flex-1 flex flex-col gap-y-3">
        <h3 className="text-text-primary text-lg font-semibold mb-2 sticky top-0 z-10">
          Postgraduate Applications ({postgraduateApplications.length})
        </h3>
        <div className="flex flex-col gap-y-3 w-full overflow-y-auto px-2 py-2 max-h-[calc(100vh-200px)]">
          {postgraduateApplications.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No postgraduate applications found.
            </p>
          ) : (
            postgraduateApplications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
              />
            ))
          )}
        </div>
      </div>
    </div>
    <div className="mt-4 rounded-md cursor-pointer px-4 py-1 bg-primary-dark hover:bg-primary text-text-inverted w-fit" onClick={
        () => {
            openModal(<AddApplicantsModal moduleData={moduleData} />
                ,{showCloseButton: false}
            );
        }
    }>
        Add Applicants Manually
    </div>
    </div>
  );
};

export default ApplicationsTab;
