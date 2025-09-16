import React, { useState } from "react";

import { MdMoreVert } from "react-icons/md";
import CommonAvatar from "../../assets/images/common_avatar.jpg";
import { FiClock } from "react-icons/fi";
import { FaUserGraduate } from "react-icons/fa";

import { Checkbox } from "@headlessui/react";
import CircularProgress from "../common/CircularProgressBar";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosConfig";
// import { toast } from "react-hot-toast";
import { useToast } from "../../contexts/ToastContext";

interface RSModuleCardProps {
  _id: string;
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
  requiredTAHours: number;
  requiredUndergraduateTACount: number;
  requiredPostgraduateTACount: number;
  appliedUndergraduateCount: number;
  appliedPostgraduateCount: number;
  requirements: string;
  documentDueDate: string;
  applicationDueDate: string;
  refreshPage: () => void;
}

interface ModuleDetails {
  _id: string;
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
  requiredTAHours: number;
  requiredUndergraduateTACount: number;
  requiredPostgraduateTACount: number;
  appliedUndergraduateCount: number;
  appliedPostgraduateCount: number;
  requirements: string;
  documentDueDate: Date;
  applicationDueDate: Date;
}

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

const RSModuleCard: React.FC<RSModuleCardProps> = ({
  _id,
  moduleCode,
  moduleName,
  semester,
  moduleStatus,
  coordinators,
  requiredTAHours,
  appliedUndergraduateCount,
  appliedPostgraduateCount,
  requirements,
  requiredUndergraduateTACount,
  requiredPostgraduateTACount,
  documentDueDate,
  applicationDueDate,
  refreshPage,
}) => {
  const [marked, setMarked] = useState(false);
  const [fetchedModuleData, setFetchedModuleData] =
    useState<ModuleDetails | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchModuleDetails = async (_id: string) => {
    try {
      const response = await axiosInstance.get(`/modules/${_id}`);
      setFetchedModuleData(response.data);
    } catch (error) {
      console.error("Error fetching module details:", error);
      showToast("Failed to fetch module details", "error");
    }
  };

  const updateModuleStatus = async (id: string, newStatus: string) => {
    console.log(`Updating module ${id} status to ${newStatus}`);
    try {
      await axiosInstance.put(`/modules/${id}/change-status`, {
        status: newStatus,
      });
      showToast("Module status updated successfully", "success");
    } catch (error) {
      console.error("Error updating module status:", error);
      showToast("Failed to update module status", "error");
    }
  };

  const handleEditModule = (moduleData: ModuleDetails) => {
    navigate(`/edit-module/${moduleData._id}`, { state: { moduleData } });
  };

  const notifyCoordinators = (moduleData: ModuleDetails) => {
    // Implementation for notifying coordinators
    updateModuleStatus(moduleData._id, "pending changes");
  };

  const handleDeleteModule = (moduleData: ModuleDetails) => {
    // Implementation for deleting a module
  };

  const handleAdvertiseModule = (moduleData: ModuleDetails) => {
    // Implementation for advertising a module
    updateModuleStatus(moduleData._id, "advertised");
  };

  const handleViewApplications = (moduleData: ModuleDetails) => {
    // Implementation for viewing applications
  };

  const handleSendforApproval = (moduleData: ModuleDetails) => {
    // Implementation for sending module for approval
  };

  const handleCopyModule = (moduleData: ModuleDetails) => {
    // Implementation for copying a module
  };

  const getActionButtonsOnStatus = (status: string) => {
    switch (status) {
      case "initialised":
        return [
          {
            label: "Edit",
            action: handleEditModule,
            className:
              "outline-text-secondary text-text-primary hover:bg-text-secondary hover:text-text-inverted",
          },
          {
            label: "Notify Coordinators",
            action: notifyCoordinators,
            className:
              "outline-primary text-text-inverted bg-primary hover:bg-primary-light",
          },
        ];
      case "pending changes":
        return [
          {
            label: "Edit",
            action: handleEditModule,
            className:
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
          },
        ];
      case "changes submitted":
        return [
          {
            label: "Edit",
            action: handleEditModule,
            className:
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
          },
          {
            label: "Advertise",
            action: handleAdvertiseModule,
            className:
              "outline-primary text-text-inverted bg-primary hover:bg-primary-light",
          },
        ];
      case "advertised":
        return [
          {
            label: "View Applications",
            action: handleViewApplications,
            className:
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
          },
        ];
      case "full":
        return [
          {
            label: "View Applications",
            action: handleViewApplications,
            className:
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
          },
          {
            label: "Send for Approval",
            action: handleSendforApproval,
            className:
              "outline-primary text-text-inverted bg-primary hover:bg-primary-light",
          },
        ];
      case "getting-documents":
        return [
          {
            label: "View Applications",
            action: handleViewApplications,
            className:
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
          },
        ];
      case "closed":
        return [
          {
            label: "Copy Module",
            action: handleCopyModule,
            className:
              "outline-primary text-text-inverted bg-primary hover:bg-primary-light",
          },
          {
            label: "Delete",
            action: handleDeleteModule,
            className:
              "outline-warning text-warning hover:bg-warning hover:text-text-inverted",
          },
        ];
      default:
        return [];
    }
  };

  const data: ModuleDetails = fetchedModuleData
    ? fetchedModuleData
    : {
        _id,
        moduleCode,
        moduleName,
        semester,
        moduleStatus,
        coordinators,
        requiredTAHours,
        requiredUndergraduateTACount,
        requiredPostgraduateTACount,
        appliedUndergraduateCount,
        appliedPostgraduateCount,
        requirements,
        documentDueDate: new Date(documentDueDate),
        applicationDueDate: new Date(applicationDueDate),
      };

  return (
    <div className="hover:shadow-xl flex flex-col p-3 gap-y-2 rounded-md drop-shadow-xl bg-bg-card w-[400px]">
      <div className="flex items-start w-full gap-x-2">
        <Checkbox
          checked={marked}
          onChange={setMarked}
          className="cursor-pointer group block size-4 rounded border bg-primary-light/10 transition data-[checked]:bg-primary"
        >
          <svg
            className="stroke-bg-card opacity-0 transition group-data-[checked]:opacity-100"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Checkbox>

        <p className="text-sm text-text-primary text-wrap flex-1 font-semibold flex items-center">
          {data.moduleCode} - {data.moduleName} [Semester {data.semester}]
        </p>
        <p
          className={`ml-2 text-xs font-semibold px-3 py-1 rounded-xl text-center ${getClassForStatus(
            data.moduleStatus
          )}`}
        >
          {(() => {
            const words = (
              data.moduleStatus.charAt(0).toUpperCase() +
              data.moduleStatus.slice(1)
            ).split(" ");
            if (words.length > 1) {
              return (
                <>
                  {words[0]}
                  <br />
                  {words.slice(1).join(" ")}
                </>
              );
            }
            return words[0];
          })()}
        </p>

        <div className="dropdown dropdown-left">
          <MdMoreVert
            role="button"
            tabIndex={0}
            className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-5 w-5 p-0.5"
          />
          {/* Dropdown menu */}
          <ul
            tabIndex={0}
            className="menu outline outline-text-secondary/20 outline-1 gap-y-1 mt-1 z-[10] p-2 shadow dropdown-content bg-bg-card rounded-box w-52 flex"
          >
            <li className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted">
              Change deadlines
            </li>
            <li className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted">
              Change hour limits
            </li>
            <li className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted">
              Edit
            </li>
            <li className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted">
              Make a copy
            </li>
            <li className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted">
              Delete
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-start w-full gap-x-2">
        <div className="flex flex-col w-full bg-bg-page rounded-md p-2">
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Coordinators
          </p>
          <div className="mt-2 p-1 flex flex-col gap-y-1 overflow-y-auto h-[100px]">
            {data.coordinators.map((coordinator) => (
              <div key={coordinator.id} className="flex gap-x-2 items-center">
                <img
                  src={coordinator.profilePicture || CommonAvatar}
                  alt={coordinator.displayName}
                  className="rounded-full size-10"
                />
                <div className="flex flex-col items-start">
                  <p className="text-sm text-text-primary">
                    {coordinator.displayName}
                  </p>
                  <a
                    href={`mailto:${coordinator.email}`}
                    className="text-xs text-text-secondary hover:underline hover:text-primary transition"
                  >
                    {coordinator.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full bg-bg-page rounded-md p-2">
        <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
          Due dates
        </p>
        <div className="p-1 flex flex-col gap-y-1">
          <p className="text-text-secondary text-sm mt-1">
            Application:{" "}
            <span className="font-semibold text-text-primary/90">
              {new Date(data.applicationDueDate).toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
          <p className="text-text-secondary text-sm">
            Document Submission:{" "}
            <span className="font-semibold text-text-primary/90">
              {new Date(data.documentDueDate).toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="flex w-full gap-x-2 items-stretch">
        <div
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page p-2 rounded-md`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Undergraduate TAs
          </p>
          {data.requiredUndergraduateTACount === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-1 flex-1">
              <FaUserGraduate className="h-6 w-6 text-text-secondary mb-2" />
              <p className="text-sm text-text-secondary font-semibold text-center">
                No Undergraduate TAs required
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-full gap-x-2">
                <FiClock className="size-4 bg-bg-card text-text-secondary bg-transparent" />
                <p className="font-semibold text-text-secondary/90 text-sm">
                  {data.requiredTAHours}hours/week
                </p>
              </div>
              <CircularProgress
                percentage={
                  (data.appliedUndergraduateCount /
                    data.requiredUndergraduateTACount) *
                  100
                }
                size="small"
                color={
                  data.appliedUndergraduateCount >=
                  data.requiredUndergraduateTACount
                    ? "green"
                    : "blue"
                }
              >
                <p className="text-sm font-semibold">
                  <span className="text-text-primary text-2xl">
                    {data.appliedUndergraduateCount}
                  </span>
                  <span className="text-text-secondary">
                    /{data.requiredUndergraduateTACount}
                  </span>
                </p>
              </CircularProgress>
            </>
          )}
        </div>

        <div
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page rounded-md p-2 ${
            data.requiredPostgraduateTACount === 0 ? "opacity-100" : ""
          }`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Postgraduate TAs
          </p>
          {data.requiredPostgraduateTACount === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-1 flex-1">
              <FaUserGraduate className="h-6 w-6 text-text-secondary mb-2" />
              <p className="text-sm text-text-secondary font-semibold text-center">
                No Postgraduate TAs required
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-full gap-x-2">
                <FiClock className="size-4 bg-bg-card text-text-secondary" />
                <p className="font-semibold text-text-secondary/90 text-sm">
                  {data.requiredTAHours}hours/week
                </p>
              </div>
              <CircularProgress
                percentage={
                  (data.appliedPostgraduateCount /
                    data.requiredPostgraduateTACount) *
                  100
                }
                size="small"
                color={
                  data.requiredPostgraduateTACount === 0
                    ? "gray"
                    : data.appliedPostgraduateCount >=
                      data.requiredPostgraduateTACount
                    ? "green"
                    : "blue"
                }
              >
                <p className="text-sm font-semibold">
                  <span className="text-text-primary text-2xl">
                    {data.appliedPostgraduateCount}
                  </span>
                  <span className="text-text-secondary">
                    /{data.requiredPostgraduateTACount}
                  </span>
                </p>
              </CircularProgress>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-grow justify-end flex-col items-center w-full gap-y-2 p-2">
        {getActionButtonsOnStatus(data.moduleStatus ).map((button, index) => (
          <button 
            key={index}
            className={`w-full py-1.5 rounded-md font-semibold text-sm outline outline-1 ${button.className}`}
            onClick={() => button.action(data)}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RSModuleCard;
