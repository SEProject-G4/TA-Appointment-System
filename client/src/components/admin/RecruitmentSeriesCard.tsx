import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { FaChevronRight, FaRegCalendarAlt, FaBoxOpen } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { LuCirclePlus, LuMail } from "react-icons/lu";
import { FiClock } from "react-icons/fi";
import { HiSpeakerphone, HiBell } from "react-icons/hi";

import { useModal } from "../../contexts/ModalProvider";
import { useToast } from "../../contexts/ToastContext";

import CopyRSModal from "./CopyRSModal";
import ChangeDeadlineModal from "./ChangeDeadlineModal";
import ChangeHourLimitsModal from "./ChangeHourLimitsModal";
import RSModuleCard from "./RSModuleCard";
import Loader from "../common/Loader";

import axiosInstance from "../../api/axiosConfig";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface RecruitmentSeriesCardProps {
  _id: string;
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
  status: "initialised" | "active" | "closed" | "archived";
  moduleCount: number;
  undergraduateTAPositionsCount: number;
  postgraduateTAPositionsCount: number;
  className?: string;
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



const getClassForStatus = (status: string) => {
  switch (status) {
    case "initialised":
      return "bg-primary-light/20 text-primary";
    case "published":
      return "bg-green-100 text-green-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-orange-100 text-orange-800";
    case "archived":
      return "bg-text-secondary/80 text-text-primary";
    default:
      return "";
  }
};

const RecruitmentSeriesCard: React.FC<RecruitmentSeriesCardProps> = ({
  _id,
  name,
  applicationDueDate,
  documentDueDate,
  undergradHourLimit,
  postgradHourLimit,
  undergradMailingList,
  postgradMailingList,
  status,
  moduleCount,
  undergraduateTAPositionsCount,
  postgraduateTAPositionsCount,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(
    status === "initialised" || status === "active"
  );
  const [moduleDetails, setModuleDetails] = useState<ModuleDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();

  const changesSubmittedModules = moduleDetails.filter(mod => mod.moduleStatus === 'changes submitted');
  const initialisedModules = moduleDetails.filter(mod => mod.moduleStatus === 'initialised');

  const refreshModuleDetails = () => {
    setHasFetched(false);
  };

  const fetchModuleDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/recruitment-series/${_id}/modules`
      );
      setModuleDetails(response.data);
      console.log(response.data);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching module details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const notifyModules = async () => {
    try {
      const response = await axiosInstance.post(`/recruitment-series/${_id}/notify-modules`);
      const { summary, details } = response.data;
      
      if (summary.successful > 0) {
        const successModules = details.filter((d: any) => d.status === 'success');
        const moduleNames = successModules.map((d: any) => d.moduleCode).join(', ');
        const totalEmails = successModules.reduce((sum: number, d: any) => sum + (d.recipientCount || 0), 0);
        
        showToast(
          `Successfully notified ${summary.successful} module(s): ${moduleNames}. ${totalEmails} emails sent to coordinators.`,
          "success"
        );
        
        if (summary.failed > 0) {
          const failedModules = details.filter((d: any) => d.status === 'failed');
          const failedNames = failedModules.map((d: any) => d.moduleCode).join(', ');
          showToast(
            `Failed to notify ${summary.failed} module(s): ${failedNames}`,
            "info"
          );
        }
      } else {
        showToast("No modules could be notified. Please check module status and coordinator assignments.", "error");
      }
      
      // Refresh module details to update status
      refreshModuleDetails();
    } catch (error: any) {
      console.error("Error notifying module coordinators:", error);
      if (error.response?.data?.error) {
        showToast(error.response.data.error, "error");
      } else {
        showToast("Failed to notify module coordinators.", "error");
      }
    }
  };

  const advertiseModules = async () => {
    try {
      const response = await axiosInstance.post(`/recruitment-series/${_id}/advertise-modules`);
      const { summary, emailResults } = response.data;
      
      if (summary.totalEmailsSent > 0) {
        let detailMessage = `Successfully advertised ${summary.modulesProcessed} module(s) to ${summary.totalEmailsSent} students`;
        
        if (summary.undergradModules > 0 && summary.postgradModules > 0) {
          detailMessage += ` (${summary.undergradModules} undergraduate + ${summary.postgradModules} postgraduate modules)`;
        } else if (summary.undergradModules > 0) {
          detailMessage += ` (${summary.undergradModules} undergraduate modules)`;
        } else if (summary.postgradModules > 0) {
          detailMessage += ` (${summary.postgradModules} postgraduate modules)`;
        }
        
        // Add email group breakdown
        const emailBreakdown = emailResults.map((result: any) => {
          return `${result.recipientCount} ${result.type}s`;
        }).join(' + ');
        
        if (emailBreakdown) {
          detailMessage += `. Emails sent to: ${emailBreakdown}`;
        }
        
        showToast(detailMessage, "success");
        
        // Show any failed email groups
        const failedResults = emailResults.filter((result: any) => !result.success);
        if (failedResults.length > 0) {
          const failedGroups = failedResults.map((result: any) => result.type).join(', ');
          showToast(`Failed to send emails to: ${failedGroups}`, "info");
        }
      } else {
        showToast("No advertisement emails were sent. Please check module status and student groups.", "error");
      }
      
      // Refresh module details to update status
      refreshModuleDetails();
    } catch (error: any) {
      console.error("Error advertising modules:", error);
      if (error.response?.data?.error) {
        showToast(error.response.data.error, "error");
      } else {
        showToast("Failed to advertise modules.", "error");
      }
    }
  };

  const handleDeleteRS = () => {
    openModal(
      <div className="flex flex-col items-center py-4 px-6">
        <h2 className="text-lg font-semibold mb-4">Delete Recruitment Round</h2>
        <p className="text-warning font-semibold mb-2">This action will delete all associated modules, associated applications, and any other related data.</p>
        <p>Are you sure you want to delete this recruitment series?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-warning hover:bg-warning text-warning hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.delete(`/recruitment-series/${_id}`);
                if(response.status === 200) {
                  showToast("Recruitment series deleted successfully with all its associated data.", "success");
                  closeModal();
                }
                // Optionally refresh the list or provide feedback
              } catch (error) {
                console.error("Error deleting recruitment series:", error);
              }
            }}
          >
            Delete
          </button>
          <button className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold" onClick={() => closeModal()}>
            Cancel
          </button>
        </div>
      </div>
    ,{ showCloseButton: false });
  };

  const handleCloseRecruitmentRound = () => {
    openModal(
      <div className="flex flex-col items-center py-4 px-6">
        <h2 className="text-lg font-semibold mb-4">Close Recruitment Round</h2>
        <p className="text-warning font-semibold mb-2">This action will close all recruitments under this recruitment round.</p>
        <p className="mb-2">All modules in this recruitment series will be marked as 'closed' and the recruitment round status will change to 'closed'.</p>
        <p>Are you sure you want to close this recruitment round?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-orange-600 hover:bg-orange-600 text-orange-600 hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.put(`/recruitment-series/${_id}/close`);
                if(response.status === 200) {
                  showToast("Recruitment round closed successfully.", "success");
                  closeModal();
                  refreshModuleDetails(); // Refresh to show updated status
                }
              } catch (error: any) {
                console.error("Error closing recruitment round:", error);
                const errorMessage = error.response?.data?.error || "Failed to close recruitment round";
                showToast(errorMessage, "error");
              }
            }}
          >
            Close Recruitment Round
          </button>
          <button className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold" onClick={() => closeModal()}>
            Cancel
          </button>
        </div>
      </div>
    ,{ showCloseButton: false });
  };

  const handleArchiveRecruitmentRound = () => {
    openModal(
      <div className="flex flex-col items-center py-4 px-6">
        <h2 className="text-lg font-semibold mb-4">Archive Recruitment Round</h2>
        <p className="mb-2">This action will archive this recruitment round. Archived recruitment rounds can only be copied or deleted.</p>
        <p>Are you sure you want to archive this recruitment round?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-gray-600 hover:bg-gray-600 text-gray-600 hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.put(`/recruitment-series/${_id}/archive`);
                if(response.status === 200) {
                  showToast("Recruitment round archived successfully.", "success");
                  closeModal();
                  refreshModuleDetails(); // Refresh to show updated status
                }
              } catch (error: any) {
                console.error("Error archiving recruitment round:", error);
                const errorMessage = error.response?.data?.error || "Failed to archive recruitment round";
                showToast(errorMessage, "error");
              }
            }}
          >
            Archive Recruitment Round
          </button>
          <button className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold" onClick={() => closeModal()}>
            Cancel
          </button>
        </div>
      </div>
    ,{ showCloseButton: false });
  };

  // Dynamic dropdown menu items based on status
  const getDropdownItems = () => {
    const baseItems = [
      {
        label: "Make a copy",
        onClick: handleCopyRS,
        show: true
      }
    ];

    switch (status) {
      case "initialised":
      case "active":
        return [
          {
            label: "Change deadlines",
            onClick: handleChangeDeadlines,
            show: true
          },
          {
            label: "Change hour limits", 
            onClick: handleChangeHourLimits,
            show: true
          },
          {
            label: "Edit",
            onClick: () => {}, // TODO: Implement edit functionality
            show: true
          },
          ...baseItems,
          {
            label: "Close recruitment round",
            onClick: handleCloseRecruitmentRound,
            show: true
          }
        ];
      
      case "closed":
        return [
          ...baseItems,
          {
            label: "Archive recruitment round",
            onClick: handleArchiveRecruitmentRound,
            show: true
          }
        ];
      
      case "archived":
        return [
          ...baseItems,
          {
            label: "Delete recruitment round",
            onClick: handleDeleteRS,
            show: true
          }
        ];
      
      default:
        return baseItems;
    }
  };

  const handleChangeDeadlines = () => {
    openModal(
      <ChangeDeadlineModal
        recruitmentSeriesId={_id}
        recruitmentSeriesName={name}
        currentApplicationDueDate={applicationDueDate}
        currentDocumentDueDate={documentDueDate}
        onSuccess={refreshModuleDetails}
      />,
      { showCloseButton: false }
    );
  };

  const handleChangeHourLimits = () => {
    openModal(
      <ChangeHourLimitsModal
        recruitmentSeriesId={_id}
        recruitmentSeriesName={name}
        currentUndergradHourLimit={undergradHourLimit}
        currentPostgradHourLimit={postgradHourLimit}
        onSuccess={refreshModuleDetails}
      />,
      { showCloseButton: false }
    );
  };

  const handleCopyRS = () => {
    openModal(
      <CopyRSModal
        recruitmentSeriesData={{
          _id,
          name,
          applicationDueDate,
          documentDueDate,
          undergradHourLimit,
          postgradHourLimit,
        }}
        modules={moduleDetails.map((mod) => {
          return {
            _id: mod._id,
            label:
              mod.moduleCode +
              " - " +
              mod.moduleName +
              " [Semester " +
              mod.semester +
              "]",
          };
        })}
      />,
      {
        showCloseButton: false,
      }
    );
  };

  useEffect(() => {
    if (isExpanded && !hasFetched) {
      fetchModuleDetails();
    }
  }, [isExpanded, hasFetched]);

  return (
    <div
      className={`flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-2 pb-3 ${className}`}
    >
      <div className="flex flex-row w-full items-center">
        <FaChevronRight
          className={`p-1 h-6 w-6 rounded-full hover:bg-primary-light/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
            isExpanded ? "rotate-90" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        />
        <div className="flex flex-1 flex-col w-full ml-2">
          <p className="flex w-full select-none text-md font-semibold">
            {name}
            <span
              className={`ml-2 text-xs items-center flex flex-col justify-center px-2 rounded-full ${getClassForStatus(
                status
              )}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </p>
          {/* <p className="mt-1 text-xs text-text-secondary font-semibold">10 module recruitments, 20 undergraduate TA positions, 10 postgraduate TA positions</p> */}
        </div>
        {isExpanded && (
          <div className="dropdown dropdown-left">
            <MdMoreVert
              role="button"
              tabIndex={0}
              className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-6 w-6 p-0.5"
            />
            {/* Dropdown menu */}
            <ul
              tabIndex={0}
              className="menu outline outline-text-secondary/20 outline-1 gap-y-1 mt-1 z-[10] p-2 shadow dropdown-content bg-bg-card rounded-box w-52 flex"
            >
              {getDropdownItems().map((item, index) => (
                item.show && (
                  <li 
                    key={index}
                    className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex w-full items-start mt-4 gap-x-2 px-1">
        <div className="flex flex-col relative outline outline-1 outline-text-secondary/80 rounded-sm py-2 px-4">
          <FiClock className="absolute left-2 -top-2 h-4 w-8 bg-bg-card px-2 text-text-secondary" />
          <p className="text-text-secondary text-sm mt-1 flex-grow">
            Undergraduate:{" "}
            <span className="font-semibold text-text-primary/90">
              {undergradHourLimit}H
            </span>
          </p>
          <p className="text-text-secondary text-sm flex-grow">
            Postgraduate:{" "}
            <span className="font-semibold text-text-primary/90">
              {postgradHourLimit}H
            </span>
          </p>
        </div>
        <div className="flex flex-col relative outline outline-1 outline-text-secondary/80 rounded-sm py-2 px-4">
          <FaRegCalendarAlt className="absolute left-2 -top-2 h-4 w-8 bg-bg-card px-2 text-text-secondary" />
          <p className="text-text-secondary text-sm mt-1">
            Application:{" "}
            <span className="font-semibold text-text-primary/90">
              {new Date(applicationDueDate).toLocaleString(undefined, {
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
              {new Date(documentDueDate).toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
        </div>
        <div className="flex flex-col flex-1 relative outline outline-1 outline-text-secondary/80 rounded-sm py-2 px-4">
          <LuMail className="absolute left-2 -top-2 h-4 w-8 bg-bg-card px-2 text-text-secondary" />
          <p className="text-text-secondary text-sm mt-1">
            Undergraduate:{" "}
            <span className="font-semibold text-text-primary/90">
              {undergradMailingList
                .map((group) => group.name + "(" + group.userCount + " users)")
                .join(", ") || "None"}
            </span>
          </p>
          <p className="text-text-secondary text-sm">
            Postgraduate:{" "}
            <span className="font-semibold text-text-primary/90">
              {postgradMailingList
                .map((group) => group.name + "(" + group.userCount + " users)")
                .join(", ") || "None"}
            </span>
          </p>
        </div>
      </div>
      <div
        className={`${
          isExpanded ? "flex opacity-100" : "hidden max-h-0 opacity-0"
        } transition-all p-1 ease-in-out duration-1000 flex-col items-center w-full`}
      >
        <div
          className={`w-full pt-4 mt-4 flex ${
            isLoading ? "flex-col items-center" : "flex-row items-start"
          } flex-wrap relative outline outline-1 outline-text-secondary/80 rounded-sm justify-start content-start`}
        >
          <p className="absolute left-2 -top-2 h-4 bg-bg-card px-2 text-text-primary flex items-center">
            Modules
          </p>
          {/* <div className="px-3 w-full flex justify-start items-center">
              <p className="text-sm text-text-secondary">Filters: </p>
            </div> */}
          {isLoading ? (
            <Loader className="my-5 w-full" />
          ) : (
            <>
              {moduleDetails.length > 0 ? (
                <div className="flex px-4 pb-3 gap-y-5 justify-start gap-x-2 overflow-x-hidden flex-wrap">
                  {moduleDetails.map((module) => (
                    <RSModuleCard
                      key={module._id}
                      {...module}
                      refreshPage={refreshModuleDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-6">
                  <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                  <p className="text-lg text-text-secondary font-semibold">
                    No modules to show.
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Start by adding a module to this recruitment series.
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex px-3 py-2 mt-4 w-full border-text-secondary/50 border-t-[1px] border-solid items-end justify-end">
            {/* <p className="text-sm text-text-secondary">
                Selected: <span className="text-text-primary">2 modules</span>
              </p> */}
            <div className="flex gap-x-2">
              {/* Notify Lecturers button */}
              {initialisedModules.length > 0 && (
                <button
                  onClick={notifyModules}
                  className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 rounded-md p-2 px-4 transition-all duration-200"
                >
                  <HiBell className="h-4 w-4 mr-2" />
                  Notify Lecturers
                </button>
              )}

              {/* Advertise Modules button */}
              {changesSubmittedModules.length > 0 && (
                <button
                  onClick={advertiseModules}
                  className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 rounded-md p-2 px-4 transition-all duration-200"
                >
                  <HiSpeakerphone className="h-4 w-4 mr-2" />
                  Advertise Modules
                </button>
              )}

              {/* Add new module button */}
              <Link
                to={"/recruitment-series/" + _id + "/add-module"}
                state={{
                  id: _id,
                  name: name,
                  appDueDate: applicationDueDate,
                  docDueDate: documentDueDate,
                }}
                className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-primary-light to-primary-dark rounded-md p-2 px-5"
              >
                <LuCirclePlus className="h-5 w-5 mr-2" />
                Add Module
              </Link>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 mr-4 w-full text-right text-sm text-text-secondary font-semibold">
        {moduleCount} modules, {undergraduateTAPositionsCount} undergraduate TA
        positions, {postgraduateTAPositionsCount} postgraduate TA positions
      </p>
    </div>
  );
};

export default RecruitmentSeriesCard;