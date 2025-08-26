import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { Checkbox } from "@headlessui/react";
import { BiEdit } from 'react-icons/bi';
import { AiOutlineDelete } from 'react-icons/ai';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicUrl: string;
  role: string;
  dateAdded: string;
}

interface UserRowProps extends User {
  setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAll: boolean;
  setSelectedAll: React.Dispatch<React.SetStateAction<boolean>>;
}



const UserRow: React.FC<UserRowProps> = ({
  id,
  email,
  name,
  role,
  dateAdded,
  profilePicUrl,
  setSelectedUsers,
  selectedAll,
  setSelectedAll
}) => {
  const [marked, setMarked] = React.useState(false);

  const handleRowCheckboxChange = (checked: boolean) => {
    setMarked(checked);
    if (checked) {
      setSelectedUsers((prev) => [...prev, id]);
    } else {
      if (selectedAll) {
        setSelectedAll(false);
      }
      setSelectedUsers((prev) => prev.filter((user) => user !== id));
    }
  };

  useEffect(() => {
    setMarked(selectedAll);
  }, [selectedAll]);

  return (
    <tr
      className={`transition ${
        marked || selectedAll
          ? "bg-primary/10 hover:bg-primary/20"
          : "hover:bg-text-secondary/10"
      }`}
    >
      <td>
        <Checkbox
          checked={marked}
          onChange={setMarked}
          className="cursor-pointer group block size-5 rounded border bg-primary-light/10 transition data-[checked]:bg-primary"
        >
          <svg
            className="stroke-bg-card opacity-0 transition group-data-[checked]:opacity-100"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Checkbox>
      </td>
      <td></td>
      <td>{email}</td>
      <td>{name}</td>
      <td>{dateAdded}</td>
      <td>
        <BiEdit className="p-1 outline outline-1 outline-text-secondary rounded-md inline-block mr-4 h-6 w-6 cursor-pointer text-text-secondary hover:bg-primary hover:text-text-inverted transition" />
        <AiOutlineDelete className="p-1 outline outline-1 outline-text-secondary rounded-md inline-block mr-4 h-6 w-6 cursor-pointer text-text-secondary hover:bg-warning hover:text-text-inverted transition" />
      </td>
    </tr>
  );
};

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
  const [selectedAll, setSelectedAll] = React.useState(false);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [users, setUsers] = React.useState<[]>([]);

  const handleHeaderCheckboxChange = (checked: boolean) => {
    setSelectedUsers([]);
    if (checked) {
      setSelectedUsers(users.map((user: any) => user.id));
    }
    setSelectedAll(checked);
  };

  return (
    <div className="bg-bg-card outline outline-text-secondary/50 outline-1 flex w-full flex-col items-center rounded-md p-2">
      <div className="flex flex-row w-full items-center">
        <FaChevronRight
          className={`m-1 p-1 h-6 w-6 rounded-full hover:bg-primary-light/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
            isExpanded ? "rotate-90" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        />

        <div className="flex flex-col flex-1">
          <div className="flex flex-1 flex-row items-center justify-center">
            <p className="flex select-none text-md font-semibold ml-2">
              {groupName}
            </p>
            <p className="text-xs rounded-full py-1 px-2 ml-4 bg-primary-light text-text-inverted font-semibold">
              {userCount} Users
            </p>
            <div className="flex flex-1 justify-end">
              <MdMoreVert className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-6 w-6 p-0.5" />
            </div>
          </div>

          <div className="flex gap-x-4 ml-2 mt-1">
            <p className="text-xs text-text-secondary font-semibold">
              20 approved TAs
            </p>
            <p className="text-xs text-text-secondary font-semibold">
              5 appointed TAs
            </p>
            <p className="text-xs text-text-secondary font-semibold">
              6 applications pending results
            </p>
          </div>
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
                <th>
                  <Checkbox
                    checked={selectedAll}
                    onChange={handleHeaderCheckboxChange}
                    className="cursor-pointer group block size-5 rounded border bg-primary-light/10 transition data-[checked]:bg-primary"
                  >
                    <svg
                      className="stroke-bg-card opacity-0 transition group-data-[checked]:opacity-100"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Checkbox>
                </th>
                <th>Profile Picture</th>
                <th>Email</th>
                <th>Name</th>
                <th>Added to the system on</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <UserRow
                id="1"
                email="thumul.22@cse.mrt.ac.lk"
                name="Thumul Dasun"
                dateAdded="2023-01-01"
                profilePicUrl=""
                role="undergraduate"
                setSelectedUsers={setSelectedUsers}
                selectedAll={selectedAll}
                setSelectedAll={setSelectedAll}
              />
              <UserRow
                id="2"
                email="thumul.22@cse.mrt.ac.lk"
                name="Thumul Dasun"
                dateAdded="2023-01-01"
                profilePicUrl=""
                role="undergraduate"
                setSelectedUsers={setSelectedUsers}
                selectedAll={selectedAll}
                setSelectedAll={setSelectedAll}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersGroupCard;
