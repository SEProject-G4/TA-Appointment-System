import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Upload } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

type FileMeta = {
  submitted?: boolean;
  id?: string;
  name?: string;
  viewLink?: string;
  downloadLink?: string;
  uploadedAt?: string;
};

type SubmissionGroup = {
  recSeriesId: string;
  recSeriesName: string;
  acceptedModules: {
    moduleId: string;
    moduleCode: string;
    moduleName: string;
    taHours: number;
  }[];
  totalTAHours: number;
  isDocSubmitted: boolean;
  documentId: string | null;
  personalDetails: {
    bankAccountName?: string;
    accountNumber?: string;
    nicNumber?: string;
    address?: string;
    studentType?: string;
  } | null;
  documents: {
    bankPassbook?: FileMeta | null;
    nicCopy?: FileMeta | null;
    cv?: FileMeta | null;
    degreeCertificate?: FileMeta | null;
    declarationForm?: FileMeta | null;
  } | null;
};

type DocumentKey =
  | "bankPassbook"
  | "nicCopy"
  | "cv"
  | "degreeCertificate"
  | "declarationForm";

type SubmissionFormState = {
  bankAccountName: string;
  address: string;
  nicNumber: string;
  accountNumber: string;
  bankPassbook: File | null;
  nicCopy: File | null;
  cv: File | null;
  degreeCertificate: File | null;
  declarationForm: File | null;
};

const documentItems: { key: DocumentKey; label: string; accept: string }[] = [
  { key: "bankPassbook", label: "Bank Passbook Copy", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "nicCopy", label: "NIC Copy", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "cv", label: "CV", accept: ".pdf,.doc,.docx" },
  { key: "degreeCertificate", label: "Degree Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "declarationForm", label: "Declaration Form", accept: ".pdf,.doc,.docx" },
];

const requiredDocumentKeys: DocumentKey[] = [
  "bankPassbook",
  "nicCopy",
  "cv",
  "declarationForm",
];

const getStudentTypeLabel = (studentType?: string) => {
  if (studentType === "postgraduate") return "Postgraduate";
  if (studentType === "undergraduate") return "Undergraduate";
  return studentType || "";
};

const createInitialFormState = (group: SubmissionGroup): SubmissionFormState => ({
  bankAccountName: group.personalDetails?.bankAccountName || "",
  address: group.personalDetails?.address || "",
  nicNumber: group.personalDetails?.nicNumber || "",
  accountNumber: group.personalDetails?.accountNumber || "",
  bankPassbook: null,
  nicCopy: null,
  cv: null,
  degreeCertificate: null,
  declarationForm: null,
});

export default function TADocumentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submissionGroups, setSubmissionGroups] = useState<SubmissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const studentTypeFromRole =
    user?.role === "postgraduate" || user?.role === "undergraduate"
      ? user.role
      : "";

  const fetchMySubmissions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/ta/my-submissions");
      setSubmissionGroups(res.data.groupedSubmissions || []);
    } catch (err) {
      console.error("Failed to load submissions", err);
      showToast("Failed to load document submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, [refreshKey]);

  return (
    <div className="min-h-screen bg-bg-page p-4 sm:p-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Documents</h1>
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="rounded-lg border p-2 hover:bg-primary-light/20"
          type="button"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : submissionGroups.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-text-primary">
            No submissions are available right now.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            You will see your document submissions here once you have an accepted application.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissionGroups.map((group) => (
            <SubmissionCard
              key={group.recSeriesId}
              group={group}
              userId={user?.id || ""}
              studentType={studentTypeFromRole}
              onRefresh={() => setRefreshKey((prev) => prev + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SubmissionCard = ({
  group,
  userId,
  studentType,
  onRefresh,
}: {
  group: SubmissionGroup;
  userId: string;
  studentType: string;
  onRefresh: () => void;
}) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<SubmissionFormState>(() => createInitialFormState(group));
  const fileInputRefs = useRef<Partial<Record<DocumentKey, HTMLInputElement | null>>>({});
  const isFirstSubmission = !group.documentId;
  const isPostgraduate = studentType === "postgraduate";
  const currentRequiredDocumentKeys: DocumentKey[] = isPostgraduate
    ? [...requiredDocumentKeys, "degreeCertificate"]
    : requiredDocumentKeys;

  useEffect(() => {
    if (!isEditing) {
      setFormState(createInitialFormState(group));
    }
  }, [group, isEditing]);

  const shouldShowDegreeCertificate =
    studentType === "postgraduate" || Boolean(group.documents?.degreeCertificate);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (key: DocumentKey, file: File | null) => {
    setFormState((prev) => ({ ...prev, [key]: file }));
  };

  const triggerFileChooser = (key: DocumentKey) => {
    fileInputRefs.current[key]?.click();
  };

  const handleCancel = () => {
    setFormState(createInitialFormState(group));
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    if (!formState.bankAccountName || !formState.nicNumber || !formState.accountNumber || !formState.address) {
      showToast("Please fill in all required personal details", "error");
      return;
    }

    if (!studentType) {
      showToast("Student type could not be determined from your account", "error");
      return;
    }

    if (isFirstSubmission) {
      const missingFiles = currentRequiredDocumentKeys.filter((key) => !formState[key]);
      if (missingFiles.length > 0) {
        showToast("All documents are required for the first submission", "error");
        return;
      }
    }

    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      submitData.append("recSeriesId", group.recSeriesId);
      submitData.append("bankAccountName", formState.bankAccountName);
      submitData.append("address", formState.address);
      submitData.append("nicNumber", formState.nicNumber);
      submitData.append("accountNumber", formState.accountNumber);
      submitData.append("studentType", studentType);
      submitData.append(
        "position",
        JSON.stringify({ modules: group.acceptedModules, totalTAHours: group.totalTAHours }),
      );

      (Object.entries(formState) as [keyof SubmissionFormState, SubmissionFormState[keyof SubmissionFormState]][]).forEach(
        ([key, value]) => {
          if (
            key === "bankAccountName" ||
            key === "address" ||
            key === "nicNumber" ||
            key === "accountNumber"
          ) {
            return;
          }

          if (value instanceof File) {
            submitData.append(key, value);
          }
        },
      );

      const response = await axiosInstance.post("/documents/submit", submitData);

      if (response.status === 201) {
        showToast("Documents updated successfully", "success");
        setIsEditing(false);
        onRefresh();
      } else if (response.status === 207) {
        showToast("Documents updated with some upload failures", "info");
        setIsEditing(false);
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error updating documents:", error);
      const errorMessage = error.response?.data?.message || "Failed to update documents. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderDoc = (key: DocumentKey, label: string, f?: FileMeta | null) => {
    const replacementFile = formState[key];
    const hasAnyUrl = Boolean(f?.viewLink);
    const displayName = replacementFile?.name || f?.name || "No file uploaded";
    const accept = documentItems.find((item) => item.key === key)?.accept;
    const isRequired = isFirstSubmission && (key !== "degreeCertificate" || isPostgraduate);

    return (
      <div className="rounded-lg border border-border-default bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          <div className="min-w-0 w-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {label} {isRequired && <span className="text-error">*</span>}
            </p>
            <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasAnyUrl && f?.viewLink && (
              <button
                type="button"
                onClick={() => window.open(f.viewLink, "_blank", "noopener,noreferrer")}
                className="btn btn-sm border-solid border-2 border-text-secondary bg-text-secondary text-white px-3 py-1 text-xs"
              >
                View
              </button>
            )}
            {hasAnyUrl && f?.downloadLink && (
              <a
                href={f.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm border-solid border-2 border-text-secondary text-text-secondary transition-colors hover:bg-text-secondary/10
                 px-2 py-1 text-xs"
              >
                Download
              </a>
            )}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => triggerFileChooser(key)}
                  className="btn btn-sm border-solid border-2 border-primary bg-primary text-white transition-colors hover:bg-primary-dark px-3 py-1 text-xs"
                >
                  {replacementFile ? "Replace File" : hasAnyUrl ? "Change" : "Upload"}
                </button>
                <input
                  ref={(node) => {
                    fileInputRefs.current[key] = node;
                  }}
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={(event) => handleFileChange(key, event.target.files?.[0] || null)}
                />
              </>
            )}
          </div>
        </div>
        {isEditing && replacementFile && (
          <p className="mt-2 text-xs text-text-secondary">Selected file: {replacementFile.name}</p>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border-default bg-bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-start gap-5 border-b border-border-default pb-4">
        <h2 className="text-lg font-bold text-text-primary">{group.recSeriesName}</h2>
        <div
          className={`inline-flex items-center gap-1 mt-1 text-sm ${group.isDocSubmitted ? "text-success" : "text-warning"}`}
        >
          {group.isDocSubmitted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {group.isDocSubmitted ? "Documents & Details Submitted" : "Documents & Details Submission Required"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {group.acceptedModules && group.acceptedModules.length > 0 && (
          <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
            <h3 className="border-b border-border-default pb-2 text-sm font-semibold text-text-primary sm:text-base">
              Accepted Positions
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {group.acceptedModules.map((mod) => (
                <div
                  key={mod.moduleId}
                  className="rounded border border-primary-light/20 bg-primary-light/5 p-2.5"
                >
                  <p className="text-sm font-bold text-primary-dark">{mod.moduleCode}</p>
                  <p className="truncate text-sm text-text-primary">{mod.moduleName}</p>
                  <p className="mt-1 text-xs text-text-secondary">TA Hours: {mod.taHours}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
          <h3 className="border-b border-border-default pb-2 text-sm font-semibold text-text-primary sm:text-base">
            Personal Details
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-text-secondary sm:text-xs">
                Bank Account Name <span className="text-error">*</span>
              </label>
              <input
                name="bankAccountName"
                value={formState.bankAccountName}
                onChange={handleFieldChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                required={isEditing}
                tabIndex={isEditing ? 0 : -1}
                className={`w-full rounded-lg border px-3 py-2 text-xs text-text-primary sm:text-sm ${isEditing ? "border-border-default bg-white focus:border-primary focus:ring-2 focus:ring-primary/20" : "cursor-default border-border-default bg-bg-page/60 opacity-100"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-text-secondary sm:text-xs">
                Account Number <span className="text-error">*</span>
              </label>
              <input
                name="accountNumber"
                value={formState.accountNumber}
                onChange={handleFieldChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                required={isEditing}
                tabIndex={isEditing ? 0 : -1}
                className={`w-full rounded-lg border px-3 py-2 text-xs text-text-primary sm:text-sm ${isEditing ? "border-border-default bg-white focus:border-primary focus:ring-2 focus:ring-primary/20" : "cursor-default border-border-default bg-bg-page/60 opacity-100"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-text-secondary sm:text-xs">
                NIC Number <span className="text-error">*</span>
              </label>
              <input
                name="nicNumber"
                value={formState.nicNumber}
                onChange={handleFieldChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                required={isEditing}
                tabIndex={isEditing ? 0 : -1}
                className={`w-full rounded-lg border px-3 py-2 text-xs text-text-primary sm:text-sm ${isEditing ? "border-border-default bg-white focus:border-primary focus:ring-2 focus:ring-primary/20" : "cursor-default border-border-default bg-bg-page/60 opacity-100"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-text-secondary sm:text-xs">
                Student Type
              </label>
              <input
                value={getStudentTypeLabel(studentType)}
                readOnly
                disabled
                tabIndex={-1}
                className="w-full rounded-lg border border-border-default bg-bg-page/60 px-3 py-2 text-xs text-text-primary opacity-100 sm:text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wide text-text-secondary sm:text-xs">
                Address <span className="text-error">*</span>
              </label>
              <textarea
                name="address"
                value={formState.address}
                onChange={handleFieldChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                required={isEditing}
                tabIndex={isEditing ? 0 : -1}
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-xs text-text-primary sm:text-sm ${isEditing ? "border-border-default bg-white focus:border-primary focus:ring-2 focus:ring-primary/20" : "cursor-default border-border-default bg-bg-page/60 opacity-100"}`}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
          <h3 className="border-b border-border-default pb-2 text-sm font-semibold text-text-primary sm:text-base">
            Documents
          </h3>
          <div className="mt-3 space-y-2">
            {renderDoc("bankPassbook", "Bank Passbook Copy", group.documents?.bankPassbook)}
            {renderDoc("nicCopy", "NIC Copy", group.documents?.nicCopy)}
            {renderDoc("cv", "CV", group.documents?.cv)}
            {shouldShowDegreeCertificate &&
              renderDoc("degreeCertificate", "Degree Certificate", group.documents?.degreeCertificate)}
            {renderDoc("declarationForm", "Declaration Form", group.documents?.declarationForm)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-lg border border-border-default bg-bg-card px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-primary-light/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <Upload className="h-4 w-4" />
            {group.isDocSubmitted ? "Update" : "Submit"} Documents & Details
          </button>
        )}
      </div>
    </div>
  );
};
