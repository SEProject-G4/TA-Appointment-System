import React, { useEffect, useState } from "react";
import { Delete, Trophy, FileUser, Newspaper } from "lucide-react";
import TAAppliedCard from "../../components/ta/TAAppliedCard";
import TAStatCard from "../../components/ta/TAStatCard";
import ViewToggle from "../../components/ta/ViewToggle";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function TADashboardApplied() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const userId = user?.id; //check weather this correct------------------------------
  const userRole = user?.role;

  useEffect(() => {
    if (!userId) return; // Don't run until we have userId

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/ta/applied-modules",
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
        <div className="container px-2 sm:px-4 py-4 sm:py-8 mx-auto">
          {/* header */}
          <div className="mb-8 sm:mb-12 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                <FileUser className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center">Applied TA Positions</h1>
            </div>
            {/* <p className="max-w-2xl mx-auto text-lg text-text-secondary">
              Track the status of your TA position applications. Stay updated on
              application progress.
            </p> */}
          </div>
          {/* stats */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3">
            <TAStatCard
              statName="Applications Submitted"
              statValue={applications.length}
              icon={Newspaper}
            />
            <TAStatCard
              statName="Accepted Positions"
              statValue={
                applications.filter((app) => app.status === "accepted").length
              }
              icon={Trophy}
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <TAStatCard
                statName="Rejected Positions"
                statValue={
                  applications.filter((app) => app.status === "rejected").length
                }
                icon={Delete}
              />
            </div>
          </div>
        </div>
        {/* applied TA positions */}
        <div className="gap-2 m-2 sm:m-4 lg:m-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Applied TA Positions
            </h2>
            <div className="flex justify-center sm:justify-start w-full sm:w-auto">
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-text-secondary">Loading...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-base sm:text-lg text-text-secondary">
                You have not applied for any TA positions yet.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "cards"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  : "space-y-3 sm:space-y-4"
              }
            >
              {applications.map((app) => (
                <TAAppliedCard
                  key={app.id}
                  moduleCode={app.moduleId.moduleCode}
                  moduleName={app.moduleId.moduleName}
                  coordinators={app.moduleId.coordinators}
                  requiredTAHours={app.moduleId.requiredTAHours}
                  requiredTANumber={
                    userRole === "undergraduate"
                      ? app.moduleId.undergraduateCounts.required // check this is it okay to show applied count? or the remainin positions
                      : app.moduleId.postgraduateCounts.required
                  }
                  appliedTANumber={
                    userRole === "undergraduate"
                      ? app.moduleId.undergraduateCounts.applied
                      : app.moduleId.postgraduateCounts.applied
                  }
                  status={app.status}
                  appliedDate={app.createdAt.split("T")[0]}
                  documentDueDate={app.moduleId.documentDueDate.split("T")[0]}
                  applicationDueDate={
                    app.moduleId.applicationDueDate.split("T")[0]
                  }
                  requirements={[app.moduleId.requirements]}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TADashboardApplied;

//  <TAAppliedCard
//           moduleCode="CS101"
//           moduleName="Computer Security"
//           coordinators={["Dr. Smith", "Prof. Doe"]}
//           requiredTAHours={20}
//           requiredTANumber={2}
//           appliedTANumber={1}
//           status="Rejected"
//           appliedDate="2024-06-01"
//           documentDueDate="2024-06-15"
//           applicationDueDate='2024-06-10'
//           requirements={["Resume", "Cover Letter"]}
//         />
//         <div className='mt-4'></div>
//           <TAAppliedCard
//           moduleCode="CS101"
//           moduleName="Theory of Computing"
//           coordinators={["Dr. Smith", "Prof. Doe"]}
//           requiredTAHours={20}
//           requiredTANumber={2}
//           appliedTANumber={1}
//           status="Accepted"
//           appliedDate="2024-06-01"
//           documentDueDate="2024-06-15"
//           applicationDueDate='2024-06-10'
//           requirements={["Resume", "Cover Letter"]}
//         />
