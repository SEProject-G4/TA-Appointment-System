import React, { useEffect, useState } from "react";
import TARequestCard from "../components/TARequestCard";
import TAStatCard from "../components/TAStatCard";
import ViewToggle from "../components/ViewToggle";
import { GraduationCap, BookOpen, Users, Newspaper } from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function TADashboard() {
  const { user } = useAuth();

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const userId = user?.id;
  const userRole = user?.role;
  const [availableHoursPerWeek, setAvailableHoursPerWeek] = useState<number>(0);

  const applyForTA = async (
    userId: string,
    userRole: string,
    moduleId: string,
    recSeriesId: string,
    taHours: number
  ) => {
    try {
      const response = await axios.post("http://localhost:5000/api/ta/apply", {
        userId,
        userRole,
        moduleId,
        recSeriesId,
        taHours,
      });
      console.log("Application successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error applying for TA position:", error);
      if (axios.isAxiosError(error)) {
        console.error(
          "Error applying for TA position:",
          error.response?.data || error.message
        );
        throw new Error(error.response?.data?.message || error.message);
      } else {
        throw error;
      }
    } finally {
      setRefreshKey((prevKey) => prevKey + 1);
      console.log("Refresh key updated:", refreshKey);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchModules = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/ta/requests",
          {
            params: {
              userId,
            },
          }
        );
        setModules(response.data.updatedModules);
        setAvailableHoursPerWeek(response.data.availableHoursPerWeek);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [userId, refreshKey]);

  return (
    <div className="min-h-screen bg-bg-card text-text-primary">
      <div className="container px-4 py-8 mx-auto">
        {/* header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-8 h-8 text-text-primary" />
            </div>
            <h1 className="text-4xl font-bold ">
              {userRole} - TA Application Portal
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-lg text-text-secondary">
            Apply for Teaching Assistant positions across various computer
            science modules. Find the perfect opportunity to share your
            knowledge and gain valuable experience.
          </p>
        </div>
        
        {/* stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <TAStatCard
            statName="Available Modules"
            statValue={modules.length}
            icon={BookOpen}
          />
          <TAStatCard
            statName="Total Available TA Positions"
            statValue={modules.reduce(
              (total, mod) =>
                total +
                (userRole === "undergraduate"
                  ? mod.requiredUndergraduateTACount -
                    mod.appliedUndergraduateCount
                  : mod.requiredPostgraduateTACount -
                    mod.appliedPostgraduateCount),
              0
            )}
            icon={Users}
          />
          <TAStatCard
            statName="Remaining TA Hours Per Week"
            statValue={availableHoursPerWeek}
            icon={Newspaper}
          />
        </div>
      </div>

      <div className="gap-2 m-8">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Available TA Positions
          </h2>
          <ViewToggle
            currentView={viewMode}
            onViewChange={setViewMode}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-text-secondary">Loading...</p>
          </div>
        ) : modules.length > 0 ? (
          <div className={
            viewMode === 'cards' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
          }>
            {modules.map((module) => (
              <TARequestCard
                key={module.moduleCode}
                moduleCode={`Sem ${module.semester} ${module.moduleCode}`}
                moduleName={module.moduleName}
                coordinators={module.coordinators}
                requiredTAHours={module.requiredTAHours}
                requiredTANumber={
                  userRole === "undergraduate"
                    ? module.requiredUndergraduateTACount
                    : module.requiredPostgraduateTACount
                }
                appliedTANumber={
                  userRole === "undergraduate"
                    ? module.appliedUndergraduateCount
                    : module.appliedPostgraduateCount
                }
                requirements={[module.requirements]}
                documentDueDate={module.documentDueDate.split("T")[0]}
                applicationDueDate={module.applicationDueDate.split("T")[0]}
                viewMode={viewMode}
                onApply={() =>
                  applyForTA(
                    user.id,
                    user.role,
                    module._id,
                    module.recruitmentSeriesId,
                    module.requiredTAHours
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-text-secondary">No Available TA Positions...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TADashboard;