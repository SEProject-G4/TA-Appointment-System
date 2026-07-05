import { useEffect, useState } from "react";
import { Loader2, RefreshCw} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import SubmissionCard from "../../components/ta/TASubmissionsCard";


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
    coordinators?: string[];
  }[];
  totalTAHours: number;
  isDocSubmitted: boolean;
  documentId: string | null;
  personalDetails: {
    bankAccountName?: string;
    bank?: string;
    branch?: string;
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


