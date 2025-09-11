import React, { useState } from "react";

import { MdMoreVert } from "react-icons/md";
import CommonAvatar from "../assets/images/common_avatar.jpg";
import { FiClock } from "react-icons/fi";
import { FaUserGraduate } from "react-icons/fa";

import { Checkbox } from "@headlessui/react";
import CircularProgress from "../common/CircularProgressBar";
import { useNavigate } from "react-router-dom";

interface RSModuleCardProps {
  id: string;
  moduleCode: string;
  moduleName: string;
  semester: number;
  status: string;
  coordinators: {
    id: string;
    displayName: string;
    email: string;
    profilePicture: string;
  }[];
  requiredTAHours: number;
  requiredUndergraduateTACount: number;
  requiredPostgraduateTACount: number;
  appliedUndergraduateTACount: number;
  appliedPostgraduateTACount: number;
  requirements: string;
  documentDueDate: string;
  applicationDueDate: string;
}

const getClassForStatus = (status: string) => {
  switch (status) {
    case "initialised":
      return "bg-primary-light/20 text-primary";
    case "published":
      return "bg-green-100 text-green-800";
    case "archived":
      return "bg-text-secondary/80 text-text-primary";
    default:
      return "";
  }
};

const RSModuleCard: React.FC<RSModuleCardProps> = ({
  id,
  moduleCode,
  moduleName,
  semester,
  status,
  coordinators,
  requiredTAHours,
  appliedUndergraduateTACount,
  appliedPostgraduateTACount,
  requirements,
  requiredUndergraduateTACount,
  requiredPostgraduateTACount,
  documentDueDate,
  applicationDueDate,
}) => {
  const navigate = useNavigate();

  const [marked, setMarked] = useState(false);
  return (
    <div className="flex flex-col p-3 gap-y-2 rounded-md drop-shadow-xl bg-bg-card w-[400px]">
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
          {moduleCode} - {moduleName} [Semester {semester}]
        </p>
        <p
          className={`ml-2 text-xs font-semibold px-3 py-1 rounded-full ${getClassForStatus(
            status
          )}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
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
            {coordinators.map((coordinator) => (
              <div key={coordinator.id} className="flex gap-x-2 items-center">
                <img
                  src={CommonAvatar}
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
      </div>

      <div className="flex w-full gap-x-2 flex-grow items-stretch">
        <div
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page p-2 rounded-md`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Undergraduate TAs
          </p>
          {requiredUndergraduateTACount === 0 ? (
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
              {requiredTAHours}hours/week
            </p>
          </div>
          <CircularProgress
            percentage={
              (appliedUndergraduateTACount / requiredUndergraduateTACount) * 100
            }
            size="small"
            color={ appliedUndergraduateTACount >= requiredUndergraduateTACount
                ? "green"
                : "blue"
            }
          >
            <p className="text-sm font-semibold">
              <span className="text-text-primary text-2xl">
                {appliedUndergraduateTACount}
              </span>
              <span className="text-text-secondary">
                /{requiredUndergraduateTACount}
              </span>
            </p>
          </CircularProgress>
          </>)}
        </div>

        <div
          className={`flex flex-1 flex-col items-center gap-y-2 bg-bg-page rounded-md p-2 ${
            requiredPostgraduateTACount === 0 ? "opacity-100" : ""
          }`}
        >
          <p className="w-full border-b-[0px] border-text-secondary/80 text-sm text-text-primary font-semibold">
            Postgraduate TAs
          </p>
          {requiredPostgraduateTACount === 0 ? (
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
                  {requiredTAHours}hours/week
                </p>
              </div>
              <CircularProgress
                percentage={
                  (appliedPostgraduateTACount / requiredPostgraduateTACount) *
                  100
                }
                size="small"
                color={
                  requiredPostgraduateTACount === 0
                    ? "gray"
                    : appliedPostgraduateTACount >= requiredPostgraduateTACount
                    ? "green"
                    : "blue"
                }
              >
                <p className="text-sm font-semibold">
                  <span className="text-text-primary text-2xl">
                    {appliedPostgraduateTACount}
                  </span>
                  <span className="text-text-secondary">
                    /{requiredPostgraduateTACount}
                  </span>
                </p>
              </CircularProgress>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center w-full gap-x-2 p-2">
        <div
          className="text-center rounded-lg p-1 hover:bg-primary-dark hover:text-text-inverted flex-1 outline-2 outline outline-primary text-primary cursor-pointer"
          onClick={() => navigate(`/module-recruitment/${id}`)}
        >
          More Details
        </div>
      </div>
    </div>
  );
};

export default RSModuleCard;
