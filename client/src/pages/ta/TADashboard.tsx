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
import axiosInstance from "../../api/axiosConfig";

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
    userRole: string,
    moduleId: string,
    recSeriesId: string,
    taHours: number
  ) => {
    try {
      const response = await axiosInstance.post("/ta/apply", {
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

  // const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!user) return;
    const fetchModules = async () => {
      try {
        const response = await axiosInstance.get(
          "/ta/requests"
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
    <div className="min-h-screen px-2 sm:px-4 bg-bg-page text-text-primary">
      <div className="container px-2 py-4 mx-auto sm:px-4 sm:py-8">
        {/* header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="flex flex-col items-center justify-center gap-2 mb-4 sm:flex-row sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center sm:text-3xl lg:text-4xl">
              TA Application Portal
            </h1>
          </div>
          {/* <p className="max-w-2xl mx-auto text-lg text-text-secondary">
            Apply for Teaching Assistant positions across various computer
            science modules. Find the perfect opportunity to share your
            knowledge and gain valuable experience.
          </p> */}
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:gap-6 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="sm:col-span-2 lg:col-span-1">
            <TAStatCard
              statName="Remaining TA Hours Per Week"
              statValue={availableHoursPerWeek}
              icon={Newspaper}
            />
          </div>
        </div>
      </div>

      <div className="gap-2 p-4 m-2 rounded-lg sm:p-6 lg:p-8 sm:m-4 lg:m-8 bg-bg-card">
        <div className="gap-2 ">
          {/* Header - Available TA Positions */}
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <h2 className="text-xl font-semibold sm:text-2xl text-foreground">
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
            <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
              {/*  Search input */}
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-dark bg-bg-card text-text-primary placeholder:text-text-secondary"
              />

              {/*  Sorting modules */}
              <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
                <div className="relative inline-flex w-full overflow-hidden border rounded-lg shadow-sm border-border-default bg-bg-card group sm:w-auto">
                  <select
                    value={sortOption}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full px-4 py-2 pr-10 text-sm font-medium bg-transparent appearance-none cursor-pointer sm:w-auto text-text-secondary hover:bg-primary-light/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-dark"
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
                <div className="flex justify-center sm:justify-start">
                  <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <p className="text-base sm:text-lg text-text-secondary">Loading...</p>
          </div>
        ) : modules.length > 0 ? (
          <div
            className={
              viewMode === "cards"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6"
                : "space-y-3 sm:space-y-4"
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
                    : module.postgraduateCounts.required
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
                    user?.role || "",
                    module._id,
                    module.recruitmentSeriesId,
                    module.requiredTAHours
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="text-base sm:text-lg text-text-secondary">
              No Available TA Positions...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TADashboard;
