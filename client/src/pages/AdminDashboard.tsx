import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CollapsibleCard from "../components/RecruitmentSeriesCard";
import { LuCirclePlus } from "react-icons/lu";

const recruitment_series = [
  { id: 1, name: "2025 - 2,4,6,8 Semesters" },
  { id: 2, name: "2025 - 3,5,7 Semesters" },
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary p-20">
      <p className="text-3xl font-bold font-montserrat mb-5 select-none">
        Hi, {user?.name} 👋
      </p>
      <p className="text-2xl font-semibold select-none font-raleway">
        Recruitment Series
      </p>
      <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
        <div className="w-full  space-y-2">
          {recruitment_series.map((series) => (
            <CollapsibleCard key={series.id} id={series.id} title={series.name} />
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
