import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosConfig";
import Modal from "../../components/common/Modal";
import EditModuleDetailsCard from "../../components/lecturer/EditModuleDetailsCard";

interface ModuleEditData {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  applicationDueDate: string;
  documentDueDate?: string;
  requiredTAHoursPerWeek: number;
  requiredUndergraduateTACount: number;
  requiredPostgraduateTACount: number;
  requirements: string;
}

const EditModuleDetails: React.FC = () => {
  type ModuleFromApi = {
    _id: string;
    moduleCode: string;
    moduleName: string;
    semester: string;
    year: string;
    coordinators: string[];
    applicationDueDate: string;
    documentDueDate: string;
    requiredTAHours?: number | null;
    requiredUndergraduateTACount?: number | null;
    requiredPostgraduateTACount?: number | null;
    requirements?: string | null;
    moduleStatus?: string;
    undergraduateCounts?: {
      required: number;
      remaining: number;
      applied: number;
      reviewed: number;
      accepted: number;
      docSubmitted: number;
      appointed: number;
    } | null;
    postgraduateCounts?: {
      required: number;
      remaining: number;
      applied: number;
      reviewed: number;
      accepted: number;
      docSubmitted: number;
      appointed: number;
    } | null;
  };

  // Update the type definition to match the backend response
  type ModulesResponse = {
    pendingChanges: ModuleFromApi[];
    changesSubmitted: ModuleFromApi[];
    advertised: ModuleFromApi[];
  };

  const [modules, setModules] = useState<ModuleFromApi[]>([]);
  const [moduleEdits, setModuleEdits] = useState<
    Record<string, ModuleEditData>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // card view only

  // Function to check if all three fields have been edited for a specific module
  const areAllFieldsEdited = (moduleId: string): boolean => {
    const moduleData = moduleEdits[moduleId];
    if (!moduleData) return false;
    // Only require the 'requirements' field to be filled; other fields are optional
    return moduleData.requirements.trim().length > 0;
  };

  useEffect(() => {
    const loadMyModules = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get<ModulesResponse>("/lecturer/modules");
        
        // Combine all arrays of modules
        const allModules = [
          ...res.data.pendingChanges,
          ...res.data.changesSubmitted,
          ...res.data.advertised
        ];
        
        setModules(allModules);
        
        const mapped: Record<string, ModuleEditData> = {};
        const initialEditing: Record<string, boolean> = {};
        
        for (const m of allModules) {
          mapped[m._id] = {
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            semester: m.semester,
            year: m.year,
            applicationDueDate: m.applicationDueDate,
            documentDueDate: m.documentDueDate || undefined,
            requiredTAHoursPerWeek: m.requiredTAHours ?? 0,
            requiredUndergraduateTACount: m.undergraduateCounts?.required ?? 0,
            requiredPostgraduateTACount: m.postgraduateCounts?.required ?? 0,
            requirements: m.requirements ?? "",
          };
          // Initially show read-only view for all modules
          initialEditing[m._id] = false;
        }
        setModuleEdits(mapped);
        setEditing(initialEditing);

      } catch (e) {
        console.error("Error loading modules:", e);
        setError("Failed to load your modules");
      } finally {
        setLoading(false);
      }
    };
    loadMyModules();
  }, []);

  const handleInputChange = (
    moduleId: string,
    field: keyof ModuleEditData,
    value: string | number
  ) => {
    setModuleEdits((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (moduleId: string) => async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingModuleId(moduleId);
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    if (!pendingModuleId) return;

    try {
      setUpdating((prev) => ({ ...prev, [pendingModuleId]: true }));

      const moduleData = moduleEdits[pendingModuleId];
      if (!moduleData) return;

      const payload = {
        requiredTAHours: moduleData.requiredTAHoursPerWeek,
        requiredUndergraduateTACount: moduleData.requiredUndergraduateTACount,
        requiredPostgraduateTACount: moduleData.requiredPostgraduateTACount,
        requirements: moduleData.requirements,
      };

      const response = await axiosInstance.patch(
        `/lecturer/modules/${pendingModuleId}`,
        payload
      );
      // Update the local state with the response data
      if (response.data) {
        setModuleEdits((prev) => ({
          ...prev,
          [pendingModuleId]: {
            ...prev[pendingModuleId],
            requiredUndergraduateTACount: response.data.undergraduateCounts?.required || 0,
            requiredPostgraduateTACount: response.data.postgraduateCounts?.required || 0,
            requiredTAHoursPerWeek: response.data.requiredTAHours || 0,
            requirements: response.data.requirements || "",
          },
        }));
        
        // Update the modules array with the latest data
        setModules((prev) =>
          prev.map((module) =>
            module._id === pendingModuleId ? response.data : module
          )
        );
      }
            // Exit editing mode after successful submit
      setEditing((prev) => ({ ...prev, [pendingModuleId]: false }));

      setShowConfirmModal(false);
      setPendingModuleId(null);
    } catch (error: any) {
      console.error("Failed to update module:", error);
      
      // Display error message to user with styled modal
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to update module. Please try again.");
      }
      setShowErrorModal(true);
    } finally {
      setUpdating((prev) => ({ ...prev, [pendingModuleId]: false }));
      setShowConfirmModal(false);
      setPendingModuleId(null);
    }
  };

  const cancelSubmission = () => {
    setShowConfirmModal(false);
    setPendingModuleId(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const resetModuleData = (moduleId: string) => {
    const module = modules.find(m => m._id === moduleId);
    if (!module) return;

    setModuleEdits((prev) => ({
      ...prev,
      [moduleId]: {
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        semester: module.semester,
        year: module.year,
        applicationDueDate: module.applicationDueDate,
        documentDueDate: module.documentDueDate || undefined,
        requiredTAHoursPerWeek: module.requiredTAHours ?? 0,
        requiredUndergraduateTACount: module.undergraduateCounts?.required ?? 0,
        requiredPostgraduateTACount: module.postgraduateCounts?.required ?? 0,
        requirements: module.requirements ?? "",
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="text-text-primary text-sm sm:text-base">Loading modules...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 sm:p-6 w-full">
          <h3 className="text-error font-semibold mb-2 text-sm sm:text-base">Error</h3>
          <p className="text-text-secondary mb-4 text-xs sm:text-sm">{error}</p>
          <button className="btn btn-primary text-xs sm:text-sm px-3 py-2" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="text-center w-full py-16">
          <h3 className="text-text-primary text-lg sm:text-xl font-semibold mb-2">No Modules Assigned</h3>
          <p className="text-text-secondary text-sm sm:text-base">No modules have been assigned to you yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
      <div className="mb-6 sm:mb-8 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat mb-2">Edit Module Details</h1>
          <p className="text-text-secondary font-raleway text-sm sm:text-base">Provide TA requirements for each module</p>
        </div>
        <div className="flex items-center space-x-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {modules.map((m) => {
          const d = moduleEdits[m._id];
          const isEditing = editing[m._id];
          return (
            <EditModuleDetailsCard
              key={m._id}
              module={m}
              moduleData={d}
              isEditing={isEditing}
              updating={updating[m._id]}
              onEditClick={() => setEditing((prev) => ({ ...prev, [m._id]: true }))}
              onInputChange={(field, value) => handleInputChange(m._id, field, value)}
              onSubmit={handleSubmit(m._id)}
              onCancel={() => {
                resetModuleData(m._id);
                setEditing((prev) => ({ ...prev, [m._id]: false }));
              }}
              areAllFieldsEdited={areAllFieldsEdited(m._id)}
            />
          );
        })}
      </div>

      <Modal 
        isOpen={showConfirmModal} 
        onClose={cancelSubmission} 
        showCloseButton={false}
      >
        <div className="max-w-md w-full mx-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Confirm Submission</h3>
              <p className="text-xs sm:text-sm text-gray-600">Final confirmation required</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Are you sure you want to submit these TA requirements?
              <span className="font-semibold text-warning"> This action cannot be undone</span> and will finalize the module requirements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={cancelSubmission} className="btn btn-outline flex-1 text-sm sm:text-base">Cancel</button>
            <button onClick={confirmSubmission} disabled={updating[pendingModuleId || ""]} className={`btn btn-primary flex-1 text-sm sm:text-base ${updating[pendingModuleId || ""] ? 'btn-disabled' : ''}`}>{updating[pendingModuleId || ""] ? "Submitting..." : "Confirm & Submit"}</button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal 
        isOpen={showErrorModal} 
        onClose={closeErrorModal} 
        showCloseButton={true}
      >
        <div className="max-w-md w-full mx-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-error" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Update Failed</h3>
              <p className="text-xs sm:text-sm text-gray-600">Unable to save changes</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-error/5 border border-error/20 rounded-lg p-3 sm:p-4">
              <p className="text-error text-xs sm:text-sm leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={closeErrorModal} 
              className="btn btn-primary px-4 sm:px-6 text-sm sm:text-base"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditModuleDetails;