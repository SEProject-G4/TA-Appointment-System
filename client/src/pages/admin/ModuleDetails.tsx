import { useState, useEffect, use } from "react";
import { useLocation } from "react-router-dom";

import BasicModuleInfoTab from "../../components/admin/BasicModuleInfoTab";
import ApplicationsTab from "../../components/admin/ApplicationsTab";
import { useRoundsStore } from "../../stores/useRoundsStore";
import axiosInstance from "../../api/axiosConfig";

import type { ModuleDetails } from "../../types/module";

import { Tab, TabGroup, TabPanel, TabPanels, TabList } from "@headlessui/react";
import { LuRefreshCw } from "react-icons/lu";
import Loader from "../../components/common/Loader";

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
    case "getting documents":
      return "bg-pink-100 text-pink-800";
    case "closed":
      return "bg-black text-white";
    default:
      return "bg-text-secondary/20 text-text-secondary";
  }
};

const ModuleDetails = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [triggerApplicationsFetch, setTriggerApplicationsFetch] = useState(false);

  const location = useLocation();

  const { roundId, moduleId, selectedTab } = location.state || {};
  const moduleDetails = useRoundsStore(
    (state) => roundId && moduleId && state.getModuleById(roundId, moduleId)
  );
  const refreshModuleDetails = useRoundsStore((state) => state.refreshModule);

  const fetchApplications = async () => {
    try {
      const response = await axiosInstance.get(
        `/modules/${moduleId}/applications`
      );
      console.log("Fetched applications:", response.data);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } 
  };

  useEffect(() => {
    if (selectedTab !== undefined) {
      setSelectedIndex(selectedTab);
    }
  }, [selectedTab]);
  
  useEffect(() => {
    refreshModuleDetails(roundId, moduleId);
    fetchApplications();
  }, [moduleId]);

  useEffect(() => {
    if (triggerApplicationsFetch) {
      fetchApplications();
      setTriggerApplicationsFetch(false);
    }
  }, [triggerApplicationsFetch]);

  return (
    <div className="relative bg-bg-page flex flex-col items-center px-20 py-4 min-h-full w-full gap-y-4">
      {moduleDetails ? (
        <>
          <p className="w-full text-text-primary text-2xl font-semibold">
            {moduleDetails.moduleCode} - {moduleDetails.moduleName} [Semester{" "}
            {moduleDetails.semester}]
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getClassForStatus(
                moduleDetails.moduleStatus
              )}`}
            >
              {moduleDetails.moduleStatus.charAt(0).toUpperCase() +
                moduleDetails.moduleStatus.slice(1)}
            </span>
          </p>
          <button
            onClick={async () => {
                setIsPageLoading(true);
                await fetchApplications();
                await refreshModuleDetails(roundId, moduleId);
                setIsPageLoading(false);
            }}
            className="absolute top-[90px] mr-2 right-24 h-6 w-6 bg-bg-card text-text-secondary hover:text-primary hover:bg-primary-light/10 rounded-sm outline outline-1 outline-text-secondary/50 flex items-center justify-center transition-colors duration-200"
            title="Refresh module details & applications"
          >
            <LuRefreshCw className="h-4 w-4" />
          </button>
          <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className={"w-full bg-bg-card p-4 rounded-md"}
          >
            <TabList className="flex border-b border-text-secondary">
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">
                Basic Info
              </Tab>
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">
                Applications
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel className="mt-4">
                {isPageLoading && (
                  <div className="w-full h-[50vh] flex items-center justify-center">
                    <Loader />
                  </div>
                )}
                {!isPageLoading && (
                  <BasicModuleInfoTab moduleData={moduleDetails} />
                )}
              </TabPanel>
              <TabPanel className="mt-4">
                {isPageLoading && (
                  <div className="w-full h-[50vh] flex items-center justify-center">
                    <Loader />
                  </div>
                )}
                {!isPageLoading && (
                  <ApplicationsTab
                  moduleData={moduleDetails} 
                  applications={applications} 
                  setApplications={setApplications} 
                  triggerApplicationsFetch={setTriggerApplicationsFetch} />
                )}
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </>
      ) : (
        <p className="w-full text-text-primary text-2xl">
          Couldn't load module details
        </p>
      )}
    </div>
  );
};

export default ModuleDetails;
