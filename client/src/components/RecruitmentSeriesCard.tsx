import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaRegCalendarAlt, FaBoxOpen } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { LuCirclePlus, LuMail } from "react-icons/lu";
import { FiClock } from "react-icons/fi";
import {
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
} from "react-icons/ri";

import RSModuleCard from "./RSModuleCard";
import axiosInstance from "../api/axiosConfig";
import Loader from "./Loader";
import { FaB } from "react-icons/fa6";

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
  status: "initialised" | "published" | "archived";
  moduleCount: number;
  undergraduateTAPositionsCount: number;
  postgraduateTAPositionsCount: number;
  className?: string;
}

interface TimelineProps {
  events: {
    id: number;
    title: string;
    date: string;
  }[];
  completedUpto: number;
}

interface ModuleDetails {
  id: string;
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
    case "published":
      return "bg-green-100 text-green-800";
    case "archived":
      return "bg-text-secondary/80 text-text-primary";
    default:
      return "";
  }
};

const Timeline: React.FC<TimelineProps> = ({ events, completedUpto }) => {
  return (
    <div className="flex flex-row">
      {events.map((event, index) => (
        <div key={event.id} className={`flex flex-col flex-1`}>
          <p className="text-text-secondary text-sm font-semibold w-full text-center h-[3em]">
            {event.title}
          </p>
          <div className="flex flex-row items-center">
            {index <= completedUpto ? (
              <>
                <div
                  className={`flex-1 h-1 ${
                    index === 0 ? "transparent" : "bg-primary"
                  }`}
                ></div>
                <RiCheckboxCircleFill className="text-primary h-4 w-4 m-0" />
                <div
                  className={`flex-1 h-1 ${
                    index === events.length - 1
                      ? "transparent"
                      : index === completedUpto
                      ? "bg-text-secondary"
                      : "bg-primary"
                  }`}
                ></div>
              </>
            ) : (
              <>
                <div
                  className={`flex-1 h-1 ${
                    index === 0 ? "transparent" : "bg-text-secondary"
                  }`}
                ></div>
                <RiCheckboxBlankCircleLine className="text-text-secondary h-4 w-4 m-0" />
                <div
                  className={`flex-1 h-1 ${
                    index === events.length - 1
                      ? "transparent"
                      : "bg-text-secondary"
                  }`}
                ></div>
              </>
            )}
          </div>
          <p className="text-text-secondary text-sm w-full text-center">
            {event.date}
          </p>
        </div>
      ))}
    </div>
  );
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [moduleDetails, setModuleDetails] = useState<ModuleDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

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
        
          <div className={`w-full pt-4 mt-4 flex ${isLoading ? "flex-col items-center":"flex-row items-start"} flex-wrap relative outline outline-1 outline-text-secondary/80 rounded-sm justify-start content-start`}>
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
              <div className="flex px-4 pb-3 gap-x-2 overflow-x-hidden flex-wrap gap-y-2">
                {moduleDetails.map((module) => (
                  <RSModuleCard
                    key={module.id}
                    id={module.id}
                    moduleCode={module.moduleCode}
                    moduleName={module.moduleName}
                    semester={module.semester}
                    status={module.moduleStatus}
                    coordinators={module.coordinators}
                    requiredTAHours={module.requiredTAHours}
                    requiredUndergraduateTACount={
                      module.requiredUndergraduateTACount
                      
                    }
                    appliedUndergraduateTACount={
                      module.appliedUndergraduateCount
                    }
                    requiredPostgraduateTACount={
                      module.requiredPostgraduateTACount
                    }
                    appliedPostgraduateTACount={module.appliedPostgraduateCount}
                    requirements={module.requirements}
                    documentDueDate={module.documentDueDate.toLocaleString()}
                    applicationDueDate={module.applicationDueDate.toLocaleString()}
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
        {moduleCount} modules, {undergraduateTAPositionsCount} undergraduate TA positions, {postgraduateTAPositionsCount} postgraduate TA positions
      </p>
    </div>
  );
};

export default RecruitmentSeriesCard;
