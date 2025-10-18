import React, { useState } from "react";
import { useModal } from "../../contexts/ModalProvider";
import { useToast } from "../../contexts/ToastContext";
import axiosInstance from "../../api/axiosConfig";

interface ChangeDeadlineModalProps {
  recruitmentSeriesId: string;
  recruitmentSeriesName: string;
  currentApplicationDueDate: string;
  currentDocumentDueDate: string;
  onSuccess?: () => void;
}

interface DeadlineFormData {
  applicationDueDate: string;
  documentDueDate: string;
  updateModuleDeadlines: boolean;
}

const ChangeDeadlineModal: React.FC<ChangeDeadlineModalProps> = ({
  recruitmentSeriesId,
  recruitmentSeriesName,
  currentApplicationDueDate,
  currentDocumentDueDate,
  onSuccess,
}) => {
  const { closeModal } = useModal();
  const { showToast } = useToast();

  // Format dates for datetime-local input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<DeadlineFormData>({
    applicationDueDate: formatDateForInput(currentApplicationDueDate),
    documentDueDate: formatDateForInput(currentDocumentDueDate),
    updateModuleDeadlines: true,
  });

  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (fieldName: string, value: string) => {
    let error = "";
    const now = new Date();
    const inputDate = new Date(value);

    switch (fieldName) {
      case "applicationDueDate":
        if (!value) {
          error = "Application due date is required.";
        } else if (inputDate <= now) {
          error = "Application due date must be in the future.";
        } else if (
          formData.documentDueDate &&
          value &&
          new Date(formData.documentDueDate) < new Date(value)
        ) {
          error = "Application due date must be on or before document submission deadline.";
        }
        break;
      case "documentDueDate":
        if (!value) {
          error = "Document due date is required.";
        } else if (inputDate <= now) {
          error = "Document due date must be in the future.";
        } else if (
          formData.applicationDueDate &&
          value &&
          new Date(formData.applicationDueDate) > new Date(value)
        ) {
          error = "Document due date must be on or after application due date.";
        }
        break;
      default:
        break;
    }

    setInputErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // Only validate date fields
    if (type !== "checkbox") {
      // Validate current field
      validateField(name, value);
      
      // Re-validate the other date field to check cross-validation
      if (name === "applicationDueDate" && formData.documentDueDate) {
        validateField("documentDueDate", formData.documentDueDate);
      } else if (name === "documentDueDate" && formData.applicationDueDate) {
        validateField("applicationDueDate", formData.applicationDueDate);
      }
    }
  };

  const isFormValid = () => {
    const hasErrors = Object.values(inputErrors).some(error => error !== "");
    const hasEmptyFields = !formData.applicationDueDate || !formData.documentDueDate;
    return !hasErrors && !hasEmptyFields;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const appDateValid = validateField("applicationDueDate", formData.applicationDueDate);
    const docDateValid = validateField("documentDueDate", formData.documentDueDate);

    if (!appDateValid || !docDateValid) {
      showToast("Please fix the errors before submitting", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put(
        `/recruitment-series/${recruitmentSeriesId}/deadlines`,
        {
          applicationDueDate: new Date(formData.applicationDueDate).toISOString(),
          documentDueDate: new Date(formData.documentDueDate).toISOString(),
          updateModuleDeadlines: formData.updateModuleDeadlines,
        }
      );

      if (response.status === 200) {
        const message = response.data.message || "Deadlines updated successfully";
        showToast(message, "success");
        onSuccess?.();
        closeModal();
      }
    } catch (error) {
      console.error("Error updating deadlines:", error);
      showToast("Failed to update deadlines", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col py-4 px-6 max-w-lg">
      <h2 className="text-xl font-semibold mb-6 text-center">Change Deadlines</h2>
      
      <div className="mb-4">
        <p className="text-sm text-text-secondary mb-2">
          Recruitment Series: <span className="font-semibold text-text-primary">{recruitmentSeriesName}</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Application Due Date */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm font-medium">Application Due Date</span>
          </label>
          <input
            type="datetime-local"
            name="applicationDueDate"
            value={formData.applicationDueDate}
            onChange={handleChange}
            className="input input-bordered w-full"
            disabled={isLoading}
          />
          {inputErrors.applicationDueDate && (
            <span className="text-warning text-xs mt-1 bg-warning/10 py-1 px-2 rounded">
              {inputErrors.applicationDueDate}
            </span>
          )}
        </div>

        {/* Document Due Date */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm font-medium">Document Submission Deadline</span>
          </label>
          <input
            type="datetime-local"
            name="documentDueDate"
            value={formData.documentDueDate}
            onChange={handleChange}
            className="input input-bordered w-full"
            disabled={isLoading}
          />
          {inputErrors.documentDueDate && (
            <span className="text-warning text-xs mt-1 bg-warning/10 py-1 px-2 rounded">
              {inputErrors.documentDueDate}
            </span>
          )}
        </div>

        {/* Update Module Deadlines Option */}
        <div className="form-control">
          <label className="cursor-pointer label justify-start gap-x-3">
            <input
              type="checkbox"
              name="updateModuleDeadlines"
              checked={formData.updateModuleDeadlines}
              onChange={handleChange}
              className="checkbox checkbox-primary"
              disabled={isLoading}
            />
            <span className="label-text text-sm">
              Change the recruitment round's all module recruitments' deadlines to these
            </span>
          </label>
          <p className="text-text-secondary text-xs ml-6">
            When checked, all modules in this recruitment series will have their deadlines updated to match the new deadlines.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-x-4 mt-6 justify-end">
        <button
          className="rounded-md outline outline-1 outline-text-secondary hover:bg-primary/20 text-text-primary px-4 py-2 font-semibold"
          onClick={closeModal}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          className={`rounded-md outline outline-1 px-4 py-2 font-semibold ${
            isFormValid() && !isLoading
              ? "outline-primary hover:bg-primary text-primary hover:text-text-inverted"
              : "outline-text-secondary/50 text-text-secondary/50 cursor-not-allowed"
          }`}
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? "Updating..." : "Update Deadlines"}
        </button>
      </div>
    </div>
  );
};

export default ChangeDeadlineModal;