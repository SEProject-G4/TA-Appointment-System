import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";

interface UsersGroupCardProps {
  id: string;
  groupName: string;
  userCount: number;
}

const UsersGroupCard: React.FC<UsersGroupCardProps> = ({
  id,
  userCount,
  groupName,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="flex w-full flex-col items-center outline-solid outline-2 outline-text-secondary/80 rounded-md p-2">
      <div className="flex flex-row w-full items-center">
        <FaChevronRight
          className={`p-1 h-6 w-6 rounded-full hover:bg-primary-light/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
            isExpanded ? "rotate-90" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        />

        <div className="flex flex-1 flex-row flex-wrap items-start justify-start">
          <p className="flex select-none text-md font-semibold ml-2">
            {groupName}
            <span className="text-sm rounded-full p-1 bg-bg-page text-text-secondary">
              {userCount} Users
            </span>
          </p>
          <div className="flex flex-1 justify-end">
            <MdMoreVert className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-6 w-6 p-0.5" />
          </div>

          <p className="text-sm text-text-secondary">20 approved TAs</p>
          <p className="text-sm text-text-secondary">5 appointed TAs</p>
          <p className="text-sm text-text-secondary">
            6 applications pending results
          </p>
        </div>
      </div>
      <div
        className={`${
          isExpanded ? "flex opacity-100" : "hidden max-h-0 opacity-0"
        } transition-all ease-in-out duration-1000 flex-col items-center w-full`}
      >
        {/* Expanded content goes here */}
        <div className="max-h-30 overflow-x-auto w-full">
            <table className="table table-pin-rows bg-bg-card">
                <thead>
                    <tr>
                        <th>Profile Picture</th>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Index</th>
                        <th>Added to the system on</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Module 1</td>
                        <td>Approved</td>
                    </tr>
                    <tr>
                        <td>Module 2</td>
                        <td>Pending</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default UsersGroupCard;
