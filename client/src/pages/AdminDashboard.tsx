import React, {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RSCard from "../components/RecruitmentSeriesCard";
import { LuCirclePlus } from "react-icons/lu";
import axiosInstance from "../api/axiosConfig";

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
  status: "initialised" | "published" | "archived";
  moduleCount: number;
  undergraduateTAPositionsCount: number;
  postgraduateTAPositionsCount: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recruitmentSeriesList, setRecruitmentSeriesList] = useState<RecruitmentSeriesData[]>([]);

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

  useEffect(() => {
    fetchRecruitmentSeries();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <p className="text-3xl font-bold font-montserrat mb-5 select-none">
        Hi, {user?.name} 👋
      </p>
      <p className="text-2xl font-semibold select-none font-raleway">
        Recruitment Series
      </p>
      <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
        <div className="w-full  space-y-2">
          {recruitmentSeriesList.map((series) => (
            <RSCard key={series._id} {...series} />
          ))}
        </div>
        <div className="m-10 group text-text-secondary opacity-50 hover:opacity-80 hover:text-primary-light flex flex-col items-center">
          <LuCirclePlus
            className="h-24 w-24 cursor-pointer transition-colors duration-200"
            onClick={() => navigate("/recruitment-series/create")}
          />
          <p
            className="flex flex-col select-none items-center cursor-pointer text-lg font-raleway w-24 text-nowrap text-center"
            onClick={() => navigate("/recruitment-series/create")}
          >
            New Recruitment Series
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
