import React, { useState, useEffect } from "react";
import UsersGroupCard from "../../components/admin/UserGroupCard";

import { FaBoxOpen } from "react-icons/fa";

import axiosInstance from "../../api/axiosConfig";
import Loader from "../../components/common/Loader";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

const LecturerUsers: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

  const refreshPage = () => {
    setRefreshFlag(true);
  };

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        "/user-management/groups/lecturer"
      );
      setUserGroups(res.data);
    } catch (error) {
      console.error("Failed to fetch user groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

  useEffect(() => {
    if (refreshFlag) {
      fetchUserGroups().then(() => setRefreshFlag(false));
    }
  }, [refreshFlag]);

  return (
    <>
      <div
        className={`min-h-screen w-full flex flex-col ${
          isLoading ? "items-center" : "items-start"
        } justify-start bg-bg-page text-text-primary px-20 py-5 gap-y-3`}
      >
        <h1 className="text-3xl font-bold w-full">Lecturer Users</h1>
        <p className="text-text-secondary mb-4 -mt-3 w-full">Manage lecturers and their user groups.</p>
        {isLoading ? (
          <Loader className="my-6 w-full" />
        ) : (
          <>
            {userGroups.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-6">
                <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                <p className="text-lg text-text-secondary font-semibold">
                  No lecturer groups to show.
                </p>
              </div>
            ) : (
              userGroups.map((group) => (
                <UsersGroupCard
                userType="lecturer"
                  key={group._id}
                  id={group._id}
                  groupName={group.name}
                  userCount={group.userCount}
                  refreshPage={refreshPage}
                />
              ))
            )}
          </>
        )}
      </div>      
    </>
  );
};

export default LecturerUsers;