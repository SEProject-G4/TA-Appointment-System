import React, { useEffect, useState } from "react";
import { Trophy, FileUser, File, Clock, CircleCheckBig } from "lucide-react";
import TAAcceptedCard from "../components/TAAcceptedCard";
import TAStatCard from "../components/TAStatCard";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function TADashboardAccepted() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id; //check weather this correct------------------------------

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
        {/* accepted TA positions */}
        <div className="m-8">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Accepted TA Positions
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-text-secondary">
              You have not applied for any TA positions yet.
            </p>
          ) : (
            applications.flatMap((app) =>
              app.appliedModules.map((appModule) => (
                <TAAcceptedCard
                  key={appModule._id}
                  moduleCode={appModule.moduleId.moduleCode}
                  moduleName={appModule.moduleId.moduleName}
                  coordinators={appModule.moduleId.coordinators.map(
                    (c) => c.name
                  )}
                  requiredTAHours={appModule.moduleId.requiredTAHours}
                  requiredTANumber={appModule.moduleId.requiredTACount}
                  appliedTANumber={1}
                  status="Pending Document Submission"
                  appliedDate={appModule.createdAt.split("T")[0]}
                  documentDueDate={
                    appModule.moduleId.documentDueDate.split("T")[0]
                  }
                  applicationDueDate={
                    appModule.moduleId.applicationDueDate.split("T")[0]
                  }
                  requirements={[appModule.moduleId.requirements]}
                />
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default TADashboardAccepted;
