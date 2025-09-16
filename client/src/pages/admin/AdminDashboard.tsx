import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import RSCard from "../../components/admin/RecruitmentSeriesCard";
import { LuCirclePlus } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import axiosInstance from "../../api/axiosConfig";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface RecruitmentSeriesData {
  _id: string;
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
  status: "initialised" | "active" | "archived";
  moduleCount: number;
  undergraduateTAPositionsCount: number;
  postgraduateTAPositionsCount: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recruitmentSeriesList, setRecruitmentSeriesList] = useState<
    RecruitmentSeriesData[]
  >([]);

  const fetchRecruitmentSeries = async () => {
    try {
      const res = await axiosInstance.get("/recruitment-series");
      if (res.status === 200) {
        setRecruitmentSeriesList(res.data);
      }
    } catch (error) {
      console.error("Error fetching recruitment series:", error);
    }
  };

  const initialisedSeries = recruitmentSeriesList.filter(
    (series) => series.status === "initialised"
  );
  const publishedSeries = recruitmentSeriesList.filter(
    (series) => series.status === "active"
  );
  const archivedSeries = recruitmentSeriesList.filter(
    (series) => series.status === "archived"
  );

  useEffect(() => {
    fetchRecruitmentSeries();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      {/* <p className="text-3xl font-bold font-montserrat mb-5 select-none">
        Hi, {user?.name} 👋
      </p> */}
      <div className="flex items-center justify-between w-full">
        <p className="text-3xl font-semibold select-none font-raleway">
          Recruitment Rounds
        </p>
        <div
          className="p-1.5 px-3 flex rounded-md gap-x-3 transition-colors duration-200 cursor-pointer group text-text-inverted bg-primary hover:bg-primary-light items-center"
          onClick={() => navigate("/recruitment-series/create")}
        >
          <LuCirclePlus className="h-6 w-6" />
          <p className="flex flex-col select-none items-center text-lg font-raleway text-nowrap text-center">
            New Recruitment Round
          </p>
        </div>
      </div>

      {/* Active */}
      <p className="mt-4 text-2xl font-semibold select-none font-raleway">
        Active Recruitment Rounds
      </p>
      <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
        <div className="w-full space-y-2">
          {publishedSeries.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-6">
              <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
              <p className="text-lg text-text-secondary font-semibold">
                No active Recruitment rounds at this moment.
              </p>
            </div>
          ) : (
            publishedSeries.map((series) => (
              <RSCard key={series._id} {...series} />
            ))
          )}
        </div>
      </div>

      {/* Initialised */}
      <p className="mt-4 text-2xl font-semibold select-none font-raleway">
        Initialised Recruitment Rounds
      </p>
      <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
        <div className="w-full space-y-2">
          {initialisedSeries.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-6">
              <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
              <p className="text-lg text-text-secondary font-semibold">
                No initialised Recruitment rounds at this moment.
              </p>
            </div>
          ) : (
            initialisedSeries.map((series) => (
              <RSCard key={series._id} {...series} />
            ))
          )}
        </div>
      </div>

      {/* Archived */}
      <p className="mt-4 text-2xl font-semibold select-none font-raleway">
        Archived Recruitment Rounds
      </p>
      <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
        <div className="w-full space-y-2">
          {archivedSeries.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-6">
              <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
              <p className="text-lg text-text-secondary font-semibold">
                No archived Recruitment rounds at this moment.
              </p>
            </div>
          ) : (
            archivedSeries.map((series) => (
              <RSCard key={series._id} {...series} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
