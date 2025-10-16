import React from "react";
import { FaRegEdit } from "react-icons/fa";

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

interface ModuleFromApi {
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
}

interface EditModuleDetailsCardProps {
  module: ModuleFromApi;
  moduleData: ModuleEditData;
  isEditing: boolean;
  updating: boolean;
  onEditClick: () => void;
  onInputChange: (field: keyof ModuleEditData, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  areAllFieldsEdited: boolean;
}

const EditModuleDetailsCard: React.FC<EditModuleDetailsCardProps> = ({
  module,
  moduleData,
  isEditing,
  updating,
  onEditClick,
  onInputChange,
  onSubmit,
  onCancel,
  areAllFieldsEdited,
}) => {
  return (
    <div className="flex w-full flex-col items-center border border-black rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex w-full items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <h2 className="text-text-primary font-semibold text-base">{module.moduleCode}</h2>
            <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium">
              Semester {module.semester} {module.year}
            </span>
          </div>
          <p className="text-text-primary text-sm mt-1">{module.moduleName}</p>
        </div>
        <>
          {module.moduleStatus === "pending changes" && (
            <span className="badge badge-warning mr-2">Pending Changes</span>
          )}
          {module.moduleStatus === "changes submitted" && (
            <span className="badge badge-accepted mr-2">Changes Submitted</span>
          )}
          {module.moduleStatus === "advertised" && (
            <span className="badge badge-info mr-2">Advertised</span>
          )}
          {(module.moduleStatus === "pending changes" || module.moduleStatus === "changes submitted" || module.moduleStatus === "advertised") && (
            <button
              type="button"
              onClick={onEditClick}
              className="p-2 rounded-full bg-red-500/10 text-red-700 hover:bg-red-500/20"
              title="Edit module requirements"
              aria-label="Edit module"
            >
              <FaRegEdit className="w-4 h-4" />
            </button>
          )}
        </>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-4 w-full">
        <div className="bg-bg-page rounded-lg p-3 mb-2 border border-border-default">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Application Due</span>
              <span className="text-sm font-semibold text-text-primary">
                {new Date(module.applicationDueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Document Due</span>
              <span className="text-sm font-semibold text-text-primary">
                {module.documentDueDate
                  ? new Date(module.documentDueDate).toLocaleDateString()
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
                  <div className="text-text-primary text-sm">
                    {Number(moduleData?.requiredTAHoursPerWeek ?? 0)} {Number(moduleData?.requiredTAHoursPerWeek ?? 0) === 1 ? 'hour' : 'hours'} per week
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border-default">
                  <div className="text-xs text-text-secondary">Undergraduate TAs</div>
                  <div className="text-text-primary text-sm">
                    {Number(moduleData?.requiredUndergraduateTACount ?? 0)} {Number(moduleData?.requiredUndergraduateTACount ?? 0) === 1 ? 'TA' : 'TAs'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border-default">
                  <div className="text-xs text-text-secondary">Postgraduate TAs</div>
                  <div className="text-text-primary text-sm">
                    {Number(moduleData?.requiredPostgraduateTACount ?? 0)} {Number(moduleData?.requiredPostgraduateTACount ?? 0) === 1 ? 'TA' : 'TAs'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border-default sm:col-span-2">
                  <div className="text-xs text-text-secondary mb-1">Requirements</div>
                  <div className="text-sm text-text-primary leading-relaxed">
                    {moduleData?.requirements || "No specific requirements specified for this TA position."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  TA Hours per Week
                </label>
                <input
                  type="number"
                  value={moduleData?.requiredTAHoursPerWeek ?? 0}
                  onChange={(e) =>
                    onInputChange(
                      "requiredTAHoursPerWeek",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 6"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Undergraduate TAs Required
                </label>
                <input
                  type="number"
                  value={moduleData?.requiredUndergraduateTACount ?? 0}
                  onChange={(e) =>
                    onInputChange(
                      "requiredUndergraduateTACount",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 3"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Postgraduate TAs Required
                </label>
                <input
                  type="number"
                  value={moduleData?.requiredPostgraduateTACount ?? 0}
                  onChange={(e) =>
                    onInputChange(
                      "requiredPostgraduateTACount",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 2"
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Requirements for TA Position
              </label>
              <textarea
                value={moduleData?.requirements ?? ""}
                onChange={(e) =>
                  onInputChange(
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
              onClick={onCancel}
              className="btn btn-outline"
            >
              Cancel
            </button>
          )}
          {(module.moduleStatus === "pending changes" || module.moduleStatus === "changes submitted" || module.moduleStatus === "advertised") && isEditing && (
            <button
              type="submit"
              disabled={updating || !areAllFieldsEdited}
              className={`btn btn-primary ${updating || !areAllFieldsEdited ? 'btn-disabled' : ''}`}
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditModuleDetailsCard;
