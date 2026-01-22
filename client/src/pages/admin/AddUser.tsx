import "./AddUser.css";

import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { FaUpload, FaMinus } from "react-icons/fa";
import { AiOutlinePlusCircle } from "react-icons/ai";
import Papa from "papaparse";
import {
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
import axiosInstance from "../../api/axiosConfig";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalProvider";
import Loader from "../../components/common/Loader";

interface User {
  email: string;
  indexNumber?: string;
  displayName?: string;
}

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

function AddUser() {
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();
  
  // ...existing code...
  const [inputErrors, setInputErrors] = useState<
    { email?: string; indexNumber?: string; displayName?: string }[]
  >([]);
  const [userRole, setUserRole] = useState("undergraduate");
  const [users, setUsers] = useState<User[]>([{ email: "", indexNumber: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State variables regarding User Groups
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserGroups, setAllUserGroups] = useState<UserGroup[]>([]);
  const userGroups = allUserGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // New User Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [importedUsers, setImportedUsers] = useState<User[]>([]);
  const [showImportedUsers, setShowImportedUsers] = useState(false);
  const [importInputErrors, setImportInputErrors] = useState<
    { email?: string; indexNumber?: string; displayName?: string }[]
  >([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const selectedFile = files && files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(`Selected file: ${selectedFile.name}`);
      setShowImportedUsers(false);
      setImportedUsers([]);
    } else {
      setFile(null);
      setMessage("No file selected.");
    }
  };

  const handleUpload = () => {
    if (!file) {
      showToast("Please select a file first.", "error");
      return;
    }

    setIsLoading(true);

    Papa.parse(file, {
      header: hasHeaders,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data as any[];
          console.log("Parsed data:", parsedData);

          if (parsedData.length === 0) {
            showToast("The CSV file is empty.", "error");
            setIsLoading(false);
            return;
          }

          const processedUsers: User[] = [];
          const errors: string[] = [];

          parsedData.forEach((row, index) => {
            const rowNumber = hasHeaders ? index + 2 : index + 1; // +2 for header row, +1 for 0-index
            
            try {
              if (userRole === "undergraduate" || userRole === "postgraduate") {
                // Expected columns: indexNumber, email
                const indexNumber = hasHeaders 
                  ? (row.indexNumber || row.IndexNumber || row.index_number || "").trim()
                  : (row[0] || "").trim();
                const email = hasHeaders 
                  ? (row.email || row.Email || "").trim()
                  : (row[1] || "").trim();

                if (!indexNumber && !email) {
                  return; // Skip empty rows
                }

                if (!indexNumber || !email) {
                  errors.push(`Row ${rowNumber}: Missing ${!indexNumber ? "indexNumber" : "email"}`);
                  return;
                }

                processedUsers.push({ indexNumber, email });
              } else if (userRole === "lecturer" || userRole === "hod") {
                // Expected columns: displayName, email
                const displayName = hasHeaders 
                  ? (row.displayName || row.DisplayName || row.display_name || row.name || row.Name || "").trim()
                  : (row[0] || "").trim();
                const email = hasHeaders 
                  ? (row.email || row.Email || "").trim()
                  : (row[1] || "").trim();

                if (!displayName && !email) {
                  return; // Skip empty rows
                }

                if (!displayName || !email) {
                  errors.push(`Row ${rowNumber}: Missing ${!displayName ? "displayName" : "email"}`);
                  return;
                }

                processedUsers.push({ displayName, email });
              } else {
                // For admin, cse-office: only email
                const email = hasHeaders 
                  ? (row.email || row.Email || "").trim()
                  : (row[0] || "").trim();

                if (!email) {
                  return; // Skip empty rows
                }

                processedUsers.push({ email });
              }
            } catch (err) {
              errors.push(`Row ${rowNumber}: Error processing row`);
            }
          });

          if (errors.length > 0) {
            const errorMessage = errors.slice(0, 5).join("\n") + 
              (errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : "");
            openModal(
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-error">CSV Processing Errors</h3>
                <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-3 rounded max-h-60 overflow-auto">
                  {errorMessage}
                </pre>
                <p className="mt-3 text-sm text-text-secondary">
                  Successfully processed {processedUsers.length} users. Please fix the errors and try again.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
                >
                  OK
                </button>
              </div>
            );
          }

          if (processedUsers.length === 0) {
            showToast("No valid users found in the CSV file.", "error");
            setIsLoading(false);
            return;
          }

          setImportedUsers(processedUsers);
          setImportInputErrors(processedUsers.map(() => ({})));
          setShowImportedUsers(true);
          showToast(`Successfully processed ${processedUsers.length} users from CSV.`, "success");
          setMessage(`${processedUsers.length} users ready for import`);
        } catch (error: any) {
          showToast(`Error processing CSV: ${error.message}`, "error");
          console.error("Error processing CSV:", error);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setIsLoading(false);
        showToast(`Error parsing file: ${error.message}`, "error");
        console.error("Error parsing CSV:", error);
      },
    });
  };

  const handleImportedUserChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    const newUsers = [...importedUsers];
    newUsers[index] = { ...newUsers[index], [name]: value };
    setImportedUsers(newUsers);
  };

  const handleRemoveImportedUser = (index: number) => {
    const newUsers = importedUsers.filter((_, i) => i !== index);
    setImportedUsers(newUsers);
    const newErrors = importInputErrors.filter((_, i) => i !== index);
    setImportInputErrors(newErrors);
  };

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (importedUsers.length === 0) {
      showToast("No users to import.", "error");
      return;
    }

    // Validate all users and collect errors
    const errors: {
      email?: string;
      indexNumber?: string;
      displayName?: string;
    }[] = importedUsers.map(() => ({}));
    let hasError = false;
    
    for (let i = 0; i < importedUsers.length; i++) {
      const user = importedUsers[i];
      if (user.email === "") {
        errors[i].email = "Email is required.";
        hasError = true;
      } else if (!validateEmail(user.email)) {
        errors[i].email = "Invalid email address.";
        hasError = true;
      }
      if (userRole === "undergraduate" || userRole === "postgraduate") {
        if (!user.indexNumber || !validateIndexNumber(user.indexNumber)) {
          errors[i].indexNumber = "Invalid index number.";
          hasError = true;
        }
      }
      if (userRole === "lecturer" || userRole === "hod") {
        if (!user.displayName || user.displayName.trim() === "") {
          errors[i].displayName = "Display Name is required.";
          hasError = true;
        } else if (!validateDisplayName(user.displayName)) {
          errors[i].displayName = "Display Name must be at least 2 characters.";
          hasError = true;
        }
      }
    }
    
    setImportInputErrors(errors);
    if (hasError) {
      showToast("Please fix validation errors before submitting.", "error");
      return;
    }

    setIsLoading(true);
    
    // Prepare the JSON object to send to the backend
    const payload = {
      users: importedUsers,
      userRole: userRole,
      groupId: selectedUserGroup ? selectedUserGroup._id : "",
    };

    console.log("Sending imported users payload to backend:", payload);

    try {
      const response = await axiosInstance.post(
        "/user-management/users",
        payload
      );

      const responseData = response.data;
      if (response.status === 201) {
        showToast(responseData.message || "Users imported successfully!", "success");
        // Reset the import state
        setImportedUsers([]);
        setImportInputErrors([]);
        setShowImportedUsers(false);
        setFile(null);
        setMessage("");
        setSelectedUserGroup(null);
        fetchUserGroups();
      } else {
        showToast(responseData.message || "Failed to import users.", "error");
      }
    } catch (error: any) {
      console.error("API call failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to import users. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user groups
  const fetchUserGroups = async () => {
    console.log("Fetching user groups for role:", userRole);
    try {
      const res = await axiosInstance.get(
        "/user-management/groups/" + userRole
      );
      setAllUserGroups(res.data);
      console.log("Fetched user groups:", res.data);
    } catch (error) {
      console.error("Failed to fetch user groups:", error);
      setAllUserGroups([]);
    }
  };

  // Create group handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingGroup(true);
    setGroupError("");
    try {
      const res = await axiosInstance.post("/user-management/groups", {
        name: newGroupName,
        groupType: userRole,
      });

      if (res.status === 201) {
        setIsGroupModalOpen(false);
        setNewGroupName("");
        await fetchUserGroups();
      }
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
    const newUser: User = { email: "" };
    
    // Add appropriate fields based on user role
    if (userRole === "undergraduate" || userRole === "postgraduate") {
      newUser.indexNumber = "";
    } else if (userRole === "lecturer" || userRole === "hod") {
      newUser.displayName = "";
    }
    
    setUsers([...users, newUser]);
  };

  const handleRemoveUser = (index: number) => {
    if (users.length > 1) {
      const newUsers = users.filter((_, i) => i !== index);
      setUsers(newUsers);
    }
  };

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const validateIndexNumber = (indexNumber: string) => {
    // Example: must be alphanumeric and 4-12 chars (customize as needed)
    return /^[a-zA-Z0-9]{4,12}$/.test(indexNumber);
  };

  const validateDisplayName = (displayName: string) => {
    return displayName && displayName.trim().length >= 2;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate all users and collect errors
    const errors: {
      email?: string;
      indexNumber?: string;
      displayName?: string;
    }[] = users.map(() => ({}));
    let hasError = false;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.email === "") {
        errors[i].email = "Email is required.";
        hasError = true;
      } else if (!validateEmail(user.email)) {
        errors[i].email = "Invalid email address.";
        hasError = true;
      }
      if (userRole === "undergraduate" || userRole === "postgraduate") {
        if (!user.indexNumber || !validateIndexNumber(user.indexNumber)) {
          errors[i].indexNumber = "Invalid index number.";
          hasError = true;
        }
      }
      if (userRole === "lecturer" || userRole === "hod") {
        if (!user.displayName || user.displayName.trim() === "") {
          errors[i].displayName = "Display Name is required.";
          hasError = true;
        } else if (!validateDisplayName(user.displayName)) {
          errors[i].displayName = "Display Name must be at least 2 characters.";
          hasError = true;
        }
      }
    }
    setInputErrors(errors);
    if (hasError) {
      return;
    }

    setIsLoading(true);
    // Prepare the JSON object to send to the backend
    const payload = {
      users: users,
      userRole: userRole,
      groupId: selectedUserGroup ? selectedUserGroup._id : "",
    };

    console.log("Sending payload to backend:", payload);
    console.log("User role:", userRole);
    console.log("Users being sent:", users);

    try {
      const response = await axiosInstance.post(
        "/user-management/users",
        payload
      );

      const responseData = response.data;
      if (response.status === 201) {
        setDialogMessage(responseData.message);
        setUsers([{ email: "" }]);
        setInputErrors([]);
        setSelectedUserGroup(null);
        fetchUserGroups();
      } else {
        setDialogMessage(responseData.message || "Failed to add users.");
      }
    } catch (error: any) {
      console.error("API call failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add users. Please try again.";
      setDialogMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(true);
    }
  };

  const location = useLocation();
  const state = location.state as
    | { groupId?: string; role?: string }
    | undefined;

  useEffect(() => {
    fetchUserGroups();
  }, [userRole]);

  useEffect(() => {
    if (state && state.groupId && state.role) {
      setUserRole(state.role);
    }
  }, [state]);

  return (
    <div className="flex flex-col w-full bg-bg-page px-20 items-start p-4">
      <div className="w-full rounded-md bg-bg-card p-5">
        <h1 className="text-2xl w-full text-center font-bold mb-6">
          Add New User(s) to the System
        </h1>
        <div className="w-full flex items-center gap-4 mb-2">
          <p className="text-text-primary text-sm mb-0">User Type</p>
          <select
            className="user-type-select"
            value={userRole}
            onChange={(e) => {
              const newRole = e.target.value;
              setUserRole(newRole);
              
              // Reset users array with appropriate fields for new role
              const newUser: User = { email: "" };
              if (newRole === "undergraduate" || newRole === "postgraduate") {
                newUser.indexNumber = "";
              } else if (newRole === "lecturer" || newRole === "hod") {
                newUser.displayName = "";
              }
              setUsers([newUser]);
              setInputErrors([]);
              setSelectedUserGroup(null);
              
              // Reset import state
              setImportedUsers([]);
              setImportInputErrors([]);
              setShowImportedUsers(false);
              setFile(null);
              setMessage("");
            }}
          >
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="hod">Head of Department</option>
            <option value="cse-office">CSE Office Staff</option>
          </select>
        </div>

        <div className="flex flex-row items-start gap-x-8 w-full">
          <div className="flex flex-[3] mt-4">
            <TabGroup className={"w-full"}>
              <TabList className="flex border-b border-text-secondary">
                <Tab className="data-[selected]:border-b-2 data-[selected]:bg-primary-light/50 data-[selected]:text-text-primary data-[selected]:font-semibold data-[selected]:z-10 new-module-tab border-primary-light">
                  One by One
                </Tab>
                <Tab className="data-[selected]:border-b-2 data-[selected]:bg-primary-light/60  data-[selected]:text-text-primary data-[selected]:font-semibold data-[selected]:z-10 new-module-tab border-primary-light">
                  Import
                </Tab>
              </TabList>
              <TabPanels className="outline outline-1 outline-text-secondary/50 rounded-sm p-4">
                <TabPanel className={"flex flex-col items-center"}>
                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col items-center max-w-3xl bg-bg-card p-6"
                  >
                    <h2 className="text-xl mb-4 font-light text-center">
                      Add New{" "}
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}(s)
                    </h2>
                    
                    {/* Field Requirements Info */}
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                      <p className="font-medium mb-1">Required fields for {userRole}s:</p>
                      <ul className="list-disc list-inside">
                        <li>Email address</li>
                        {(userRole === "undergraduate" || userRole === "postgraduate") && (
                          <li>Index Number (4-12 alphanumeric characters)</li>
                        )}
                        {(userRole === "lecturer" || userRole === "hod") && (
                          <li>Display Name (minimum 2 characters)</li>
                        )}
                      </ul>
                    </div>

                    {/* Dynamic Input Units */}
                    <div className="w-full flex flex-col gap-5 mb-6">
                      {users.map((user, index) => (
                        <div
                          key={index}
                          className="hover:shadow-lg flex flex-col gap-1 p-2 outline outline-solid outline-1 rounded-md outline-text-secondary/30"
                        >
                          <div className="flex items-center gap-4">
                            {(userRole == "undergraduate" ||
                              userRole == "postgraduate") && (
                              <div className="flex-1 flex flex-col">
                                <input
                                  type="text"
                                  name="indexNumber"
                                  placeholder="e.g., 220001A"
                                  value={user.indexNumber}
                                  onChange={(e) => handleUserChange(index, e)}
                                  // required
                                  className="w-full p-2 outline outline-1 border-text-secondary/0 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                                />
                                {inputErrors[index]?.indexNumber && (
                                  <span className="text-error text-xs mt-1">
                                    {inputErrors[index].indexNumber}
                                  </span>
                                )}
                              </div>
                            )}
                            {(userRole === "lecturer" ||
                              userRole === "hod") && (
                              <div className="flex-1 flex flex-col">
                                <input
                                  type="text"
                                  name="displayName"
                                  placeholder="e.g., Dr. John Smith, Prof. Jane Doe"
                                  value={user.displayName}
                                  onChange={(e) => handleUserChange(index, e)}
                                  // required
                                  className="w-full p-2 outline outline-1 border-text-secondary/0 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                                />
                                {inputErrors[index]?.displayName && (
                                  <span className="text-error text-xs mt-1">
                                    {inputErrors[index].displayName}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex-1 flex flex-col">
                              <input
                                type="email"
                                name="email"
                                placeholder="user@cse.mrt.ac.lk"
                                value={user.email}
                                onChange={(e) => handleUserChange(index, e)}
                                // required
                                className="w-full p-2 outline outline-1 border-text-secondary/50 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                              />
                              {inputErrors[index]?.email && (
                                <span className="text-error text-xs mt-1">
                                  {inputErrors[index].email}
                                </span>
                              )}
                            </div>
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
                <TabPanel>
                  <div className="flex flex-col p-6 bg-white rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">
                      Import Users via CSV file
                    </h3>

                    {/* CSV Format Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      <h4 className="font-semibold text-blue-900 mb-2">CSV File Format Instructions</h4>
                      <p className="text-blue-800 mb-2">
                        Your CSV file should contain the following columns in this exact order:
                      </p>
                      <ul className="list-disc list-inside text-blue-800 space-y-1 mb-3">
                        {(userRole === "undergraduate" || userRole === "postgraduate") && (
                          <>
                            <li><strong>Column 1:</strong> indexNumber (e.g., 220001A, 210123B)</li>
                            <li><strong>Column 2:</strong> email (e.g., student@cse.mrt.ac.lk)</li>
                          </>
                        )}
                        {(userRole === "lecturer" || userRole === "hod") && (
                          <>
                            <li><strong>Column 1:</strong> displayName (e.g., Dr. John Smith, Prof. Jane Doe)</li>
                            <li><strong>Column 2:</strong> email (e.g., lecturer@cse.mrt.ac.lk)</li>
                          </>
                        )}
                        {(userRole === "admin" || userRole === "cse-office") && (
                          <>
                            <li><strong>Column 1:</strong> email (e.g., admin@cse.mrt.ac.lk)</li>
                          </>
                        )}
                      </ul>
                      <div className="bg-white p-2 rounded border border-blue-300 mt-2">
                        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                          {(userRole === "undergraduate" || userRole === "postgraduate") && 
                            "indexNumber,email\n220001A,student1@cse.mrt.ac.lk\n220002B,student2@cse.mrt.ac.lk"
                          }
                          {(userRole === "lecturer" || userRole === "hod") && 
                            "displayName,email\nDr. John Smith,john@cse.mrt.ac.lk\nProf. Jane Doe,jane@cse.mrt.ac.lk"
                          }
                          {(userRole === "admin" || userRole === "cse-office") && 
                            "email\nadmin1@cse.mrt.ac.lk\nadmin2@cse.mrt.ac.lk"
                          }
                        </pre>
                      </div>
                    </div>

                    {!showImportedUsers ? (
                      <>
                        {/* File Selection and Header Checkbox */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center px-4 py-2 bg-primary text-text-inverted rounded-md cursor-pointer hover:bg-primary-light transition-colors">
                              <FaUpload className="mr-2" />
                              Select CSV File
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="hasHeaders"
                                checked={hasHeaders}
                                onChange={(e) => setHasHeaders(e.target.checked)}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <label htmlFor="hasHeaders" className="text-sm text-text-primary cursor-pointer">
                                CSV file has headers
                              </label>
                            </div>
                          </div>
                          {message && (
                            <p className="text-sm text-text-secondary mt-2">{message}</p>
                          )}
                        </div>

                        <button
                          onClick={handleUpload}
                          disabled={!file || isLoading}
                          className="w-full max-w-xs mx-auto p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isLoading ? (
                            <div className="spinner"></div>
                          ) : (
                            "Process CSV"
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Show Imported Users for Review */}
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>{importedUsers.length}</strong> users loaded from CSV. 
                            Review and edit them below before creating the users.
                          </p>
                        </div>

                        <form onSubmit={handleImportSubmit} className="w-full flex flex-col">
                          {/* Dynamic Input Units - Same as One by One */}
                          <div className="w-full flex flex-col gap-5 mb-6 max-h-[50vh] overflow-y-auto p-2">
                            {importedUsers.map((user, index) => (
                              <div
                                key={index}
                                className="hover:shadow-lg flex flex-col gap-1 p-2 outline outline-solid outline-1 rounded-md outline-text-secondary/30"
                              >
                                <div className="flex items-center gap-4">
                                  {(userRole === "undergraduate" ||
                                    userRole === "postgraduate") && (
                                    <div className="flex-1 flex flex-col">
                                      <input
                                        type="text"
                                        name="indexNumber"
                                        placeholder="e.g., 220001A"
                                        value={user.indexNumber}
                                        onChange={(e) => handleImportedUserChange(index, e)}
                                        className="w-full p-2 outline outline-1 border-text-secondary/0 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                                      />
                                      {importInputErrors[index]?.indexNumber && (
                                        <span className="text-error text-xs mt-1">
                                          {importInputErrors[index].indexNumber}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {(userRole === "lecturer" ||
                                    userRole === "hod") && (
                                    <div className="flex-1 flex flex-col">
                                      <input
                                        type="text"
                                        name="displayName"
                                        placeholder="e.g., Dr. John Smith, Prof. Jane Doe"
                                        value={user.displayName}
                                        onChange={(e) => handleImportedUserChange(index, e)}
                                        className="w-full p-2 outline outline-1 border-text-secondary/0 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                                      />
                                      {importInputErrors[index]?.displayName && (
                                        <span className="text-error text-xs mt-1">
                                          {importInputErrors[index].displayName}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex-1 flex flex-col">
                                    <input
                                      type="email"
                                      name="email"
                                      placeholder="user@cse.mrt.ac.lk"
                                      value={user.email}
                                      onChange={(e) => handleImportedUserChange(index, e)}
                                      className="w-full p-2 outline outline-1 border-text-secondary/50 rounded-md focus:outline-primary-light focus:outline-offset-1 focus:outline-2 transition-colors"
                                    />
                                    {importInputErrors[index]?.email && (
                                      <span className="text-error text-xs mt-1">
                                        {importInputErrors[index].email}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImportedUser(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full"
                                    aria-label="Remove user"
                                  >
                                    <FaMinus className="size-6 rounded-full p-1 hover:bg-warning/20" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowImportedUsers(false);
                                setImportedUsers([]);
                                setImportInputErrors([]);
                                setFile(null);
                                setMessage("");
                              }}
                              className="flex-1 p-3 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading || importedUsers.length === 0}
                              className="flex-1 p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {isLoading ? (
                                <Loader />
                              ) : (
                                `Create ${importedUsers.length} User${importedUsers.length !== 1 ? 's' : ''}`
                              )}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </TabPanel>
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
                      key={group._id}
                      value={group}
                      className="group relative flex cursor-pointer data-[checked]:bg-primary/20 rounded-lg bg-bg-card/80 px-5 py-2 text-primary/90 shadow-sm hover:shadow-md transition outline-1 outline-text-secondary/70"
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
              <AiOutlineCloseCircle className="size-6" />
            </button>
            <DialogTitle className="text-lg font-bold mb-2">
              Create New User Group
            </DialogTitle>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
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
