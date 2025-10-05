import React, { useEffect, useState } from "react";
import TARequestCard from "../../components/ta/TARequestCard";
import TAStatCard from "../../components/ta/TAStatCard";
import ViewToggle from "../../components/ta/ViewToggle";
import {
  GraduationCap,
  BookOpen,
  Users,
  Newspaper,
  ChevronDown,
  RefreshCw 
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function TADashboard() {
  const { user } = useAuth();

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [sortOption, setSortOption] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const handleSortChange = (option: string) => {
    setSortOption(option);
    let sortedModules = [...modules];

    if (option === "name") {
      sortedModules.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
    } else if (option === "hours") {
      sortedModules.sort((a, b) => a.requiredTAHours - b.requiredTAHours);
    } else if (option === "semester") {
      sortedModules.sort((a, b) => a.semester - b.semester);
    }

    setModules(sortedModules);
  };

  const filteredModules = modules.filter((mod) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const code = mod.moduleCode?.toLowerCase() || "";
    const name = mod.moduleName?.toLowerCase() || "";

    // Coordinators are array of strings
    const coordinators = Array.isArray(mod.coordinators)
      ? mod.coordinators.map((c) => c.toLowerCase()).join(" ")
      : "";

    return (
      code.includes(query) ||
      name.includes(query) ||
      coordinators.includes(query)
    );
  });

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
        console.log("Fetched modules:", response.data);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [userId, refreshKey]);

  return (
    <div className="min-h-screen px-8 bg-bg-page text-text-primary">
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
                  ? mod.undergraduateCounts.remaining
                  : mod.postgraduateCounts.remaining),
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
        <div className="gap-2 ">
          {/* Header - Available TA Positions */}
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">
              Available TA Positions
            </h2>
            {/* Refresh button  */}
            <div>
            <button
              className="p-2 text-sm font-medium border rounded-lg bg-bg-card text-text-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary-dark"
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            </div>
            </div>
            

            {/* Controls section */}
            <div className="flex flex-wrap items-center gap-3">
              {/*  Search input */}
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark bg-bg-card text-text-primary placeholder:text-text-secondary"
              />

              {/*  Sorting modules */}
              <div className="relative inline-flex overflow-hidden border rounded-lg shadow-sm border-border-default bg-bg-card group">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 pr-10 text-sm font-medium bg-transparent appearance-none cursor-pointer text-text-secondary hover:bg-primary-light/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">Sort By</option>
                  <option value="name">Module Name (A–Z)</option>
                  <option value="hours">TA Hours (Low → High)</option>
                  <option value="semester">Semester (Low → High)</option>
                </select>

                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-text-secondary group-hover:text-text-primary">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* 🪄 View toggle */}
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-text-secondary">Loading...</p>
          </div>
        ) : modules.length > 0 ? (
          <div
            className={
              viewMode === "cards"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredModules.map((module) => (
              <TARequestCard
                key={module.moduleCode}
                moduleCode={`Sem ${module.semester} ${module.moduleCode}`}
                moduleName={module.moduleName}
                coordinators={module.coordinators}
                requiredTAHours={module.requiredTAHours}
                requiredTANumber={
                  userRole === "undergraduate"
                    ? module.undergraduateCounts.required
                    : module.ostgraduateCounts.required
                }
                appliedTANumber={
                  userRole === "undergraduate"
                    ? module.undergraduateCounts.required -
                      module.undergraduateCounts.remaining
                    : module.postgraduateCounts.required -
                      module.postgraduateCounts.remaining
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
            <p className="text-lg text-text-secondary">
              No Available TA Positions...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TADashboard;
