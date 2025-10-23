import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaBoxOpen } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { Checkbox } from "@headlessui/react";
import { BiEdit } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";

import axiosInstance from "../api/axiosConfig";
import Loader from "./Loader";
import { useToast } from "../contexts/ToastContext";

interface UndergraduateUser {
  _id: string;
  indexNumber: string;
  name: string;
  email: string;
  profilePicUrl: string;
  dateAdded: string;
}

interface UserRowProps extends UndergraduateUser {
  role: string;
  setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAll: boolean;
  setSelectedAll: React.Dispatch<React.SetStateAction<boolean>>;
  setRefreshFlag: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserRow: React.FC<UserRowProps> = ({
  _id,
  email,
  name,
  role,
  dateAdded,
  indexNumber,
  profilePicUrl,
  setSelectedUsers,
  selectedAll,
  setSelectedAll,
  setRefreshFlag,
}) => {
  const [marked, setMarked] = React.useState(false);
  const { showToast } = useToast();

  const handleRowCheckboxChange = (checked: boolean) => {
    setMarked(checked);
    if (checked) {
      setSelectedUsers((prev) => [...prev, _id]);
    } else {
      if (selectedAll) {
        setSelectedAll(false);
      }
      setSelectedUsers((prev) => prev.filter((user) => user !== _id));
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axiosInstance.delete(`/user-management/users/${_id}`);
      showToast("User deleted successfully", "success");
      setRefreshFlag(true);
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const handleEditUser = () => {

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
      <td className="flex justify-center">
        <img
          src={profilePicUrl}
          alt={`${name}'s profile`}
          className="h-10 w-10 rounded-full"
        />
      </td>
      <td>{indexNumber}</td>
      <td>
        <a href={`mailto:${email}`}>{email}</a>
      </td>
      <td>{name}</td>
      <td>{dateAdded}</td>
      <td className="p-0">
        <div className="flex flex-1 gap-x-5 items-center justify-center">
          <BiEdit className="p-1.5 bg-primary text-text-inverted rounded-md inline-block h-8 w-8 cursor-pointer hover:bg-primary-light font-semibold transition" />
          <AiOutlineDelete className="p-1.5 bg-warning text-text-inverted rounded-md inline-block h-8 w-8 cursor-pointer hover:bg-warning/90 font-semibold transition" />
        </div>
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UndergraduateUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const handleHeaderCheckboxChange = (checked: boolean) => {
    setSelectedUsers([]);
    if (checked) {
      setSelectedUsers(users.map((user: any) => user.id));
    }
    setSelectedAll(checked);
  };

  const FetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/user-management/groups/${id}/users`
      );
      setUsers(response.data);
      console.log(response.data);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching module details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && !hasFetched) {
      FetchUsers();
    }
  }, [isExpanded, hasFetched]);

  useEffect(() => {
    if (refreshFlag) {
      FetchUsers().then(() => setRefreshFlag(false));
    }
  }, [refreshFlag]);

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

          {/* <div className="flex gap-x-4 ml-2 mt-1">
            <p className="text-xs text-text-secondary font-semibold">
              20 approved TAs
            </p>
            <p className="text-xs text-text-secondary font-semibold">
              5 appointed TAs
            </p>
            <p className="text-xs text-text-secondary font-semibold">
              6 applications pending results
            </p>
          </div> */}
        </div>
      </div>
      <div
        className={`${
          isExpanded ? "flex opacity-100" : "hidden max-h-0 opacity-0"
        } transition-all ease-in-out duration-1000 flex-col items-center w-full`}
      >
        {/* Expanded content goes here */}
        {isLoading ? (
          <Loader className="my-6 w-full" />
        ) : users.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-6">
            <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
            <p className="text-lg text-text-secondary font-semibold">
              No users from this group.
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Start by adding a user to this group.
            </p>
          </div>
        ) : (
          <div className="max-h-30 overflow-x-auto w-full">
            <table className="table table-pin-rows bg-bg-card">
              <thead>
                <tr>
                  <th className="w-4">
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
                  <th className="w-10">Profile Picture</th>
                  <th className="w-24">Index Number</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th className="w-32 text-wrap text-center">
                    Added to the system on
                  </th>
                  <th className="w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user._id}
                    _id={user._id}
                    indexNumber={user.indexNumber}
                    email={user.email}
                    name={user.name}
                    dateAdded={new Date(user.dateAdded)
                      .toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(/(\w{3}) (\d{4})/, "$1, $2")}
                    profilePicUrl={user.profilePicUrl}
                    role="undergraduate"
                    setSelectedUsers={setSelectedUsers}
                    selectedAll={selectedAll}
                    setSelectedAll={setSelectedAll}
                    setRefreshFlag={setRefreshFlag}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersGroupCard;
