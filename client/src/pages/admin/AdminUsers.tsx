import React, { useState, useEffect } from "react";
import UsersGroupCard from "../../components/admin/UserGroupCard";

import { FaBoxOpen } from "react-icons/fa";

import axiosInstance from "../../api/axiosConfig";
import Loader from "../../components/common/Loader";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
  groupType: 'admin' | 'hod' | 'cse-office';
}

const AdminUsers: React.FC = () => {
  const [adminGroups, setAdminGroups] = useState<UserGroup[]>([]);
  const [hodGroups, setHodGroups] = useState<UserGroup[]>([]);
  const [officeGroups, setOfficeGroups] = useState<UserGroup[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

  const refreshPage = () => {
    setRefreshFlag(true);
  };

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        "/user-management/groups/admin-office-hod-users"
      );
      console.log("Fetched admin/office/HoD groups:", res.data);
      setAdminGroups(res.data.filter((group: UserGroup) => group.groupType === "admin"));
      setHodGroups(res.data.filter((group: UserGroup) => group.groupType === "hod"));
      setOfficeGroups(res.data.filter((group: UserGroup) => group.groupType === "cse-office"));
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
        <h1 className="text-3xl font-bold w-full">Admin Users</h1>
        <p className="text-text-secondary mb-4 -mt-3 w-full">Manage admin users and their user groups.</p>
        {isLoading ? (
          <Loader className="my-6 w-full" />
        ) : (
          <>
            {adminGroups.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-6">
                <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                <p className="text-lg text-text-secondary font-semibold">
                  No admin groups to show.
                </p>
              </div>
            ) : (
              adminGroups.map((group) => (
                <UsersGroupCard
                  userType="admin"
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

        <h1 className="text-3xl font-bold w-full mt-5">Head of Department</h1>
        <p className="text-text-secondary mb-4 -mt-3 w-full">Manage HoDs and their user groups.</p>
        {isLoading ? (
          <Loader className="my-6 w-full" />
        ) : (
          <>
            {adminGroups.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-6">
                <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                <p className="text-lg text-text-secondary font-semibold">
                  No HoD groups to show.
                </p>
              </div>
            ) : (
              hodGroups.map((group) => (
                <UsersGroupCard
                  userType="hod"
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

        <h1 className="text-3xl font-bold w-full mt-5">CSE Office Users</h1>
        <p className="text-text-secondary mb-4 -mt-3 w-full">Manage CSE Office users and their user groups.</p>
        {isLoading ? (
          <Loader className="my-6 w-full" />
        ) : (
          <>
            {adminGroups.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-6">
                <FaBoxOpen className="h-8 w-8 text-text-secondary mb-2" />
                <p className="text-lg text-text-secondary font-semibold">
                  No CSE Office groups to show.
                </p>
              </div>
            ) : (
              officeGroups.map((group) => (
                <UsersGroupCard
                  userType="cse-office"
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

export default AdminUsers;