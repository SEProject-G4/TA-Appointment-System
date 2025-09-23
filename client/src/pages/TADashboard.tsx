import React, { useEffect, useState } from "react";
import TARequestCard from "../components/TARequestCard";
import TAStatCard from "../components/TAStatCard";
import { GraduationCap, BookOpen, Users, Newspaper } from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function TADashboard() {
  const { user } = useAuth();

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // New state variable for refresh key
  const userId = user?.id; //handle this error when user is null
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
        throw new Error(error.response?.data?.message || error.message); // ✅ rethrow
      } else {
        throw error;
      }
    }finally{
      setRefreshKey((prevKey) => prevKey + 1); // Increment the refresh key to trigger re-fetching
      console.log("Refresh key updated:", refreshKey);
    }
  };

  useEffect(() => {
    if (!user) return; // Wait until user is available
    const fetchModules = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/ta/requests",
          {
            params: {
              userId, //handle this error when user is null
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
  }, [userId,refreshKey]);

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
            )} // Sum of required TA positions across all modules
            icon={Users}
          />
          <TAStatCard
            statName="Remaining TA Hours Per Week"
            statValue={availableHoursPerWeek} // Example static values
            icon={Newspaper}
          />
        </div>
      </div>
      <div className="gap-2 m-8">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Available TA Positions
        </h2>
        {loading ? (
          <p>Loading...</p>
        ) : modules.length > 0 ? (
          modules.map((module) => (
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
              onApply={() =>
                applyForTA(
                  user.id,
                  user.role,
                  module._id,
                  module.recruitmentSeriesId,
                  module.requiredTAHours
                )
              } //----------------------------check what can do if user is null
            />
          ))
        ) : (
          <p>No Available TA Positions...</p>
        )}
      </div>
    </div>
  );
}

export default TADashboard;
