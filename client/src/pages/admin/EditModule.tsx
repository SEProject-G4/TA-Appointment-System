import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus, FaMinus } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import AutoSelect, { type Option } from "../../components/common/AutoSelect";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

import { useToast } from "../../contexts/ToastContext";
import axiosInstance from "../../api/axiosConfig";
import { useRoundsStore } from "../../stores/useRoundsStore";

import "./NewModule.css";
import { areDatesEffectivelySame } from "../../utils/DateTime";

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
}

function toLocalDatetimeInputValue(date: Date) {
  // Ensure we get the local time zone offset correctly
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

const EditModule: React.FC = () => {
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
  });
  const [originalDates, setOriginalDates] = useState<{
    appDueDate: string;
    docDueDate: string;
  }>({
    appDueDate: "",
    docDueDate: "",
  });
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});
  const [availableLecturers, setAvailableLecturers] = useState<Option[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    message: string;
    applicationsToRemove: any[];
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { roundId: string; moduleId: string } | null;
  const { showToast } = useToast();
  const getModuleById = useRoundsStore((state) => state.getModuleById);
  const refreshModule = useRoundsStore((state) => state.refreshModule);

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

  const updateModuleData = async (confirmRemoval = false) => {
    try {
      setIsUpdating(true);
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
        confirmRemoval,
      };

      console.log("Updating module with payload:", payload);
      await axiosInstance.put(`/modules/${state?.moduleId}`, payload);

      setShowConfirmDialog(false);
      setConfirmationData(null);
      showToast("Module updated successfully!", "success");
      await refreshModule(state!.roundId, state!.moduleId);
      navigate(-1); // Go back to previous page
    } catch (error: any) {
      console.error("Error updating module:", error);

      // Handle confirmation requirement
      if (
        error.response?.status === 409 &&
        error.response?.data?.requiresConfirmation
      ) {
        setConfirmationData({
          message: error.response.data.message,
          applicationsToRemove: error.response.data.applicationsToRemove || [],
        });
        setShowConfirmDialog(true);
      } else {
        const errorMessage =
          error.response?.data?.error || "Failed to update module";
        showToast(errorMessage, "error");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Validation functions
  const validateFieldAndUpdateErrors = (name: string, value: any) => {
    let errorMsgs: { [key: string]: string } = {};
    
    switch (name) {
      case "moduleCode":
        errorMsgs.moduleCode = !value ? "Module code is required." : "";
        break;
      case "moduleName":
        errorMsgs.moduleName = !value ? "Module name is required." : "";
        break;  
      case "taHours":
        errorMsgs.taHours = value <= 0 ? "TA hours should be greater than 0." : "";
        break;
      case "undergraduateTAsRequired":
        if (
          value <= 0 &&
          (!formData.postgraduateTAsRequired ||
            formData.postgraduateTAsRequired <= 0)
        ) {
          errorMsgs.undergraduateTAsRequired = "At least one TA (undergraduate or postgraduate) is required.";
        } else {
          errorMsgs.undergraduateTAsRequired = "";
        }
        break;
      case "postgraduateTAsRequired":
        if (
          value <= 0 &&
          (!formData.undergraduateTAsRequired ||
            formData.undergraduateTAsRequired <= 0)
        ) {
          errorMsgs.postgraduateTAsRequired = "At least one TA (undergraduate or postgraduate) is required.";
        } else {
          errorMsgs.postgraduateTAsRequired = "";
        }
        break;
      case "appDueDate":
        if (!value) {
          errorMsgs.appDueDate = "Application due date is required.";
          break;
        }
        const appDate = new Date(value);
        const now = new Date();
        // Only check if date is after now if the date has been changed (with tolerance)
        const appDateChanged = !areDatesEffectivelySame(value, originalDates.appDueDate);
        if (appDateChanged && appDate <= now) {
          errorMsgs.appDueDate = "New application due date must be in future.";
          break;
        }
        // If docDueDate is set, check order
        if (
          formData.docDueDate &&
          value &&
          new Date(formData.docDueDate) <= new Date(value)
        ) {
          errorMsgs.appDueDate = "New application due date must be before document submission deadline..";
          errorMsgs.docDueDate = "New document submission deadline must be after application due date.";
          break;
        }
        errorMsgs.appDueDate = "";
        errorMsgs.docDueDate = "";
        break;
      case "docDueDate":
        if (!value) {
          errorMsgs.docDueDate = "Document submission deadline is required.";
          break;
        }
        const docDate = new Date(value);
        const nowDoc = new Date();
        // Only check if date is after now if the date has been changed (with tolerance)
        const docDateChanged = !areDatesEffectivelySame(value, originalDates.docDueDate);
        if (docDateChanged && docDate <= nowDoc) {
          errorMsgs.docDueDate = "Document due date must be in future.";
          break;
        }
        if (
          formData.appDueDate &&
          value &&
          new Date(value) <= new Date(formData.appDueDate)
        ) {
          errorMsgs.appDueDate = "New application due date must be before document submission deadline.";
          errorMsgs.docDueDate = "New document submission deadline must be after application due date.";
          break;
        }
        errorMsgs.docDueDate = "";
        errorMsgs.appDueDate = "";
        break;
      default:
        return;
    }
    setInputErrors((prev) => ({ ...prev, ...errorMsgs }));
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
    validateFieldAndUpdateErrors(name, newValue);
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
      if (key === "semester") {
        validateSemester(formData.semester);
      } else if (key === "coordinators") {
        validateCoordinators(formData.coordinators);
      } else {
        validateFieldAndUpdateErrors(key, (formData as any)[key]);
      }
    });
  };

  const handleUpdateModule = () => {
    validateForm();
    if (isFormValid()) {
      updateModuleData();
    } else {
      showToast("Please fix the errors in the form.", "error");
    }
  };

  const handleConfirmUpdate = () => {
    updateModuleData(true);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setConfirmationData(null);
  };

  const semesters: Option[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Semester ${i + 1}`,
  }));

  useEffect(() => {
    if (state && state.roundId && state.moduleId) {
      const modData = getModuleById(state.roundId, state.moduleId);
      if (modData) {
        const appDueDateValue = toLocalDatetimeInputValue(
          new Date(modData.applicationDueDate)
        );
        const docDueDateValue = toLocalDatetimeInputValue(
          new Date(modData.documentDueDate)
        );
        
        setFormData({
          moduleCode: modData.moduleCode,
          moduleName: modData.moduleName,
          semester: {
            id: modData.semester,
            label: `Semester ${modData.semester}`,
          },
          coordinators: modData.coordinators.map((coord) => ({
            id: coord.id,
            label: coord.displayName,
            subtitle: coord.email,
            picture: coord.profilePicture,
          })),
          taHours: modData.requiredTAHours,
          undergraduateTAsRequired: modData.undergraduateCounts
            ? modData.undergraduateCounts.required
            : 0,
          postgraduateTAsRequired: modData.postgraduateCounts
            ? modData.postgraduateCounts.required
            : 0,
          specialNotes: modData.requirements,
          docDueDate: docDueDateValue,
          appDueDate: appDueDateValue,
        });

        // Store original dates for validation comparison
        setOriginalDates({
          appDueDate: appDueDateValue,
          docDueDate: docDueDateValue
        });

        fetchLecturers().then(() => {
          setAvailableLecturers((prev) =>
            prev.filter(
              (lecturer) =>
                !modData.coordinators.some((coord) => coord.id === lecturer.id)
            )
          );
        });
      } else {
        showToast("Module data not found.", "error");
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-start p-4 min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20">
      <div className="rounded-lg w-full max-w-4xl bg-bg-card shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-base-content select-none">
          Edit Module <br />
          <span className="text-2xl mt-3">
            {formData.moduleCode} - {formData.moduleName} [
            {formData.semester?.label}]
          </span>
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
              className="ml-8 max-w-[150px] new-module-input w-32"
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
              maxLength={100}
              className="ml-8 min-w-[400px] w-96 new-module-input"
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
            <div className="flex flex-row flex-wrap ml-8 gap-x-5 gap-y-2 items-start mb-8">
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
                      const newValue = Math.max(0, formData.undergraduateTAsRequired - 1);
                      setFormData((prev) => ({
                        ...prev,
                        undergraduateTAsRequired: newValue
                      }));
                      validateFieldAndUpdateErrors(
                        "undergraduateTAsRequired",
                        newValue
                      );
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
                      const newValue = Math.min(20, formData.undergraduateTAsRequired + 1);
                      setFormData((prev) => ({
                        ...prev,
                        undergraduateTAsRequired: newValue
                      }));
                      validateFieldAndUpdateErrors(
                        "undergraduateTAsRequired",
                        newValue
                      );
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
                      const newValue = Math.max(0, formData.postgraduateTAsRequired - 1);
                      setFormData((prev) => ({
                        ...prev,
                        postgraduateTAsRequired: newValue,
                      }));
                      validateFieldAndUpdateErrors(
                        "postgraduateTAsRequired",
                        newValue
                      );
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
                      const newValue = Math.min(20, formData.postgraduateTAsRequired + 1);
                      setFormData((prev) => ({
                        ...prev,
                        postgraduateTAsRequired: newValue,
                      }));
                      validateFieldAndUpdateErrors(
                        "postgraduateTAsRequired",
                        newValue
                      );
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
                className="ml-5 max-w-[200px] input input-bordered"
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
                className="ml-5 max-w-[200px] input input-bordered"
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
            onClick={handleUpdateModule}
            disabled={isUpdating}
            className="w-36 rounded-md outline outline-2 outline-primary-light bg-primary hover:bg-primary-light py-2 px-4 text-text-inverted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Remove Applications?"
        message={
          confirmationData ? (
            <div className="space-y-3">
              <p>{confirmationData.message}.</p>
              <p className="font-semibold">The following recent applications will be removed:</p>
              <ul className="list-decimal list-inside space-y-1 pl-2">
                {confirmationData.applicationsToRemove.map((app, index) => (
                  <li key={index} className="text-sm">
                    {app.userName} ({app.userEmail}) - {app.studentType} - {app.hoursAllocated} hours
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-4">TA hours will be returned to affected students.</p>
              <p className="text-warning">Do you want to continue?</p>
            </div>
          ) : ""
        }
        onConfirm={handleConfirmUpdate}
        onCancel={handleCancelConfirm}
        confirmButtonText="Yes, Update Module"
        cancelButtonText="Cancle"
        confirmButtonClassName="px-4 py-2 font-medium text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 transition"
        isProcessing={isUpdating}
      />
    </div>
  );
};

export default EditModule;
