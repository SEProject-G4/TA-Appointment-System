import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosConfig";

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

  // Function to check if all three fields have been edited for a specific module
  const areAllFieldsEdited = (moduleId: string): boolean => {
    const moduleData = moduleEdits[moduleId];
    if (!moduleData) return false;

    // Check if all three required fields have been filled
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

          // Initialize submitted state based on database status
          if (m.moduleStatus === "submitted") {
            setSubmitted((prev) => ({ ...prev, [m._id]: true }));
          }
        }
        setModuleEdits(mapped);
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

    // Show custom confirmation modal
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

      // Mark as submitted and show success feedback
      setSubmitted((prev) => ({ ...prev, [pendingModuleId]: true }));
      console.log("Module updated successfully:", pendingModuleId);

      // Close modal and reset
      setShowConfirmModal(false);
      setPendingModuleId(null);
    } catch (error) {
      console.error("Failed to update module:", error);
      // Handle error (show error message to user)
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
    return <div className="p-4 text-text-primary">Loading modules...</div>;
  }

  if (error) {
    return <div className="p-4 text-error">{error}</div>;
  }

  if (modules.length === 0) {
    return (
      <div className="p-4 text-text-primary">No modules assigned to you.</div>
    );
  }

  return (
    <div className="space-y-6 mt-6 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {modules.map((m) => {
          const d = moduleEdits[m._id];
          return (
            <div
              key={m._id}
              className="bg-bg-card rounded-3xl shadow-lg overflow-hidden border border-border-default"
            >
              <div className="bg-gradient-to-r from-primary-dark to-primary px-6 py-4 rounded-t-3xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-bg-card bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-text-inverted"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-text-inverted font-bold text-xl">
                      {m.moduleCode} • {m.moduleName}
                    </h2>
                    {(submitted[m._id] || m.moduleStatus === "submitted") && (
                      <span className="px-3 py-1.5 bg-success bg-opacity-20 backdrop-blur-sm text-text-inverted text-xs font-semibold rounded-2xl flex items-center gap-1.5 shadow-md border border-success/30">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Submitted</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(m._id)} className="p-4 space-y-4">
                <div className="bg-info bg-opacity-10 rounded-lg p-3 mb-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-primary uppercase tracking-wide">
                        Semester
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {m.semester}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-primary uppercase tracking-wide">
                        Year
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {m.year}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-primary uppercase tracking-wide">
                        Application Due
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {new Date(m.applicationDueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-primary uppercase tracking-wide">
                        Document Due
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {m.documentDueDate
                          ? new Date(m.documentDueDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {submitted[m._id] || m.moduleStatus === "submitted" ? (
                  // Read-only detailed view for submitted modules
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-info/5 to-info/10 rounded-xl p-6 border border-info/30 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-info/20 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-info"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-text-primary">
                            TA Requirements Submitted
                          </h3>
                          <p className="text-sm text-text-primary">
                            Module requirements have been finalized
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="bg-white/50 rounded-lg p-2 border border-info/20 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-info/20 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-info"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                              Required TA Hours
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-lg font-bold text-text-primary">
                                {d?.requiredTAHoursPerWeek || "0"}
                              </p>
                              <p className="text-sm text-text-primary/70">
                                {(d?.requiredTAHoursPerWeek || 0) === 1 ? 'hour per week' : 'hours per week'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/50 rounded-lg p-2 border border-info/20 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-info/20 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-info"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                              Required TAs
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-lg font-bold text-text-primary">
                                {d?.numberOfRequiredTAs || "0"}
                              </p>
                              <p className="text-sm text-text-primary/70">
                                {(d?.numberOfRequiredTAs || 0) === 1 ? 'teaching assistant' : 'teaching assistants'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-white/50 rounded-lg p-3 border border-info/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-info/20 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-info"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                            Requirements
                          </span>
                        </div>
                        <div className="bg-info/5 rounded-lg p-2 border-l-4 border-info">
                          <p className="text-sm text-text-primary leading-relaxed">
                            {d?.requirements ||
                              "No specific requirements specified for this TA position."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Editable form for pending modules
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

                <div className="flex justify-end">
                  {!(submitted[m._id] || m.moduleStatus === "submitted") && (
                    <button
                      type="submit"
                      disabled={updating[m._id] || !areAllFieldsEdited(m._id)}
                      className="group relative inline-flex items-center gap-2 px-6 py-2 rounded-2xl font-medium text-text-inverted
                                 bg-primary-dark text-text-inverted font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <span className="relative z-10">
                        {updating[m._id]
                          ? "Saving..."
                          : !areAllFieldsEdited(m._id)
                          ? "Add Module Requirements"
                          : "Save Changes"}
                      </span>
                      {!updating[m._id] && (
                        <svg
                          className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10 10.293 6.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />
                      <span className="pointer-events-none absolute inset-0 rounded-2xl -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Submission
                </h3>
                <p className="text-sm text-gray-600">
                  Final confirmation required
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                Are you sure you want to submit these TA requirements?
                <span className="font-semibold text-warning">
                  {" "}
                  This action cannot be undone
                </span>{" "}
                and will finalize the module requirements.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelSubmission}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmission}
                disabled={updating[pendingModuleId || ""]}
                className="flex-1 px-4 py-2.5 bg-warning hover:bg-warning/90 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating[pendingModuleId || ""]
                  ? "Submitting..."
                  : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModuleDetails;
