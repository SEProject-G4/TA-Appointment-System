import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronRight, FaBoxOpen } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { Checkbox } from "@headlessui/react";
import { BiEdit } from "react-icons/bi";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";

import axiosInstance from "../../api/axiosConfig";
import Loader from "../common/Loader";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalProvider";

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
  refreshCard: () => void;
}

const validateField = (name: string, value: string): string => {
  switch (name) {
    case "indexNumber":
      if (!value) return "Index Number is required.";
      if (value.length > 10) return "Index Number cannot exceed 10 characters.";
      return "";
    case "email":
      if (!value) return "Email is required.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Invalid email format.";
      return "";
    case "name":
      if (!value) return "Name is required.";
      return "";
    default:
      return "";
  }
};

const updateUserDetails = async (
  id: string,
  formData: { indexNumber: string; name: string; email: string }
) => {
  const payload = {
    ...formData,
    role: "undergraduate",
  };
  try {
    const response = await axiosInstance.put(
      `user-management/users/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user details:", error);
    throw error;
  }
};

const EditUserModal: React.FC<{
  userData: {
    _id: string;
    indexNumber: string;
    name: string;
    email: string;
  };
  refreshCard: () => void;
}> = ({ userData, refreshCard }) => {
  const [formData, setFormData] = useState<{
    indexNumber: string;
    name: string;
    email: string;
  }>({
    indexNumber: userData.indexNumber,
    name: userData.name,
    email: userData.email,
  });

  const [inputErrors, setInputErrors] = useState<{
    indexNumber?: string;
    email?: string;
    name?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setInputErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const { showToast } = useToast();
  const { closeModal } = useModal();
  // Modal implementation here

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Edit User Details</h2>
      <div className="flex flex-col space-y-6">
        {/* Index Number */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Index Number</span>
          </label>
          <input
            type="text"
            name="indexNumber"
            placeholder="e.g. 220001A"
            value={formData.indexNumber}
            onChange={handleChange}
            maxLength={10}
            className="ml-8 new-module-input"
          />
          {inputErrors.indexNumber && (
            <span className="text-warning text-sm ml-16 py-1 block">
              {inputErrors.indexNumber}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="e.g. testuser@cse.mrt.ac.lk"
            value={formData.email}
            onChange={handleChange}
            className="ml-8 max-w-full w-96 new-module-input"
          />
          {inputErrors.email && (
            <span className="text-warning text-sm ml-16 py-1 block">
              {inputErrors.email}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Name</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Test User"
            value={formData.name}
            onChange={handleChange}
            className="ml-8 new-module-input"
          />
          {inputErrors.name && (
            <span className="text-warning text-sm ml-16 py-1 block">
              {inputErrors.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-x-4 mt-8">
        <button
          type="button"
          className="px-4 py-2 bg-text-secondary/50 text-text-primary rounded-md"
          onClick={() => closeModal()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-text-inverted rounded-md"
          onClick={() => {
            if (
              !inputErrors.indexNumber &&
              !inputErrors.email &&
              !inputErrors.name
            ) {
              updateUserDetails(userData._id, formData)
                .then(() => {
                  showToast("User details updated successfully", "success");
                  closeModal();
                  refreshCard();
                })
                .catch(() => {
                  showToast("Failed to update user details", "error");
                });
            } else {
              showToast("Please fix the input errors before saving.", "error");
            }
          }}
        >
          Save Changes
        </button>
      </div>
    </>
  );
};

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
  refreshCard,
}) => {
  const [marked, setMarked] = React.useState(false);
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();

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

  const deleteUser = async (id: string) => {
    try {
      await axiosInstance.delete(`/user-management/users/${id}`);
      showToast("User deleted successfully", "success");
      refreshCard();
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const handleDeleteUser = (
    _id: string,
    name: string,
    email: string,
    indexNumber: string
  ) => {
    openModal(
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p>Are you sure you want to delete this user?</p>
        <p className="text-sm text-gray-500">
          {name} ({email}) - {indexNumber}
        </p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => {
              deleteUser(_id);
              closeModal();
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  const handleEditUser = (
    id: string,
    name: string,
    email: string,
    indexNumber: string
  ) => {
    openModal(
      <EditUserModal userData={{ _id: id, name, email, indexNumber }} refreshCard={refreshCard} />,
      { showCloseButton: true }
    );
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
          onChange={handleRowCheckboxChange}
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
          <AiOutlineEdit
            className="p-1 hover:bg-primary hover:text-text-inverted hover:outline-primary text-primary rounded-md inline-block h-7 w-7 cursor-pointer outline outline-1 outline-primary/50 font-semibold transition"
            onClick={() => handleEditUser(_id, name, email, indexNumber)}
          />
          <AiOutlineDelete
            className="p-1 hover:bg-warning hover:text-text-inverted hover:outline-warning text-warning rounded-md inline-block h-7 w-7 cursor-pointer outline outline-1 outline-warning/50 font-semibold transition"
            onClick={() => handleDeleteUser(_id, name, email, indexNumber)}
          />
        </div>
      </td>
    </tr>
  );
};

interface UsersGroupCardProps {
  id: string;
  groupName: string;
  userCount: number;
  refreshPage: () => void;
}



const RenameUserGroupModal: React.FC<{
  groupId: string;
  currentName: string;
  refreshPage: () => void;
}> = ({ groupId, currentName, refreshPage }) => {
  const [newName, setNewName] = useState<string>(currentName);
  const [inputError, setInputError] = useState<string>("");

    const renameUserGroup = async (groupId: string, newName: string) => {
    try {
      await axiosInstance.put(`/user-management/groups/${groupId}`, {
        newName,
      });
      showToast("User group renamed successfully", "success");
      refreshPage();
    } catch (error) {
      console.error("Error renaming user group:", error);
      showToast("Failed to rename user group", "error");
    }
  };

  const { closeModal } = useModal();
  const { showToast } = useToast();

  return (
    <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Rename User Group</h2>
        <div className="flex flex-col space-y-6">
          {/* New User Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">New User Group Name</span>
            </label>
            <input
              type="text"
              name="newName"
              placeholder="e.g. Intake 2022"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value.length == 0) {
                  setInputError("Group name can't be empty");
                } else {
                  setInputError("");
                }
              }}
              className="ml-8 new-module-input"
            />
            {inputError && (
              <span className="text-warning text-sm ml-16 py-1 block">
                {inputError}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-x-4 mt-4 w-full justify-end">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => {
              renameUserGroup(groupId, newName);
              closeModal();
            }}
          >
            Rename
          </button>
        </div>
      </div>
  );
};

const UsersGroupCard: React.FC<UsersGroupCardProps> = ({
  id,
  userCount,
  groupName,
  refreshPage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedAll, setSelectedAll] = useState<boolean>(false);
  const [cardRefreshFlag, setCardRefreshFlag] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UndergraduateUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(groupName);
  const [inputError, setInputError] = useState<string>("");

  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const refreshCard = () => {
    setCardRefreshFlag(true);
    // setTimeout(() => {
    //   setCardRefreshFlag(false);
    // }, 1000);
  };

  const deleteUserGroup = async (groupId: string) => {
    try {
      await axiosInstance.delete(`/user-management/groups/${groupId}`);
      showToast("User group deleted successfully", "success");
      refreshPage();
    } catch (error) {
      console.error("Error deleting user group:", error);
      showToast("Failed to delete user group", "error");
    }
  };

  const deleteSelectedUsers = async () => {
    try {
      const response = await axiosInstance.post(
        `/user-management/users/delete`,
        {
          userIds: selectedUsers,
        }
      );
      showToast(
        `${response.data.deletedCount} users deleted successfully`,
        "success"
      );
      setSelectedAll(false);
      setSelectedUsers([]);
      refreshCard();
    } catch (error) {
      console.error("Error deleting selected users:", error);
      showToast("Failed to delete selected users", "error");
    }
  };



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

  const handleDeleteUserGroup = (
    groupId: string,
    groupName: string,
    count: number
  ) => {
    openModal(
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p>
          Are you sure you want to delete this user group and all its {count}{" "}
          users?
        </p>
        <p className="text-sm text-text-secondary font-semibold">{groupName}</p>
        <p className="text-sm text-text-secondary">
          This will permanently remove all the users in this group from the
          system and delete the group.
        </p>
        <div className="flex gap-x-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => {
              deleteUserGroup(groupId);
              closeModal();
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  const handleDeleteSelectedUsers = () => {
    openModal(
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p>
          Are you sure you want to delete selected {selectedUsers.length} users?
        </p>

        <div className="flex gap-x-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => {
              deleteSelectedUsers();
              closeModal();
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      { showCloseButton: false }
    );
  };

  const handleRenameUserGroup = (groupId: string) => {
    setInputError("");
    openModal(
      <RenameUserGroupModal groupId={groupId} currentName={groupName} refreshPage={refreshPage} />,
      { showCloseButton: true }
    );
  };

  const handleAddUsers = (groupId: string) => {
    navigate(`/manage-users/add-user`, { state: { groupId, role: "undergraduate" } });
  };

  useEffect(() => {
    if (isExpanded && !hasFetched) {
      FetchUsers();
    }
  }, [isExpanded, hasFetched]);

  useEffect(() => {
    if (cardRefreshFlag) {
      FetchUsers().then(() => setCardRefreshFlag(false));
    }
  }, [cardRefreshFlag]);

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
              <div className="dropdown dropdown-end">
                <MdMoreVert tabIndex={0} role="button" className="rounded-full cursor-pointer hover:bg-accent-light/20 font-semibold h-6 w-6 p-0.5" />
                <ul
                  tabIndex={0}
                  className="menu mt-3 z-[1] p-2 shadow dropdown-content bg-bg-card rounded-box w-64"
                >
                  <li className="rounded p-1 hover:bg-primary/80 hover:text-text-inverted text-text-secondary font-semibold">
                    <button
                      className="w-full text-left"
                      onClick={() => handleRenameUserGroup(id)}
                    >
                      Rename Group
                    </button>
                  </li>
                  <li className="rounded p-1 hover:bg-primary/80 hover:text-text-inverted text-text-secondary font-semibold">
                    <button
                      className="w-full text-left"
                      onClick={() => handleDeleteUserGroup(id, groupName, userCount)}
                    >
                      Delete Whole User Group
                    </button>
                  </li>
                </ul>
              </div>

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
          <>
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
                      refreshCard={refreshCard}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex border-t-[1px] border-solid border-text-secondary w-full mx-0 p-2 pt-3 pb-2 items-center ">
              <p className="text-sm text-text-secondary font-semibold">
                {selectedAll
                  ? users.length === 1
                    ? "1 user selected"
                    : `${users.length} users selected`
                  : "No users selected"}
              </p>
              <div className="flex flex-1 justify-end gap-x-4">
                <button
                  className="py-2 px-3 hover:bg-warning/10 outline outline-2 font-semibold disabled:hover:text-warning disabled:hover:bg-transparent outline-warning text-warning rounded-md disabled:opacity-50"
                  onClick={() => {
                    handleDeleteSelectedUsers();
                  }}
                  disabled={selectedUsers.length === 0}
                >
                  Delete Selected Users
                </button>
                <button
                  className="py-2 px-3 hover:bg-text-secondary/20 outline outline-2 font-semibold outline-text-secondary text-text-primary rounded-md "
                  onClick={() => {
                    handleRenameUserGroup(id);
                  }}
                >
                  Rename User Group
                </button>

                <button
                  className="py-2 px-3 font-semibold bg-warning text-text-inverted rounded-md"
                  onClick={() => {
                    handleDeleteUserGroup(id, groupName, userCount);
                  }}
                >
                  Delete Whole User Group
                </button>

                <button
                  className="py-2 px-3 font-semibold hover:bg-primary-dark hover:text-text-inverted text-primary rounded-md outline outline-1 outline-primary"
                  onClick={() => {
                    // Handle add user(s) to this group
                    handleAddUsers(id);
                  }}
                >
                  Add New User(s)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersGroupCard;
