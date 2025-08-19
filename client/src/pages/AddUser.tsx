import "./AddUser.css";

import React, { useState } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { FaPlus, FaMinus } from "react-icons/fa";
import { AiOutlinePlusCircle } from "react-icons/ai";
import {
  Input,
  Select,
  Tab,
  TabGroup,
  TabPanel,
  TabPanels,
  TabList,
  Dialog,
  DialogTitle,
  DialogPanel,
  Radio,
  RadioGroup,
} from "@headlessui/react";

interface User {
  email: string;
  indexNumber: string;
}

interface UserGroup {
  id: string;
  name: string;
  userCount: number;
}

function AddUser() {
  const [userRole, setUserRole] = useState("undergraduate");
  const [users, setUsers] = useState<User[]>([{ email: "", indexNumber: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserGroups, setAllUserGroups] = useState<UserGroup[]>([
    { id: "1", name: "Undergrads In22", userCount: 200 },
    { id: "2", name: "Postgrads In22", userCount: 15 },
    // Add more groups as needed
  ]);
  const userGroups = allUserGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // New User Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  // Fetch user groups (simulate reload)
  const fetchUserGroups = async () => {
    // TODO: Replace with real API call
    // const response = await fetch('/api/user-groups');
    // const data = await response.json();
    // setAllUserGroups(data);
    setAllUserGroups([
      { id: "1", name: "Undergrads In22", userCount: 200 },
      { id: "2", name: "Postgrads In22", userCount: 15 },
      // Add more groups as needed
    ]);
  };

  // Create group handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingGroup(true);
    setGroupError("");
    try {
      // Replace with your backend endpoint
      const response = await fetch("/api/user-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!response.ok) {
        throw new Error("Failed to create group");
      }
      setIsGroupModalOpen(false);
      setNewGroupName("");
      await fetchUserGroups();
    } catch (err: any) {
      setGroupError(err.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleUserChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [name]: value };
    setUsers(newUsers);
  };

  const handleAddUser = () => {
    setUsers([...users, { email: "", indexNumber: "" }]);
  };

  const handleRemoveUser = (index: number) => {
    if (users.length > 1) {
      const newUsers = users.filter((_, i) => i !== index);
      setUsers(newUsers);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Prepare the JSON object to send to the backend
    const payload = {
      users: users,
      userRole: userRole,
    };

    console.log("Sending payload to backend:", payload);

    try {
      // Replace this with your actual API call
      // const response = await fetch('/api/add-users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      // Simulate a backend response
      const response = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  message: `${users.length} users successfully added as ${userRole}s.`,
                }),
            }),
          2000
        )
      );

      const responseData = await (response as any).json();
      if ((response as any).ok) {
        setDialogMessage(responseData.message);
      } else {
        setDialogMessage(responseData.message || "Failed to add users.");
      }
    } catch (error) {
      console.error("API call failed:", error);
      setDialogMessage("Failed to add users. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col w-full bg-bg-page px-20 items-start p-4">
      <div className="w-full rounded-md bg-bg-card p-5">
        <h1 className="text-2xl w-full text-center font-bold mb-6 font-raleway">
          Add New User(s) to the System
        </h1>
        <div className="w-full flex items-center gap-4 mb-2">
          <p className="text-text-primary text-sm mb-0">User Type</p>
          <select
            className="user-type-select"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="hod">Hod</option>
            <option value="cse-office">CSE Office</option>
          </select>
        </div>

        <div className="flex flex-row items-start gap-x-8 w-full">
          <div className="flex flex-[3] mt-4">
            <TabGroup className={"w-full"}>
              <TabList className="ml-1">
                <Tab className="data-[selected]:bg-primary-light data-[selected]:text-text-inverted data-[selected]:z-10 data-[selected]:scale-105 new-module-tab">
                  One by One
                </Tab>
                <Tab className="data-[selected]:bg-primary-light data-[selected]:text-text-inverted data-[selected]:z-10 data-[selected]:scale-105 new-module-tab">
                  Import
                </Tab>
              </TabList>
              <TabPanels className="outline outline-1 outline-text-secondary/50 rounded-sm p-4">
                <TabPanel className={"flex flex-col items-center"}>
                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col items-center max-w-3xl bg-bg-card p-6"
                  >
                    <h2 className="text-xl mb-8 font-light text-center">
                      Add New{" "}
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}(s)
                    </h2>

                    {/* Dynamic Input Units */}
                    <div className="w-full flex flex-col gap-5 mb-6">
                      {users.map((user, index) => (
                        <div
                          key={index}
                          className="hover:shadow-lg flex items-center p-2 outline outline-solid outline-1 rounded-md outline-text-secondary/30 gap-4"
                        >
                          {(userRole == "undergraduate" ||
                            userRole == "postgraduate") && (
                            <input
                              type="text"
                              name="indexNumber"
                              placeholder="Index Number"
                              value={user.indexNumber}
                              onChange={(e) => handleUserChange(index, e)}
                              required
                              className="flex-1 w-100 p-2 outline outline-1 border-text-secondary/0 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                            />
                          )}
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={user.email}
                            onChange={(e) => handleUserChange(index, e)}
                            required
                            className="w-300 flex-1 p-2 outline outline-1 border-text-secondary/50 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                          />
                          {users.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(index)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full"
                              aria-label="Remove user"
                            >
                              <FaMinus className="size-6 rounded-full p-1 hover:bg-warning/20" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <AiOutlinePlusCircle
                      className="align-middle size-8 text-primary-light rounded-full p-1  hover:text-primary hover:bg-primary-light/10 cursor-pointer mb-8"
                      onClick={handleAddUser}
                    />

                    <div className="mt-4 w-full">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? <div className="spinner"></div> : "Add"}
                      </button>
                    </div>
                  </form>

                  {/* Headless UI Dialog for Alerts */}
                  <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    className="relative z-50"
                  >
                    <div
                      className="fixed inset-0 bg-black/30"
                      aria-hidden="true"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                      <DialogPanel className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
                        <DialogTitle className="text-lg font-bold">
                          Status
                        </DialogTitle>
                        <p className="mt-2 text-sm">{dialogMessage}</p>
                        <button
                          onClick={() => setIsDialogOpen(false)}
                          className="mt-4 w-full p-2 bg-blue-500 text-white rounded-md"
                        >
                          OK
                        </button>
                      </DialogPanel>
                    </div>
                  </Dialog>
                </TabPanel>
                <TabPanel>Content 2</TabPanel>
              </TabPanels>
            </TabGroup>
          </div>

          <div className="flex flex-[2] flex-col p-2 rounded-md outline outline-1 outline-text-secondary/80 shadow-lg bg-bg-card">
            <p className="text-md text-text-primary font-montserrat w-full">
              Add users to a group
            </p>
            <p className="w-full text-sm text-text-secondary font-semibold text-wrap mb-5 text-justify mt-1">
              You can manage users easily and more efficiently by adding them to
              user groups. If you don't specify a user group, the user will be
              added to the default group named "Ungrouped".
            </p>

            <div className="rounded-sm outline outline-1 outline-text-primary/80 flex flex-col items-center w-full bg-bg-page">
              <div className="p-2 w-full flex">
                <input
                  type="text"
                  placeholder="Search user groups..."
                  className="w-full mb-3 p-2 border border-text-primary/40 rounded-md focus:outline-primary-light focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* User group list will go here */}
              <div className="w-full p-2 overflow-y-auto max-h-[40vh] gap-y-2">
                <RadioGroup
                  value={selectedUserGroup}
                  onChange={setSelectedUserGroup}
                  aria-label="Server size"
                  className="space-y-2"
                >
                  {userGroups.map((group) => (
                    <Radio
                      key={group.id}
                      value={group}
                      className="group relative flex cursor-pointer rounded-lg bg-bg-card/80 px-5 py-2 text-primary/90 shadow-sm hover:shadow-md transition outline-1 outline-text-secondary/70"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="text-sm/6">
                          <p className="font-semibold text-text-primary">
                            {group.name}
                          </p>
                          <span className="text-text-secondary/80">
                            {group.userCount} users
                          </span>
                        </div>
                        <FaCircleCheck className="size-6 fill-primary/90 opacity-0 transition group-data-[checked]:opacity-100" />
                      </div>
                    </Radio>
                  ))}
                </RadioGroup>
              </div>

              <div className="w-full m-0 border bg-bg-card p-2 border-t-1 border-t-text-secondary/80 flex justify-between">
                <div className="flex flex-col items-start justify-end">
                  {selectedUserGroup && (
                    <p className="text-sm text-text-secondary">
                      Selected:{" "}
                      <span className="font-semibold text-text-primary/80">
                        {selectedUserGroup.name}
                      </span>
                    </p>
                  )}
                  <p className="text-sm text-text-secondary">
                    {userGroups.length} user groups found
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-2 px-3 py-2 bg-primary text-sm text-white rounded-md font-semibold hover:bg-primary-light transition-colors"
                  onClick={() => setIsGroupModalOpen(true)}
                >
                  Create New User Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New User Group Modal */}
              <Dialog
                open={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                className="relative z-50"
              >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                  <DialogPanel className="w-full max-w-md rounded bg-white p-6 shadow-lg relative">
                    <button
                      type="button"
                      className="absolute top-3 right-3 text-text-secondary hover:text-text-primary text-xl"
                      onClick={() => setIsGroupModalOpen(false)}
                      disabled={isCreatingGroup}
                      aria-label="Close"
                    >
                      <AiOutlineCloseCircle className="size-6"/>
                    </button>
                    <DialogTitle className="text-lg font-bold mb-2">
                      Create New User Group
                    </DialogTitle>
                    <form
                      onSubmit={handleCreateGroup}
                      className="flex flex-col gap-4"
                    >
                      <input
                        type="text"
                        placeholder="Group Name"
                        className="p-2 border border-text-primary/40 rounded-md focus:outline-primary-light focus:border-primary transition-colors"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        required
                        disabled={isCreatingGroup}
                      />
                      {groupError && (
                        <p className="text-warning text-sm">{groupError}</p>
                      )}
                      <button
                        type="submit"
                        className="bg-primary text-text-inverted font-semibold rounded-md p-2 hover:bg-primary-light transition-colors disabled:bg-primary/40"
                        disabled={isCreatingGroup || !newGroupName.trim()}
                      >
                        {isCreatingGroup ? "Creating..." : "Create Group"}
                      </button>
                    </form>
                  </DialogPanel>
                </div>
              </Dialog>
    </div>
  );
}

export default AddUser;
