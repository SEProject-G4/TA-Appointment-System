// React Imports
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Icon Imports
import {
  FaChevronRight,
  FaRegCalendarAlt,
  FaBoxOpen,
  FaCopy,
  FaArchive,
  FaTrash,
  FaFilter,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { MdMoreVert, MdRefresh } from "react-icons/md";
import { LuCirclePlus, LuMail, LuRefreshCw } from "react-icons/lu";
import { FiClock, FiRefreshCw } from "react-icons/fi";
import { HiSpeakerphone, HiBell, HiRefresh } from "react-icons/hi";

// Context & Store Imports
import { useModal } from "../../contexts/ModalProvider";
import { useToast } from "../../contexts/ToastContext";
import { useRoundsStore } from "../../stores/useRoundsStore";

// Component Imports
import CopyRSModal from "./CopyRSModal";
import ChangeDeadlineModal from "./ChangeDeadlineModal";
import ChangeHourLimitsModal from "./ChangeHourLimitsModal";
import RSModuleCard from "./RSModuleCard";
import Loader from "../common/Loader";

import axiosInstance from "../../api/axiosConfig";
import { useShallow } from "zustand/shallow";

// Type Imports
import type { RecruitmentRoundState } from "../../types/recruitment-round";
import type { ModuleDetails } from "../../types/module";

const getClassForStatus: (status: string) => string = (status: string) => {
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

const RecruitmentRoundCard: React.FC<{ _id: string; className?: string }> = ({
  _id,
  className,
}) => {
  const {
    round,
    fetchModulesForRound,
    updateRound,
    deleteRound,
  }: {
    round: RecruitmentRoundState | undefined;
    fetchModulesForRound: (id: string) => void;
    updateRound: (roundId: string, updates: Partial<RecruitmentRoundState>) => void;
    deleteRound: (roundId: string) => void;
  } = useRoundsStore(
    useShallow((state) => {
      return {
        round: state.rounds[_id],
        fetchModulesForRound: state.fetchModulesForRound,
        updateRound: state.updateRound,
        deleteRound: state.deleteRound,
      };
    })
  );
  const [isExpanded, setIsExpanded] = useState(
    round?.status === "initialised" || round?.status === "active"
  );
  const [moduleDetails, setModuleDetails] = useState<ModuleDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const modules = round?.modules;
  const isLoading = round?.areModulesLoading;
  const areModulesFetched = round?.areModulesFetched;
  const errorInModules = round?.error ?? null;

  const changesSubmittedModules = moduleDetails.filter(
    (mod) => mod.moduleStatus === "changes submitted"
  );
  const initialisedModules = moduleDetails.filter(
    (mod) => mod.moduleStatus === "initialised"
  );

  // Filter modules based on search query and status filter
  const filteredModules = modules
    ? Object.values(modules).filter((module) => {
        const matchesSearch =
          searchQuery === "" ||
          module.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.moduleName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || module.moduleStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

  const refreshModuleDetails = () => {
    // setHasFetched(false);
  };

  const getTimeAgo = (timestamp: string | undefined) => {
    if (!timestamp) return "Never";

    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchModuleDetails = async () => {
    try {
      // const response = await axiosInstance.get(
      //   `/recruitment-series/${_id}/modules`
      // );
      // setModuleDetails(response.data);
      if (!areModulesFetched) {
        fetchModulesForRound(_id);
        // setHasFetched(true);
      }
    } catch (error) {
      console.error("Error fetching module details:", error);
    }
  };

  const notifyModules = async () => {
    try {
      const response = await axiosInstance.post(
        `/recruitment-series/${_id}/notify-modules`
      );
      const { summary, details } = response.data;

      if (summary.successful > 0) {
        const successModules = details.filter(
          (d: any) => d.status === "success"
        );
        const moduleNames = successModules
          .map((d: any) => d.moduleCode)
          .join(", ");
        const totalEmails = successModules.reduce(
          (sum: number, d: any) => sum + (d.recipientCount || 0),
          0
        );

        showToast(
          `Successfully notified ${summary.successful} module(s): ${moduleNames}. ${totalEmails} emails sent to coordinators.`,
          "success"
        );

        if (summary.failed > 0) {
          const failedModules = details.filter(
            (d: any) => d.status === "failed"
          );
          const failedNames = failedModules
            .map((d: any) => d.moduleCode)
            .join(", ");
          showToast(
            `Failed to notify ${summary.failed} module(s): ${failedNames}`,
            "info"
          );
        }
      } else {
        showToast(
          "No modules could be notified. Please check module status and coordinator assignments.",
          "error"
        );
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
      const response = await axiosInstance.post(
        `/recruitment-series/${_id}/advertise-modules`
      );
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
        const emailBreakdown = emailResults
          .map((result: any) => {
            return `${result.recipientCount} ${result.type}s`;
          })
          .join(" + ");

        if (emailBreakdown) {
          detailMessage += `. Emails sent to: ${emailBreakdown}`;
        }

        showToast(detailMessage, "success");

        // Show any failed email groups
        const failedResults = emailResults.filter(
          (result: any) => !result.success
        );
        if (failedResults.length > 0) {
          const failedGroups = failedResults
            .map((result: any) => result.type)
            .join(", ");
          showToast(`Failed to send emails to: ${failedGroups}`, "info");
        }
      } else {
        showToast(
          "No advertisement emails were sent. Please check module status and student groups.",
          "error"
        );
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
        <p className="text-warning font-semibold mb-2">
          This action will delete all associated modules, associated
          applications, and any other related data.
        </p>
        <p>Are you sure you want to delete this recruitment series?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-warning hover:bg-warning text-warning hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.delete(
                  `/recruitment-series/${_id}`
                );
                if (response.status === 200) {
                  showToast(
                    "Recruitment round deleted successfully with all its associated data.",
                    "success"
                  );
                  closeModal();
                  deleteRound(_id);
                }
                // Optionally refresh the list or provide feedback
              } catch (error) {
                console.error("Error deleting recruitment series:", error);
              }
            }}
          >
            Delete
          </button>
          <button
            className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold"
            onClick={() => closeModal()}
          >
            Cancel
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  const handleCloseRecruitmentRound = () => {
    openModal(
      <div className="flex flex-col items-center py-4 px-6">
        <h2 className="text-lg font-semibold mb-4">Close Recruitment Round</h2>
        <p className="text-warning font-semibold mb-2">
          This action will close all recruitments under this recruitment round.
        </p>
        <p className="mb-2">
          All modules in this recruitment series will be marked as 'closed' and
          the recruitment round status will change to 'closed'.
        </p>
        <p>Are you sure you want to close this recruitment round?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-orange-600 hover:bg-orange-600 text-orange-600 hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.put(
                  `/recruitment-series/${_id}/close`
                );
                if (response.status === 200) {
                  showToast(
                    "Recruitment round closed successfully.",
                    "success"
                  );
                  closeModal();
                  refreshModuleDetails(); // Refresh to show updated status
                }
              } catch (error: any) {
                console.error("Error closing recruitment round:", error);
                const errorMessage =
                  error.response?.data?.error ||
                  "Failed to close recruitment round";
                showToast(errorMessage, "error");
              }
            }}
          >
            Close Recruitment Round
          </button>
          <button
            className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold"
            onClick={() => closeModal()}
          >
            Cancel
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  const handleArchiveRecruitmentRound = () => {
    openModal(
      <div className="flex flex-col items-center py-4 px-6">
        <h2 className="text-lg font-semibold mb-4">
          Archive Recruitment Round
        </h2>
        <p className="mb-2">
          This action will archive this recruitment round. Archived recruitment
          rounds can only be copied or deleted.
        </p>
        <p>Are you sure you want to archive this recruitment round?</p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="rounded-md outline outline-1 outline-gray-600 hover:bg-gray-600 text-gray-600 hover:text-text-inverted px-5 py-2 font-semibold"
            onClick={async () => {
              try {
                const response = await axiosInstance.put(
                  `/recruitment-series/${_id}/archive`
                );
                if (response.status === 200) {
                  showToast(
                    "Recruitment round archived successfully.",
                    "success"
                  );
                  closeModal();
                  refreshModuleDetails(); // Refresh to show updated status
                  updateRound(_id, { status: "archived" });
                }
              } catch (error: any) {
                console.error("Error archiving recruitment round:", error);
                const errorMessage =
                  error.response?.data?.error ||
                  "Failed to archive recruitment round";
                showToast(errorMessage, "error");
              }
            }}
          >
            Archive Recruitment Round
          </button>
          <button
            className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-5 py-2 font-semibold"
            onClick={() => closeModal()}
          >
            Cancel
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  // Dynamic dropdown menu items based on status
  const getDropdownItems = () => {
    const baseItems = [
      {
        label: "Make a copy",
        onClick: handleCopyRS,
        show: true,
      },
    ];

    switch (status) {
      case "initialised":
      case "active":
        return [
          {
            label: "Change deadlines",
            onClick: handleChangeDeadlines,
            show: true,
          },
          {
            label: "Change hour limits",
            onClick: handleChangeHourLimits,
            show: true,
          },
          {
            label: "Edit",
            onClick: () => {
              navigate(`/recruitment-series/${_id}/edit`);
            },
            show: true,
          },
          ...baseItems,
          {
            label: "Close recruitment round",
            onClick: handleCloseRecruitmentRound,
            show: true,
          },
        ];

      case "closed":
        return [
          ...baseItems,
          {
            label: "Archive recruitment round",
            onClick: handleArchiveRecruitmentRound,
            show: true,
          },
        ];

      case "archived":
        return [
          ...baseItems,
          {
            label: "Delete recruitment round",
            onClick: handleDeleteRS,
            show: true,
          },
        ];

      default:
        return baseItems;
    }
  };

  const handleChangeDeadlines = () => {
    openModal(
      <ChangeDeadlineModal
        recruitmentSeriesId={_id}
        recruitmentSeriesName={round.name}
        currentApplicationDueDate={round.applicationDueDate}
        currentDocumentDueDate={round.documentDueDate}
        onSuccess={refreshModuleDetails}
      />,
      { showCloseButton: false }
    );
  };

  const handleChangeHourLimits = () => {
    openModal(
      <ChangeHourLimitsModal
        recruitmentSeriesId={_id}
        recruitmentSeriesName={round.name}
        currentUndergradHourLimit={round.undergradHourLimit}
        currentPostgradHourLimit={round.postgradHourLimit}
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
          name: round.name,
          applicationDueDate: round.applicationDueDate,
          documentDueDate: round.documentDueDate,
          undergradHourLimit: round.undergradHourLimit,
          postgradHourLimit: round.postgradHourLimit,
        }}
        modules={modules ? Object.values(modules).map((mod) => {
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
        }) : []}
      />,
      {
        showCloseButton: false,
      }
    );
  };

  useEffect(() => {
    if (isExpanded && round && !round.areModulesFetched && !round.areModulesLoading) {
      fetchModuleDetails();
      // setHasFetched(true);
    }
  }, [isExpanded]);

  if (!round) {
    return (
      <div
        className={`flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-2 pb-3 ${className}`}
      >
        <p className="text-text-secondary">Recruitment Round not found.</p>
      </div>
    );
  } else {
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
              {round.name}
              <span
                className={`ml-2 text-xs items-center flex flex-col justify-center px-2 rounded-full ${getClassForStatus(
                  round.status
                )}`}
              >
                {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
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
                {getDropdownItems().map(
                  (item, index) =>
                    item.show && (
                      <li
                        key={index}
                        className="px-2 text-text-secondary hover:bg-primary/80 py-1 cursor-pointer rounded-sm hover:text-text-inverted"
                        onClick={item.onClick}
                      >
                        {item.label}
                      </li>
                    )
                )}
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
                {round.undergradHourLimit}H
              </span>
            </p>
            <p className="text-text-secondary text-sm flex-grow">
              Postgraduate:{" "}
              <span className="font-semibold text-text-primary/90">
                {round.postgradHourLimit}H
              </span>
            </p>
          </div>
          <div className="flex flex-col relative outline outline-1 outline-text-secondary/80 rounded-sm py-2 px-4">
            <FaRegCalendarAlt className="absolute left-2 -top-2 h-4 w-8 bg-bg-card px-2 text-text-secondary" />
            <p className="text-text-secondary text-sm mt-1">
              Application:{" "}
              <span className="font-semibold text-text-primary/90">
                {new Date(round.applicationDueDate).toLocaleString(undefined, {
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
                {new Date(round.documentDueDate).toLocaleString(undefined, {
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
                {round.undergradMailingList
                  .map(
                    (group) => group.name + "(" + group.userCount + " users)"
                  )
                  .join(", ") || "None"}
              </span>
            </p>
            <p className="text-text-secondary text-sm">
              Postgraduate:{" "}
              <span className="font-semibold text-text-primary/90">
                {round.postgradMailingList
                  .map(
                    (group) => group.name + "(" + group.userCount + " users)"
                  )
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
            className={`w-full mt-4 flex ${
              (isLoading || (!areModulesFetched && !modules)) ? "flex-col items-center" : "flex-row items-start"
            } flex-wrap relative outline outline-1 outline-text-secondary/80 rounded-sm justify-start content-start`}
          >
            <div className="tool-set mb-2 pt-3 flex p-2 flex-row w-full bg-bg-page drop-shadow gap-x-2 items-center">
              <p className="absolute left-2 -top-2 h-4 bg-bg-card px-2 text-text-primary flex items-center">
                Modules
              </p>

              {/* Search Bar */}
              <div className="flex items-center bg-bg-card rounded-sm outline outline-1 outline-text-secondary/50 px-2 py-1 flex-grow max-w-xs">
                <FaSearch className="h-3 w-3 text-text-secondary mr-2" />
                <input
                  type="text"
                  placeholder="Search modules by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm text-text-primary placeholder-text-secondary/50 flex-grow"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-bg-card rounded-sm outline outline-1 outline-text-secondary/50 px-2 py-1">
                <FaFilter className="h-3 w-3 text-text-secondary mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent outline-none text-sm text-text-primary cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="initialised">Initialised</option>
                  <option value="pending changes">Pending Changes</option>
                  <option value="changes submitted">Changes Submitted</option>
                  <option value="advertised">Advertised</option>
                  <option value="full">Full</option>
                  <option value="undergrad full">Undergrad Full</option>
                  <option value="getting-documents">Getting Documents</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Last Refreshed Time */}
              {round?.lastRefreshedAt && (
                <span className="text-xs text-text-secondary ml-auto mr-2">
                  Last refreshed: {getTimeAgo(round.lastRefreshedAt)}
                </span>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => {
                  // setHasFetched(false);
                  fetchModulesForRound(_id);
                }}
                className="h-6 w-6 bg-bg-card text-text-secondary hover:text-primary hover:bg-primary-light/10 rounded-sm outline outline-1 outline-text-secondary/50 flex items-center justify-center transition-colors duration-200"
                title="Refresh modules"
              >
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>
            {/* <div className="px-3 w-full flex justify-start items-center">
              <p className="text-sm text-text-secondary">Filters: </p>
            </div> */}
            {isLoading || (!areModulesFetched && !modules) ? (
              <Loader className="my-5 w-full" />
            ) : errorInModules ? (
              <div className="w-full flex flex-col items-center justify-center py-6">
                <FaTimes className="h-8 w-8 text-warning mb-2" />
                <p className="text-lg text-warning font-semibold">{errorInModules}</p>
                <p className="text-sm text-text-secondary mt-1">
                  Please try again by refreshing the modules.
                </p>
              </div>
            ) : (
              <>
                {filteredModules.length > 0 ? (
                  <div className="flex px-4 pb-3 gap-y-5 justify-start gap-x-2 overflow-x-hidden flex-wrap">
                    {filteredModules.map((module) => (
                      <RSModuleCard
                        key={module._id}
                        {...module}
                        refreshPage={refreshModuleDetails}
                      />
                    ))}
                  </div>
                ) : modules && Object.keys(modules).length > 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-6">
                    <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                    <p className="text-lg text-text-secondary font-semibold">
                      No modules match your filters.
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      Try adjusting your search or filter criteria.
                    </p>
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

                {/* Add new module button - only for initialised and active */}
                {(round.status === "initialised" || round.status === "active") && (
                  <Link
                    to={"/recruitment-series/" + _id + "/add-module"}
                    state={{
                      id: _id,
                      name: round.name,
                      appDueDate: round.applicationDueDate,
                      docDueDate: round.documentDueDate,
                    }}
                    className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-primary-light to-primary-dark rounded-md p-2 px-5"
                  >
                    <LuCirclePlus className="h-5 w-5 mr-2" />
                    Add Module
                  </Link>
                )}

                {/* Actions for closed status */}
                {round.status === "closed" && (
                  <>
                    <button
                      onClick={handleCopyRS}
                      className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-md p-2 px-4 transition-all duration-200"
                    >
                      <FaCopy className="h-4 w-4 mr-2" />
                      Make a Copy
                    </button>
                    <button
                      onClick={handleArchiveRecruitmentRound}
                      className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 rounded-md p-2 px-4 transition-all duration-200"
                    >
                      <FaArchive className="h-4 w-4 mr-2" />
                      Archive
                    </button>
                  </>
                )}

                {/* Actions for archived status */}
                {round.status === "archived" && (
                  <>
                    <button
                      onClick={handleCopyRS}
                      className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-md p-2 px-4 transition-all duration-200"
                    >
                      <FaCopy className="h-4 w-4 mr-2" />
                      Make a Copy
                    </button>
                    <button
                      onClick={handleDeleteRS}
                      className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-md p-2 px-4 transition-all duration-200"
                    >
                      <FaTrash className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 mr-4 w-full text-right text-sm text-text-secondary font-semibold">
          {round.moduleCount} modules, {round.undergraduateTAPositionsCount} undergraduate
          TA positions, {round.postgraduateTAPositionsCount} postgraduate TA positions
        </p>
      </div>
    );
  }
};

export default RecruitmentRoundCard;
