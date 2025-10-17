import React, { useState } from "react";
import { useModal } from "../../contexts/ModalProvider";
import { useToast } from "../../contexts/ToastContext";
import axiosInstance from "../../api/axiosConfig";
import { FaMinus, FaPlus } from "react-icons/fa";

import "../../pages/admin/NewModule.css";

interface ChangeHourLimitsModalProps {
  recruitmentSeriesId: string;
  recruitmentSeriesName: string;
  currentUndergradHourLimit: number;
  currentPostgradHourLimit: number;
  onSuccess?: () => void;
}

interface HourLimitsFormData {
  undergradHourLimit: number;
  postgradHourLimit: number;
}

const ChangeHourLimitsModal: React.FC<ChangeHourLimitsModalProps> = ({
  recruitmentSeriesId,
  recruitmentSeriesName,
  currentUndergradHourLimit,
  currentPostgradHourLimit,
  onSuccess,
}) => {
  const { closeModal } = useModal();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<HourLimitsFormData>({
    undergradHourLimit: currentUndergradHourLimit,
    postgradHourLimit: currentPostgradHourLimit,
  });

  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (fieldName: string, value: number) => {
    let error = "";

    switch (fieldName) {
      case "undergradHourLimit":
        if (!value || value <= 0) {
          error = "Undergraduate hour limit must be a positive number.";
        } else if (value > 50) {
          error = "Undergraduate hour limit cannot exceed 50 hours per week.";
        } else if (!Number.isInteger(value)) {
          error = "Undergraduate hour limit must be a whole number.";
        }
        break;
      case "postgradHourLimit":
        if (!value || value <= 0) {
          error = "Postgraduate hour limit must be a positive number.";
        } else if (value > 50) {
          error = "Postgraduate hour limit cannot exceed 50 hours per week.";
        } else if (!Number.isInteger(value)) {
          error = "Postgraduate hour limit must be a whole number.";
        }
        break;
      default:
        break;
    }

    setInputErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseInt(value) || 0;
    
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    validateField(name, numericValue);
  };

  const handleIncrement = (fieldName: string) => {
    const currentValue = formData[fieldName as keyof HourLimitsFormData];
    const newValue = Math.min(currentValue + 1, 50);
    
    setFormData((prev) => ({ ...prev, [fieldName]: newValue }));
    validateField(fieldName, newValue);
  };

  const handleDecrement = (fieldName: string) => {
    const currentValue = formData[fieldName as keyof HourLimitsFormData];
    const newValue = Math.max(currentValue - 1, 1);
    
    setFormData((prev) => ({ ...prev, [fieldName]: newValue }));
    validateField(fieldName, newValue);
  };

  const isFormValid = () => {
    const hasErrors = Object.values(inputErrors).some(error => error !== "");
    const hasValidValues = formData.undergradHourLimit > 0 && formData.postgradHourLimit > 0;
    return !hasErrors && hasValidValues;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const undergradValid = validateField("undergradHourLimit", formData.undergradHourLimit);
    const postgradValid = validateField("postgradHourLimit", formData.postgradHourLimit);

    if (!undergradValid || !postgradValid) {
      showToast("Please fix the errors before submitting", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put(
        `/recruitment-series/${recruitmentSeriesId}/hour-limits`,
        {
          undergradHourLimit: formData.undergradHourLimit,
          postgradHourLimit: formData.postgradHourLimit,
        }
      );

      if (response.status === 200) {
        showToast("Hour limits updated successfully", "success");
        onSuccess?.();
        closeModal();
      }
    } catch (error) {
      console.error("Error updating hour limits:", error);
      showToast("Failed to update hour limits", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col py-2 px-6 max-w-lg">
      <h2 className="text-xl font-semibold mb-6 text-center">Change Hour Limits</h2>
      
      <div className="mb-4">
        <p className="text-text-secondary mb-2">
          Recruitment Round: <span className="font-semibold text-text-primary">{recruitmentSeriesName}</span>
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        {/* Undergraduate Hour Limit */}
        <div className="form-control flex flex-col gap-y-2">
          <label className="label">
            <span className="label-text text-sm font-medium">Undergraduate TA Hours Limit/Week</span>
          </label>
          <div className="flex items-center space-x-2 ml-8 mt-3">
            <button
              type="button"
              onClick={() => handleDecrement("undergradHourLimit")}
              disabled={isLoading || formData.undergradHourLimit <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-text-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaMinus className="w-3 h-3 text-text-secondary" />
            </button>
            <label className="text-text-secondary flex flex-row items-center new-module-input">
              <input
                type="number"
                min={1}
                max={50}
                name="undergradHourLimit"
                value={formData.undergradHourLimit}
                onChange={handleChange}
                disabled={isLoading}
                className="pl-2 text-text-primary focus:outline-0 pr-2 mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                placeholder="Hours"
              />
              hours
            </label>
            <button
              type="button"
              onClick={() => handleIncrement("undergradHourLimit")}
              disabled={isLoading || formData.undergradHourLimit >= 50}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-text-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="w-3 h-3 text-text-secondary" />
            </button>
          </div>
          {inputErrors.undergradHourLimit && (
            <span className="text-warning text-xs mt-1 bg-warning/10 py-1 px-2 rounded">
              {inputErrors.undergradHourLimit}
            </span>
          )}
        </div>

        {/* Postgraduate Hour Limit */}
        <div className="form-control flex flex-col gap-y-2">
          <label className="label">
            <span className="label-text text-sm font-medium">Postgraduate TA Hours Limit/Week</span>
          </label>
          <div className="flex items-center space-x-2 ml-8 mt-3">
            <button
              type="button"
              onClick={() => handleDecrement("postgradHourLimit")}
              disabled={isLoading || formData.postgradHourLimit <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-text-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaMinus className="w-3 h-3 text-text-secondary" />
            </button>
            <label className="text-text-secondary flex flex-row items-center new-module-input">
              <input
                type="number"
                min={1}
                max={50}
                name="postgradHourLimit"
                value={formData.postgradHourLimit}
                onChange={handleChange}
                disabled={isLoading}
                className="pl-2 text-text-primary focus:outline-0 pr-2 mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                placeholder="Hours"
              />
              hours
            </label>
            <button
              type="button"
              onClick={() => handleIncrement("postgradHourLimit")}
              disabled={isLoading || formData.postgradHourLimit >= 50}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-text-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="w-3 h-3 text-text-secondary" />
            </button>
          </div>
          {inputErrors.postgradHourLimit && (
            <span className="text-warning text-xs mt-1 bg-warning/10 py-1 px-2 rounded">
              {inputErrors.postgradHourLimit}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-x-4 mt-10 justify-end">
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
          {isLoading ? "Updating..." : "Update Hour Limits"}
        </button>
      </div>
    </div>
  );
};

export default ChangeHourLimitsModal;