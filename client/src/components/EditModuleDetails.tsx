import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosConfig";
import { FaRegEdit } from "react-icons/fa";

interface ModuleEditData {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  applicationDueDate: string;
  documentDueDate?: string;
  requiredTAHoursPerWeek: number;
  numberOfRequiredTAs: number;
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
    requiredTACount?: number | null;
    requirements?: string | null;
    moduleStatus?: string;
  };

  const [modules, setModules] = useState<ModuleFromApi[]>([]);
  const [moduleEdits, setModuleEdits] = useState<
    Record<string, ModuleEditData>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  // Function to check if all three fields have been edited for a specific module
  const areAllFieldsEdited = (moduleId: string): boolean => {
    const moduleData = moduleEdits[moduleId];
    if (!moduleData) return false;

    return (
      moduleData.requiredTAHoursPerWeek > 0 &&
      moduleData.numberOfRequiredTAs > 0 &&
      moduleData.requirements.trim().length > 0
    );
  };

  useEffect(() => {
    const loadMyModules = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get<ModuleFromApi[]>(
          "/lecturer/modules"
        );
        const list = res.data || [];
        setModules(list);
        const mapped: Record<string, ModuleEditData> = {};
        const initialEditing: Record<string, boolean> = {};
        for (const m of list) {
          mapped[m._id] = {
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            semester: m.semester,
            year: m.year,
            applicationDueDate: m.applicationDueDate,
            documentDueDate: m.documentDueDate || undefined,
            requiredTAHoursPerWeek: m.requiredTAHours ?? 0,
            numberOfRequiredTAs: m.requiredTACount ?? 0,
            requirements: m.requirements ?? "",
          };
          // Initially show read-only view for all modules
          initialEditing[m._id] = false;

          if (m.moduleStatus === "submitted") {
            setSubmitted((prev) => ({ ...prev, [m._id]: true }));
          }
        }
        setModuleEdits(mapped);
        setEditing(initialEditing);
      } catch (e) {
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
        requiredTACount: moduleData.numberOfRequiredTAs,
        requirements: moduleData.requirements,
      };

      await axiosInstance.patch(
        `/lecturer/modules/${pendingModuleId}`,
        payload
      );

      setSubmitted((prev) => ({ ...prev, [pendingModuleId]: true }));
      // Exit editing mode after successful submit
      setEditing((prev) => ({ ...prev, [pendingModuleId]: false }));

      setShowConfirmModal(false);
      setPendingModuleId(null);
    } catch (error) {
      console.error("Failed to update module:", error);
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

  if (loading) {
    return <div className="min-h-screen px-20 py-5 text-text-primary">Loading modules...</div>;
  }

  if (error) {
    return <div className="min-h-screen px-20 py-5 text-error">{error}</div>;
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen px-20 py-5 text-text-primary">No modules assigned to you.</div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-montserrat mb-2">Edit Module Details</h1>
        <p className="text-text-secondary font-raleway">Provide TA requirements for each module</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
        {modules.map((m) => {
          const d = moduleEdits[m._id];
          const isSubmitted = submitted[m._id] || m.moduleStatus === "submitted";
          const isEditing = editing[m._id];
          return (
            <div
              key={m._id}
              className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex w-full items-center justify-between px-4 py-3 border-b border-border-default">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-text-primary font-semibold text-base">{m.moduleCode}</h2>
                    <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium">
                      {m.semester} {m.year}
                    </span>
                  </div>
                  <p className="text-text-primary text-sm mt-1">{m.moduleName}</p>
                </div>
                {isSubmitted ? (
                  <span className="badge badge-accepted">Submitted</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing((prev) => ({ ...prev, [m._id]: true }))}
                    className="p-2 rounded-full bg-red-500/10 text-red-700 hover:bg-red-500/20"
                    title="Edit module requirements"
                    aria-label="Edit module"
                  >
                    <FaRegEdit className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit(m._id)} className="p-4 space-y-4 w-full">
                <div className="bg-bg-page rounded-lg p-3 mb-2 border border-border-default">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Application Due</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {new Date(m.applicationDueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Document Due</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {m.documentDueDate
                          ? new Date(m.documentDueDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                      <h3 className="text-sm font-semibold text-text-primary mb-2">Submitted TA Requirements</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-border-default">
                          <div className="text-xs text-text-secondary">Required TA Hours</div>
                          <div className="text-text-primary font-semibold">{d?.requiredTAHoursPerWeek || "0"} {((d?.requiredTAHoursPerWeek || 0) === 1 ? 'hour' : 'hours')} per week</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-border-default">
                          <div className="text-xs text-text-secondary">Required TAs</div>
                          <div className="text-text-primary font-semibold">{d?.numberOfRequiredTAs || "0"} {((d?.numberOfRequiredTAs || 0) === 1 ? 'teaching assistant' : 'teaching assistants')}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-border-default sm:col-span-2">
                          <div className="text-xs text-text-secondary mb-1">Requirements</div>
                          <div className="text-sm text-text-primary leading-relaxed">{d?.requirements || "No specific requirements specified for this TA position."}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Required TA Hours per Week
                        </label>
                        <input
                          type="number"
                          value={d?.requiredTAHoursPerWeek ?? 0}
                          onChange={(e) =>
                            handleInputChange(
                              m._id,
                              "requiredTAHoursPerWeek",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="e.g., 6"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Number of Required TAs
                        </label>
                        <input
                          type="number"
                          value={d?.numberOfRequiredTAs ?? 0}
                          onChange={(e) =>
                            handleInputChange(
                              m._id,
                              "numberOfRequiredTAs",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="e.g., 5"
                          min={0}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Requirements for TA Position
                      </label>
                      <textarea
                        value={d?.requirements ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            m._id,
                            "requirements",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Enter detailed requirements for TA applicants..."
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setEditing((prev) => ({ ...prev, [m._id]: false }))}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                  {!isSubmitted && isEditing && (
                    <button
                      type="submit"
                      disabled={updating[m._id] || !areAllFieldsEdited(m._id)}
                      className={`btn btn-primary ${updating[m._id] || !areAllFieldsEdited(m._id) ? 'btn-disabled' : ''}`}
                    >
                      {updating[m._id]
                        ? "Saving..."
                        : !areAllFieldsEdited(m._id)
                        ? "Add Module Requirements"
                        : "Save Changes"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          );
        })}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Submission</h3>
                <p className="text-sm text-gray-600">Final confirmation required</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                Are you sure you want to submit these TA requirements?
                <span className="font-semibold text-warning"> This action cannot be undone</span> and will finalize the module requirements.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={cancelSubmission} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={confirmSubmission} disabled={updating[pendingModuleId || ""]} className={`btn btn-primary flex-1 ${updating[pendingModuleId || ""] ? 'btn-disabled' : ''}`}>{updating[pendingModuleId || ""] ? "Submitting..." : "Confirm & Submit"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModuleDetails;
