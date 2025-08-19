import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { LuCirclePlus } from 'react-icons/lu';

interface RecruitmentSeriesCardProps {
  id: number;
  title: string;
  className?: string;
}

const RecruitmentSeriesCard: React.FC<RecruitmentSeriesCardProps> = ({
  id,
  title,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className={`flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-2 ${className}`}
    >
      <div className="flex flex-row w-full items-center">
        <FaChevronRight
          className={`p-1 h-6 w-6 rounded-full hover:bg-primary-light/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
            isExpanded ? "rotate-90" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        />
        <p className="flex flex-1 select-none text-md font-semibold ml-2">
          {title}
        </p>
        {isExpanded && (
          <MdMoreVert className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-6 w-6 p-0.5" />
        )}
      </div>
      <div
        className={`${
          isExpanded ? "flex opacity-100" : "hidden max-h-0 opacity-0"
        } transition-all ease-in-out duration-1000 flex-col items-center w-full`}
      >
        <div className="w-full flex flex-row flex-wrap justify-start items-start content-start">
          <div className="h-12 w-8 rounded-md bg-bg-card m-1 shadow-sm"></div>
        </div>
        <Link
          to={"/recruitment-series/" + id + "/add-module"}
          className="flex flex-row items-center text-text-inverted hover:drop-shadow-lg font-raleway font-semibold bg-gradient-to-tr from-primary-light to-primary-dark rounded-2xl p-2 px-5"
        >
        <LuCirclePlus className="h-5 w-5 mr-2" />
          Add Module
        </Link>
      </div>
    </div>
  );
};

export default RecruitmentSeriesCard;
