import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus, FaMinus } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { MdClose, MdOutlineErrorOutline } from "react-icons/md";
import {
  Field,
  Label,
  Switch,
  Checkbox,
  Button,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import AutoSelect, { type Option } from "../../components/common/AutoSelect";
// import { HiOutlineLink } from "react-icons/hi";

import { useToast } from "../../contexts/ToastContext";
import axiosInstance from "../../api/axiosConfig";

import "./NewModule.css";

interface FormData {
  moduleCode: string;
  moduleName: string;
  semester: Option | null;
  coordinators: Option[];
  undergraduateTAsRequired: number;
  postgraduateTAsRequired: number;
  taHours: number;
  appDueDate: string;
  docDueDate: string;
  specialNotes: string;
  openForUndergrads: boolean;
  openForPostgrads: boolean;
}

//Good to use as an utility function,also in RecruitmentCard.tsx
function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const NewModule: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    moduleCode: "",
    moduleName: "",
    semester: null,
    coordinators: [],
    undergraduateTAsRequired: 0,
    postgraduateTAsRequired: 0,
    taHours: 0,
    appDueDate: "",
    docDueDate: "",
    specialNotes: "",
    openForUndergrads: false,
    openForPostgrads: false,
  });
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});

  // const [lecturers, setLecturers] = useState<Option[]>([]);
  const [availableLecturers, setAvailableLecturers] = useState<Option[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    id: string;
    name: string;
    appDueDate: string;
    docDueDate: string;
  } | null;
  const { showToast } = useToast();

  const fetchLecturers = async () => {
    try {
      const response = await axiosInstance.get("/user-management/lecturers");
      const data = response.data;
      setAvailableLecturers(
        data.map((lecturer: any) => ({
          id: lecturer._id,
          label: lecturer.displayName,
          subtitle: lecturer.email,
          picture: lecturer.profilePicture,
        }))
      );

      console.log("Fetched lecturers:", data);
    } catch (error) {
      console.error("Error fetching lecturers:", error);
      return [];
    }
  };

  const postFormData = async () => {
    try {
      if (!state || !state.id) {
        showToast(
          "Recruitment Round ID is missing. Please go to the previous page and come again",
          "error"
        );
        return;
      }
      const payload = {
        moduleCode: formData.moduleCode,
        moduleName: formData.moduleName,
        semester: formData.semester?.id,
        coordinators: formData.coordinators.map((coord) => coord.id),
        applicationDueDate: formData.appDueDate,
        documentDueDate: formData.docDueDate,
        requiredTAHours: formData.taHours,
        requiredUndergraduateTACount: formData.undergraduateTAsRequired,
        requiredPostgraduateTACount: formData.postgraduateTAsRequired,
        requirements: formData.specialNotes,
      };
      console.log("Posting payload:", payload);
      const response = await axiosInstance.post(
        "/recruitment-series/" + state.id + "/add-module",
        payload
      );
      showToast(
        "Module added successfully to the recruitment Round!",
        "success"
      );
      setFormData({
        moduleCode: "",
        moduleName: "",
        semester: null,
        coordinators: [],
        undergraduateTAsRequired: 0,
        postgraduateTAsRequired: 0,
        taHours: 0,
        appDueDate: toLocalDatetimeInputValue(new Date(state.appDueDate)),
        docDueDate: toLocalDatetimeInputValue(new Date(state.docDueDate)),
        specialNotes: "",
        openForUndergrads: false,
        openForPostgrads: false,
      });
      fetchLecturers();
    } catch (error) {
      console.error("Error creating module:", error);
      showToast("Failed to create module.", "error");
    }
  };

  // Validation functions
  const validateField = (name: string, value: any) => {
    switch (name) {
      case "moduleCode":
        if (!value) return "Module code is required.";
        // if (!/^([A-Za-z]{2,4}\d{3,4})$/.test(value))
        //   return "Invalid module code format.";
        return "";
      case "moduleName":
        if (!value) return "Module name is required.";
        return "";
      case "taHours":
        if (value <= 0) return "TA hours should be greater than 0.";
        return "";
      case "undergraduateTAsRequired":
        if (
          value <= 0 &&
          (!formData.postgraduateTAsRequired ||
            formData.postgraduateTAsRequired <= 0)
        ) {
          return "At least one TA (undergraduate or postgraduate) is required.";
        }
        return "";
      case "postgraduateTAsRequired":
        if (
          value <= 0 &&
          (!formData.undergraduateTAsRequired ||
            formData.undergraduateTAsRequired <= 0)
        ) {
          return "At least one TA (undergraduate or postgraduate) is required.";
        }
        return "";
      case "appDueDate":
        if (!value) return "Application due date is required.";
        // If docDueDate is set, check order
        if (
          formData.docDueDate &&
          value &&
          new Date(formData.docDueDate) < new Date(value)
        ) {
          return "Application due date must be on or before document submission deadline.";
        }
        return "";
      case "docDueDate":
        if (!value) return "Document submission deadline is required.";
        if (
          formData.appDueDate &&
          value &&
          new Date(value) < new Date(formData.appDueDate)
        ) {
          return "Document submission deadline must be on or after application due date.";
        }
        return "";
      default:
        return "";
    }
  };

  const validateSemester = (semester: Option | null) => {
    if (!semester) {
      setInputErrors((prev) => ({
        ...prev,
        semester: "Semester is required.",
      }));
    } else {
      setInputErrors((prev) => ({ ...prev, semester: "" }));
    }
  };

  const validateCoordinators = (coordinators: Option[]) => {
    if (coordinators.length === 0) {
      setInputErrors((prev) => ({
        ...prev,
        coordinators: "At least one coordinator is required.",
      }));
    } else {
      setInputErrors((prev) => ({ ...prev, coordinators: "" }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    }
    if (
      name === "undergraduateTAsRequired" ||
      name === "postgraduateTAsRequired" ||
      name === "taHours" ||
      name === "semester"
    ) {
      newValue = Number(newValue);
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    // Validate on change
    if (
      name === "undergraduateTAsRequired" ||
      name === "postgraduateTAsRequired"
    ) {
      setInputErrors((prev) => ({
        ...prev,
        tasRequired: validateField(name, Number(newValue)),
      }));
    } else {
      setInputErrors((prev) => ({
        ...prev,
        [name]: validateField(name, newValue),
      }));
    }
  };

  const handleCoordinatorChange = (value: Option | null) => {
    if (value) validateCoordinators(formData.coordinators.concat(value));
    setFormData((prevData) => ({
      ...prevData,
      coordinators: value
        ? [...prevData.coordinators, value]
        : [...prevData.coordinators],
    }));
    setAvailableLecturers((prev) =>
      prev.filter((lecturer) => lecturer.id !== value?.id)
    );
  };

  const handleSemesterChange = (option: Option | null) => {
    setFormData((prevData) => ({
      ...prevData,
      semester: option,
    }));
    validateSemester(option);
  };

  const removeCoordinator = (lecturer: Option) => {
    const newCoordinators = formData.coordinators?.filter(
      (coord) => coord.id !== lecturer.id
    );
    validateCoordinators(newCoordinators || []);
    setFormData((prevData) => ({
      ...prevData,
      coordinators: newCoordinators || [],
    }));
    setAvailableLecturers((prev) => [...prev, lecturer]);
  };

  const isFormValid = () => {
    return (
      formData.moduleCode &&
      !inputErrors.moduleCode &&
      formData.moduleName &&
      !inputErrors.moduleName &&
      formData.semester &&
      formData.coordinators.length &&
      !inputErrors.tasRequired &&
      !inputErrors.taHours &&
      formData.appDueDate &&
      !inputErrors.appDueDate &&
      formData.docDueDate &&
      !inputErrors.docDueDate
    );
  };

  const validateForm = () => {
    Object.keys(formData).forEach((key) => {
      if (
        key === "undergraduateTAsRequired" ||
        key === "postgraduateTAsRequired"
      ) {
        setInputErrors((prev) => ({
          ...prev,
          tasRequired: validateField(
            key as keyof FormData,
            formData[key as keyof FormData]
          ),
        }));
      } else if (key === "semester") {
        validateSemester(formData.semester);
      } else if (key === "coordinators") {
        validateCoordinators(formData.coordinators);
      } else {
        setInputErrors((prev) => ({
          ...prev,
          [key]: validateField(
            key as keyof FormData,
            formData[key as keyof FormData]
          ),
        }));
      }
    });
  };

  const handleAddModule = () => {
    validateForm();
    if (isFormValid()) {
      postFormData();
    } else {
      showToast("Please fix the errors in the form.", "error");
    }
    console.log("Form is ready to send", formData);
  };

  const semesters: Option[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Semester ${i + 1}`,
  }));

  if (!state || !state.id || !state.name) {
    return (
      <div className="text-xl flex-col text-center w-full h-[80vh] flex items-center justify-center text-text-secondary">
        <MdOutlineErrorOutline className="inline-block size-60" />
        <p>
          Recruitment Round is not found. Please go back to the dashboard and
          try again.
        </p>
      </div>
    );
  }

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      appDueDate: toLocalDatetimeInputValue(new Date(state.appDueDate)),
      docDueDate: toLocalDatetimeInputValue(new Date(state.docDueDate)),
    }));
    fetchLecturers();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start p-4 min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20">
      <div className="rounded-lg w-full max-w-4xl bg-bg-card shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-base-content select-none">
          New Module for <br />
          {state.name}
        </h2>

        <div className="flex flex-col space-y-6">
          {/* Module Code */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Module Code</span>
            </label>
            <input
              type="text"
              name="moduleCode"
              placeholder="e.g. CS1011"
              value={formData.moduleCode}
              onChange={handleChange}
              maxLength={10}
              className="ml-8 new-module-input"
            />
            {inputErrors.moduleCode && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.moduleCode}
              </span>
            )}
          </div>

          {/* Module Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Module Name</span>
            </label>
            <input
              type="text"
              name="moduleName"
              placeholder="e.g. Program Construction"
              value={formData.moduleName}
              onChange={handleChange}
              className="ml-8 max-w-full w-96 new-module-input"
            />
            {inputErrors.moduleName && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.moduleName}
              </span>
            )}
          </div>

          {/* Semester */}
          <div className="form-control flex flex-row items-center">
            <label className="label">
              <span className="label-text">Semester</span>
            </label>
            <AutoSelect
              options={semesters}
              selectedOption={formData.semester}
              onSelect={handleSemesterChange}
              placeholder="Select Semester"
              className="ml-8"
            />
            {inputErrors.semester && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.semester}
              </span>
            )}
          </div>

          {/* Module Coordinator(s) */}
          <div className="form-control flex flex-col">
            <div className="flex flex-row items-center space-x-8 mb-5 mt-8">
              <label className="label">
                <span className="label-text">Module Coordinator(s)</span>
              </label>
              <AutoSelect
                options={availableLecturers}
                selectedOption={null}
                onSelect={handleCoordinatorChange}
                placeholder="Select Coordinator(s)"
                className="ml-8"
              />
            </div>
            <div className="flex flex-row flex-wrap ml-8 gap-x-3 gap-y-2 items-start mb-8">
              {formData.coordinators &&
                formData.coordinators.length > 0 &&
                formData.coordinators.map((coordinator) => (
                  <div
                    key={coordinator.id}
                    className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-full drop-shadow bg-bg-card flex items-center text-text-primary space-x-3"
                  >
                    {coordinator.picture && (
                      <img
                        src={coordinator.picture}
                        alt={coordinator.label.toString()}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <p className="text-text-primary text-sm font-semibold">
                        {coordinator.label}
                      </p>
                      {coordinator.subtitle && (
                        <p className="text-xs text-text-secondary">
                          {coordinator.subtitle}
                        </p>
                      )}
                    </div>
                    <MdClose
                      className="text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                      onClick={() => removeCoordinator(coordinator)}
                    />
                  </div>
                ))}
            </div>
            {inputErrors.coordinators && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.coordinators}
              </span>
            )}
          </div>

          {/* No. of TAs Required */}
          <div className="flex flex-col gap-y-6 w-full">
            <p className="label">Number of TAs required</p>
            <div className="flex ml-8 gap-x-24">
              {/* Undergraduate TAs */}
              <div className="form-control flex flex-col space-y-5">
                <label className="label">
                  <span className="label-text">Undergraduate TAs</span>
                </label>
                <div className="ml-8 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        undergraduateTAsRequired: Math.max(
                          0,
                          prev.undergraduateTAsRequired - 1
                        ),
                      }));
                      setInputErrors((prev) => ({
                        ...prev,
                        tasRequired: validateField(
                          "undergraduateTAsRequired",
                          formData.undergraduateTAsRequired - 1
                        ),
                      }));
                    }}
                    className="hover:text-primary-light hover:outline-primary-light hover:outline-2 focus:outline-2 focus:outline-primary-light focus:text-primary-light rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    name="undergraduateTAsRequired"
                    value={formData.undergraduateTAsRequired}
                    onChange={handleChange}
                    className="new-module-input text-center new-module-type-select"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        undergraduateTAsRequired:
                          prev.undergraduateTAsRequired + 1,
                      }));
                      setInputErrors((prev) => ({
                        ...prev,
                        tasRequired: validateField(
                          "undergraduateTAsRequired",
                          formData.undergraduateTAsRequired + 1
                        ),
                      }));
                    }}
                    className="hover:text-primary-light hover:outline-primary-light hover:outline-2 focus:outline-2 focus:outline-primary-light focus:text-primary-light rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Postgraduate TAS */}
              <div className="form-control flex flex-col space-y-5">
                <label className="label">
                  <span className="label-text">Postgraduate TAs</span>
                </label>
                <div className="ml-8 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        postgraduateTAsRequired: Math.max(
                          0,
                          prev.postgraduateTAsRequired - 1
                        ),
                      }));
                      setInputErrors((prev) => ({
                        ...prev,
                        tasRequired: validateField(
                          "postgraduateTAsRequired",
                          formData.postgraduateTAsRequired - 1
                        ),
                      }));
                    }}
                    className="hover:text-primary-light hover:outline-primary-light hover:outline-2 focus:outline-2 focus:outline-primary-light focus:text-primary-light rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    name="postgraduateTAsRequired"
                    value={formData.postgraduateTAsRequired}
                    onChange={handleChange}
                    className="new-module-input text-center new-module-type-select"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        postgraduateTAsRequired:
                          prev.postgraduateTAsRequired + 1,
                      }));
                      setInputErrors((prev) => ({
                        ...prev,
                        tasRequired: validateField(
                          "postgraduateTAsRequired",
                          formData.postgraduateTAsRequired + 1
                        ),
                      }));
                    }}
                    className="hover:text-primary-light hover:outline-primary-light hover:outline-2 focus:outline-2 focus:outline-primary-light focus:text-primary-light rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>
            {inputErrors.tasRequired && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.tasRequired}
              </span>
            )}
          </div>

          {/* Requested TA hours /week /TA */}
          <div className="form-control flex flex-col space-y-4">
            <label className="label mt-5">
              <span className="label-text">Requested TA hours /week /TA</span>
            </label>
            <label className="text-text-secondary ml-8 flex flex-row items-center new-module-input max-w-fit">
              <input
                type="number"
                min={0}
                max={50}
                name="taHours"
                value={formData.taHours}
                onChange={handleChange}
                className="pl-2 text-text-primary focus:outline-0 pr-2 mr-2 border-0 border-r-2 border-r-text-secondary"
                placeholder="Hours"
              />
              hours
            </label>
            {inputErrors.taHours && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.taHours}
              </span>
            )}
          </div>

          {/* Application due date */}
          <div className="flex flex-col gap-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Application Due Date</span>
              </label>
              <input
                type="datetime-local"
                name="appDueDate"
                value={formData.appDueDate}
                onChange={handleChange}
                className="ml-5 input input-bordered"
              />
            </div>
            {inputErrors.appDueDate && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.appDueDate}
              </span>
            )}
          </div>

          {/* Document submission deadline */}
          <div className="flex flex-col gap-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Document Submission Deadline</span>
              </label>
              <input
                type="datetime-local"
                name="docDueDate"
                value={formData.docDueDate}
                onChange={handleChange}
                className="ml-5 input input-bordered"
              />
            </div>
            {inputErrors.docDueDate && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.docDueDate}
              </span>
            )}
          </div>

          {/* Special Notes */}
          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text">Special Notes</span>
            </label>
            <textarea
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleChange}
              className="new-module-input h-24 ml-8 mt-4"
              placeholder="Any special instructions or notes for applicants..."
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 flex justify-end gap-x-5 w-full">
          <button
            onClick={() => navigate(-1)}
            className="text-text-primary rounded-md outline outline-2 outline-text-primary hover:bg-text-primary w-36 py-2 px-4 hover:text-text-inverted"
          >
            Cancel
          </button>
          <button
            onClick={handleAddModule}
            className="w-36 rounded-md outline outline-2 outline-primary-light bg-primary hover:bg-primary-light py-2 px-4 text-text-inverted"
            // disabled={isFormValid()}
          >
            Add Module
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewModule;
