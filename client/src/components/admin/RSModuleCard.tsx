import React, { useState } from "react";

import { MdMoreVert, MdClose } from "react-icons/md";
import CommonAvatar from "../../assets/images/common_avatar.jpg";
import { FiClock } from "react-icons/fi";
import { FaUserGraduate } from "react-icons/fa";

import { Checkbox } from "@headlessui/react";
import CircularProgress from "../common/CircularProgressBar";
import { useNavigate } from "react-router-dom";

import AutoSelect, { type Option } from "../../components/common/AutoSelect";

import axiosInstance from "../../api/axiosConfig";
// import { toast } from "react-hot-toast";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalProvider";

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

interface RSModuleCardProps extends ModuleDetails {
  refreshPage: () => void;
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

const AddApplicantsModal: React.FC<{ moduleData: ModuleDetails }> = ({
  moduleData,
}) => {
  const [availableStudents, setAvailableStudents] = useState<Option[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Option[]>([]);

  const { showToast } = useToast();

  const [taType, setTaType] = useState<"undergraduate" | "postgraduate" | null>(
    !moduleData.openForPostgraduates
      ? "undergraduate"
      : !moduleData.openForUndergraduates
      ? "postgraduate"
      : null
  );

  const { closeModal } = useModal();

  const fetchEligibleStudents = async (
    type: "undergraduate" | "postgraduate"
  ) => {
    try {
      const response = await axiosInstance.get(
        `/recruitment-series/${moduleData.recruitmentSeriesId}/eligible-${type}s`
      );
      const students = response.data.map((student: any) => ({
        id: student._id,
        label: student.indexNumber + " " + student.name,
        subtitle: student.email,
        picture: student.profilePicture,
      }));
      setAvailableStudents(students);
    } catch (error) {
      console.error("Error fetching eligible students:", error);
    }
  };

  const handleStudentChange = (student: Option | null) => {
    if (!student) return;

    setSelectedStudents((prev) => {
      if (prev.find((s) => s.id === student.id)) {
        return prev; // Student already selected
      }
      return [...prev, student];
    });

    setAvailableStudents((prev) => prev.filter((s) => s.id !== student.id));
  };

  const removeStudent = (student: Option) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== student.id));
    setAvailableStudents((prev) => [...prev, student]);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">
        Add {taType} Applicants to {moduleData.moduleName}
      </h2>
      {!taType && (
        <div className="flex flex-col">
          <p className="text-sm text-text-secondary">
            Which type of applicants would you like to add?
          </p>
          <div className="flex space-x-4 mt-3">
            <button
              className={`py-2 px-4 rounded hover:border-primary border-2 border-solid ${
                taType === "undergraduate"
                  ? "bg-primary text-text-inverted"
                  : "bg-white text-primary"
              }`}
              onClick={() => {
                fetchEligibleStudents("undergraduate");
                setTaType("undergraduate");
              }}
            >
              Undergraduate
            </button>
            <button
              className={`py-2 px-4 rounded hover:border-primary border-2 border-solid ${
                taType === "postgraduate"
                  ? "bg-primary text-text-inverted"
                  : "bg-white text-primary"
              }`}
              onClick={() => {
                fetchEligibleStudents("postgraduate");
                setTaType("postgraduate");
              }}
            >
              Postgraduate
            </button>
          </div>
        </div>
      )}
      {taType && (
        <div className="flex flex-col">
          <div className="flex flex-row items-center space-x-8 mb-5 mt-8">
            <label className="label">
              <span className="label-text">
                Select{" "}
                {taType === "undergraduate" ? "Undergraduate" : "Postgraduate"}
                (s)
              </span>
            </label>
            <AutoSelect
              options={availableStudents}
              selectedOption={null}
              onSelect={handleStudentChange}
              placeholder="Search by name or index or email"
              className="ml-8"
            />
          </div>
          <div className="flex flex-row flex-wrap ml-8 gap-x-3 gap-y-2 items-start mb-8 p-3 min-h-[100px] max-h-[300px] overflow-y-auto">
            {selectedStudents &&
              selectedStudents.length > 0 &&
              selectedStudents.map((student) => (
                <div
                  key={student.id}
                  className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-full drop-shadow bg-bg-card flex items-center text-text-primary space-x-3"
                >
                  {student.picture && (
                    <img
                      src={student.picture}
                      alt={student.label.toString()}
                      className="h-8 w-8 rounded-full mr-3"
                    />
                  )}
                  <div className="flex flex-col items-start">
                    <p className="text-text-primary text-sm font-semibold">
                      {student.label}
                    </p>
                    {student.subtitle && (
                      <p className="text-xs text-text-secondary">
                        {student.subtitle}
                      </p>
                    )}
                  </div>
                  <MdClose
                    className="text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                    onClick={() => removeStudent(student)}
                  />
                </div>
              ))}
          </div>
          <p className="text-sm text-text-secondary">
            {selectedStudents.length}{" "}
            {taType === "undergraduate" ? "Undergraduate" : "Postgraduate"}(s)
            selected
          </p>
          <div className="flex justify-end gap-x-3 mt-4">
            <button
              className="px-4 py-2 text-text-secondary border border-text-secondary/20 rounded-md hover:bg-text-secondary/10 transition"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-primary text-text-inverted rounded-md hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedStudents.length === 0}
              onClick={async () => {
                // Handle adding selected applicants
                console.log("Adding selected students:", selectedStudents);
                const userIds = selectedStudents.map((s) => s.id);
                try {
                  const response = await axiosInstance.post(
                    `/modules/${moduleData._id}/add-applicants`,
                    { role: taType, userIds }
                  );
                  console.log("Add applicants response:", response.data); 
                  showToast(response.data.message, "success");
                } catch (error) {
                  console.error("Error adding selected students:", error);
                  showToast("Failed to add selected students", "error");
                }

                closeModal();
              }}
            >
              Add Selected Applicants ({selectedStudents.length})
            </button>
          </div>
        </div>
      )}

      {/* Implementation for adding applicants */}
    </div>
  );
};

const RSModuleCard: React.FC<RSModuleCardProps> = ({
  _id,
  recruitmentSeriesId,
  moduleCode,
  moduleName,
  semester,
  moduleStatus,
  coordinators,
  requiredTAHours,
  openForUndergraduates,
  openForPostgraduates,
  undergraduateCounts,
  postgraduateCounts,
  requirements,
  documentDueDate,
  applicationDueDate,
  refreshPage,
}) => {
  const [marked, setMarked] = useState(false);
  const [fetchedModuleData, setFetchedModuleData] =
    useState<ModuleDetails | null>(null);

  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();

  const fetchModuleDetails = async (_id: string) => {
    try {
      const response = await axiosInstance.get(`/modules/${_id}`);
      let data: ModuleDetails;
      if (response.data.openForPostgraduates === false) {
        data = {
          postgraduateCounts: {
            required: 0,
            remaining: 0,
            applied: 0,
            reviewed: 0,
            accepted: 0,
            docSubmitted: 0,
            appointed: 0,
          },
          ...response.data,
        };
      } else if (response.data.openForUndergraduates === false) {
        data = {
          undergraduateCounts: {
            required: 0,
            remaining: 0,
            applied: 0,
            reviewed: 0,
            accepted: 0,
            docSubmitted: 0,
            appointed: 0,
          },
          ...response.data,
        };
      } else {
        data = response.data;
      }
      setFetchedModuleData(data);
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

  const notifyCoordinators = async (moduleData: ModuleDetails) => {
    // Implementation for notifying coordinators
    try {
      await axiosInstance.put(`/modules/${moduleData._id}/notify`);
      showToast(
        `Coordinators of ${moduleData.moduleCode} - ${moduleData.moduleName} are notified successfully`,
        "success"
      );
      await fetchModuleDetails(moduleData._id);
    } catch (error) {
      console.error("Error notifying coordinators:", error);
      showToast(
        `Failed to notify coordinators of ${moduleData.moduleCode} - ${moduleData.moduleName}`,
        "error"
      );
    }
  };

  const handleDeleteModule = (moduleData: ModuleDetails) => {
    // Implementation for deleting a module
  };

  const handleAdvertiseModule = async (moduleData: ModuleDetails) => {
    // Implementation for advertising a module
    try {
      await axiosInstance.put(`/modules/${moduleData._id}/advertise`);
      showToast(
        `${moduleData.moduleCode} - ${moduleData.moduleName} advertised successfully`,
        "success"
      );
      await fetchModuleDetails(moduleData._id);
    } catch (error) {
      console.error("Error advertising module:", error);
      showToast(
        `Failed to advertise module ${moduleData.moduleCode} - ${moduleData.moduleName}`,
        "error"
      );
    }
  };

  const handleViewApplications = (moduleData: ModuleDetails) => {
    // Implementation for viewing applications
  };

  const handleSendforApproval = async (moduleData: ModuleDetails) => {
    // Implementation for sending module for approval
    try {
      await axiosInstance.put(`/modules/${moduleData._id}/send-for-approval`);
      showToast(
        "Module coordinators were notified successfully to review the applications",
        "success"
      );
      await fetchModuleDetails(moduleData._id);
    } catch (error) {
      console.error("Error sending module for approval:", error);
      showToast("Failed to send module for approval", "error");
    }
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
              "outline-primary-dark text-text-primary hover:bg-primary/10 hover:text-primary-dark",
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
          {
            label: "Add Applicants",
            action: (moduleData: ModuleDetails) => {
              openModal(<AddApplicantsModal moduleData={moduleData} />, {
                showCloseButton: true,
              });
            },
            className:
              "outline-primary text-text-inverted bg-primary hover:bg-primary-light",
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
        recruitmentSeriesId,
        moduleCode,
        moduleName,
        semester,
        moduleStatus,
        coordinators,
        requiredTAHours,
        openForUndergraduates,
        openForPostgraduates,
        undergraduateCounts,
        postgraduateCounts,
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

        <p
          className="text-sm text-text-primary text-wrap flex-1 font-semibold flex items-center hover:underline cursor-pointer"
          onClick={() => {
            navigate(`/module-details/${data._id}`, {
              state: { moduleData: data },
            });
          }}
        >
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
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page rounded-md p-2 ${
            data.openForUndergraduates === false ? "opacity-100" : ""
          }`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Undergraduate TAs
          </p>
          {data.openForUndergraduates === false ? (
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
                  ((data.undergraduateCounts.required -
                    data.undergraduateCounts.remaining) /
                    data.undergraduateCounts.required) *
                  100
                }
                size="small"
                color={"blue"}
              >
                <p className="text-sm font-semibold">
                  <span className="text-text-primary text-2xl">
                    {data.undergraduateCounts.required -
                      data.undergraduateCounts.remaining}
                  </span>
                  <span className="text-text-secondary">
                    /{data.undergraduateCounts.required}
                  </span>
                </p>
              </CircularProgress>
            </>
          )}
        </div>

        <div
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page rounded-md p-2 ${
            data.openForPostgraduates === false ? "opacity-100" : ""
          }`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Postgraduate TAs
          </p>
          {data.openForPostgraduates === false ? (
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
              {data.postgraduateCounts ? (
                <CircularProgress
                  percentage={
                    data.postgraduateCounts
                      ? ((data.postgraduateCounts.required -
                          data.postgraduateCounts.remaining) /
                          data.postgraduateCounts.required) *
                        100
                      : 0
                  }
                  size="small"
                  color={"blue"}
                >
                  <p className="text-sm font-semibold">
                    <span className="text-text-primary text-2xl">
                      {data.postgraduateCounts.required -
                        data.postgraduateCounts.remaining}
                    </span>
                    <span className="text-text-secondary">
                      /{data.postgraduateCounts.required}
                    </span>
                  </p>
                </CircularProgress>
              ) : (
                <CircularProgress
                  percentage={0}
                  size="small"
                  color={"blue"}
                ></CircularProgress>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-grow justify-end flex-col items-center w-full gap-y-2 p-2">
        {getActionButtonsOnStatus(data.moduleStatus).map((button, index) => (
          <button
            key={index}
            className={`w-full py-1.5 rounded-md font-semibold text-sm outline outline-1 ${button.className}`}
            onClick={(e) => {
              e.stopPropagation();
              button.action(data);
            }}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RSModuleCard;
