import React, { useEffect, useState } from "react";
import {
  Trophy,
  FileIcon,
  File,
  Clock,
  CircleCheckBig,
  UploadIcon,
} from "lucide-react";
// import TAAcceptedCard from "../components/TAAcceptedCard";
import TAAppliedCard from "../components/TAAppliedCard";
import TAStatCard from "../components/TAStatCard";
import { Button } from "../components/ui/Button";
import TADocumentCard from "../components/TADocumentCard";
import ViewToggle from "../components/ViewToggle";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function TADashboardAccepted() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [isDocOpen, setIsDocOpen] = useState(false);
  const userRole = user?.role;
  const userId = user?.id; //check weather this correct------------------------------
  const modules = applications.flatMap(app =>
  app.appliedModules
    .filter(mod => mod?.moduleId) // safeguard
    .map(mod => ({
      moduleCode: mod.moduleId.moduleCode,
      moduleName: mod.moduleId.moduleName,
      requiredTAHours: mod.moduleId.requiredTAHours || 0,
    }))
);

// Total TA hours
const totalTAHours = modules.reduce(
  (sum, mod) => sum + mod.requiredTAHours,
  0
);

  useEffect(() => {
    if (!userId) return; // Don't run until we have userId

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/ta/accepted-modules",
          { params: { userId } }
        );
        setApplications(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("error fetching application data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userId]); // <-- run whenever userId changes

  return (
    <div>
      <div className="min-h-screen bg-bg-card text-text-primary">
        <div className="container px-4 py-8 mx-auto">
          {/* header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CircleCheckBig className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary">
                Accepted TA Positions
              </h1>
            </div>
            <p className="max-w-2xl mx-auto text-lg text-text-secondary">
              Congratulations! Manage your accepted Teaching Assistant positions
              and stay organized with your responsibilities.
            </p>
          </div>
          {/* stats */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <TAStatCard
              statName="Total Hours per Week"
              statValue={3}
              icon={Clock}
            />
            <TAStatCard
              statName="Accepted Positions"
              statValue={2}
              icon={Trophy}
            />
            <TAStatCard
              statName="Documents Pending"
              statValue={0}
              icon={File}
            />
          </div>
        </div>
        <div className="m-16">
          <div className="p-6 mb-8 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="mb-1 text-xl font-semibold text-gray-900">
                    Document Submissions Required
                  </h2>
                  <p className="text-gray-600">
                    Submit your documents for the following accepted TA
                    positions to complete your onboarding process.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  icon={<UploadIcon className="w-4 h-4" />}
                  label="Submit Documents"
                  onClick={() => setIsDocOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* accepted TA positions */}
        <div className="gap-2 m-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Accepted TA Positions
            </h2>
            <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-text-secondary">
              You have not applied for any TA positions yet.
            </p>
          ) : (
            <div
              className={
                viewMode === "cards"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {applications.flatMap((app) =>
                app.appliedModules.map((appModule) => (
                  <TAAppliedCard
                    key={appModule._id}
                    moduleCode={appModule.moduleId.moduleCode}
                    moduleName={appModule.moduleId.moduleName}
                    coordinators={appModule.moduleId.coordinators.map(
                      (c) => c.name
                    )}
                    requiredTANumber={
                      userRole === "undergraduate"
                        ? appModule.moduleId.requiredUndergraduateTACount
                        : appModule.moduleId.requiredPostgraduateTACount
                    }
                    appliedTANumber={
                      userRole === "undergraduate"
                        ? appModule.moduleId.appliedUndergraduateCount
                        : appModule.moduleId.appliedPostgraduateCount
                    }
                    status={appModule.status}
                    appliedDate={appModule.createdAt.split("T")[0]}
                    documentDueDate={
                      appModule.moduleId.documentDueDate.split("T")[0]
                    }
                    applicationDueDate={
                      appModule.moduleId.applicationDueDate.split("T")[0]
                    }
                    viewMode={viewMode}
                    requirements={[appModule.moduleId.requirements]}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {isDocOpen && (
        <TADocumentCard
          isDocOpen={isDocOpen}
          onClose={() => setIsDocOpen(false)}
          position={{
            modules,
            totalTAHours,
          }}
        />
      )}
    </div>
  );
}

export default TADashboardAccepted;
