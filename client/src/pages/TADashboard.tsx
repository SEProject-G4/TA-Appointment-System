import React, { useEffect, useState } from "react";
import TARequestCard from "../components/TARequestCard";
import TAStatCard from "../components/TAStatCard";
import { GraduationCap, BookOpen, Users, Newspaper } from "lucide-react";
import axios from "axios";

function TADashboard() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/ta/requests"
        );
        setModules(response.data);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return (
    <div className="min-h-screen bg-bg-card text-text-primary">
      <div className="container px-4 py-8 mx-auto">
        {/* header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-8 h-8 text-text-primary" />
            </div>
            <h1 className="text-4xl font-bold ">TA Application Portal</h1>
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
            statValue={10}
            icon={BookOpen}
          />
          <TAStatCard
            statName="Total TA Positions"
            statValue={20}
            icon={Users}
          />
          <TAStatCard
            statName="Total Applications Received"
            statValue={10}
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
              moduleCode={`${module.year} ${module.semester} ${module.moduleCode}`}
              moduleName={module.moduleName}
              coordinators={module.coordinators}
              requiredTAHours={module.requiredTAHours}
              requiredTANumber={module.requiredTACount}
              appliedTANumber={1}
              requirements={[module.requirements]}
              documentDueDate={module.documentDueDate.split("T")[0]}
              applicationDueDate={module.applicationDueDate.split("T")[0]}
            />
          ))
        ) : (
          <p>No Vailable Positions</p>
        )}
      </div>
    </div>
  );
}

export default TADashboard;

