import { useState, useEffect} from "react";
import { useLocation } from "react-router-dom";

import BasicModuleInfoTab from "../../components/admin/BasicModuleInfoTab";

import axiosInstance from "../../api/axiosConfig";
import { useToast } from "../../contexts/ToastContext";

import { Tab,
  TabGroup,
  TabPanel,
  TabPanels,
  TabList, } from "@headlessui/react";

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

const ModuleDetails = () => {

    const [moduleDetails, setModuleDetails] = useState<ModuleDetails | null>(null);

  const location = useLocation();

  const { moduleData } = location.state || {};

  useEffect(() => {
    if (moduleData) {
      setModuleDetails(moduleData);
    }
  }, [moduleData]);


  return (
    <div className="bg-bg-page flex flex-col items-center px-20 py-4 min-h-full w-full gap-y-4">
      {moduleDetails ? (
        <>
          <p className="w-full text-text-primary text-2xl font-semibold">{moduleDetails.moduleCode} - {moduleDetails.moduleName} [Semester {moduleDetails.semester}]
            <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getClassForStatus(moduleDetails.moduleStatus)}`}>
              {moduleDetails.moduleStatus.charAt(0).toUpperCase() + moduleDetails.moduleStatus.slice(1)}
            </span>
          </p>
          <TabGroup className={"w-full bg-bg-card p-4 rounded-md"}>
            <TabList className="flex border-b border-text-secondary">
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">Basic Info</Tab>
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">Applications</Tab>
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">Document Submissions</Tab>
              <Tab className="data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary py-2 px-4 cursor-pointer outline-none">Appointments</Tab>
            </TabList>
            <TabPanels>
              <TabPanel className="mt-4">
                <BasicModuleInfoTab moduleData={moduleDetails} />
              </TabPanel>
              <TabPanel className="mt-4">
                <p className="text-text-primary">Applications Content</p>
              </TabPanel>
              <TabPanel className="mt-4">
                <p className="text-text-primary">Document Submissions Content</p>
              </TabPanel>
              <TabPanel className="mt-4">
                <p className="text-text-primary">Appointments Content</p>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </>
      ) : (
        <p className="w-full text-text-primary text-2xl">Couldn't load module details</p>
      )}
    </div>
  )
}

export default ModuleDetails;