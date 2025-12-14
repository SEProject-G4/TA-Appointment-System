import {
  FileText,
  GraduationCap,
  Upload,
  User,
  X,
  FilePen,
  CheckCircle2,
  Download,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../api/axiosConfig";
import { useToast } from "../../contexts/ToastContext";
import FileInput from "../common/FileInput";

// Declaration Form URL - Vite environment variables need VITE_ prefix
const DECLARATION_FORM_URL = import.meta.env.VITE_DECLARATION_FORM_URL || 
  'https://drive.google.com/file/d/1Yx_48T0BEFLmYd2oz-neQRq0075yFOxc/view?usp=sharing';

interface DocumentSubmissionModalProps {
  isDocOpen: boolean;
  onClose: () => void;
  position: {
    modules: {
      moduleCode: string;
      moduleName: string;
    }[];

    totalTAHours: number;
  };
  isDocSubmitted: boolean;
  recSeriesId?: string | null;
  currentRoundDocument?: any | null;
  previousDocuments?: any[];
  onSuccess?: () => void; // Add optional success callback
}

export default function DocumentSubmissionModal({
  isDocOpen,
  onClose,
  position, 
  recSeriesId,
  currentRoundDocument,
  previousDocuments = [],
  onSuccess, // Add to destructuring
}: DocumentSubmissionModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviousDocs, setShowPreviousDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    bankAccountName: "",
    address: "",
    nicNumber: "",
    accountNumber: "",
    studentType: "",
    bankPassbook: null as File | null,
    nicCopy: null as File | null,
    cv: null as File | null,
    degreeCertificate: null as File | null,
    declarationForm: null as File | null,
  });

  // Auto-fill form with current round document if it exists (for editing)
  useEffect(() => {
    if (isDocOpen && currentRoundDocument) {
      setFormData((prev) => ({
        ...prev,
        bankAccountName: currentRoundDocument.bankAccountName || prev.bankAccountName,
        address: currentRoundDocument.address || prev.address,
        nicNumber: currentRoundDocument.nicNumber || prev.nicNumber,
        accountNumber: currentRoundDocument.accountNumber || prev.accountNumber,
        studentType: currentRoundDocument.studentType || prev.studentType,
        // Note: Files cannot be auto-filled, user needs to upload new files
      }));
    } else if (isDocOpen) {
      // Reset form when opening without current document
      setFormData({
        bankAccountName: "",
        address: "",
        nicNumber: "",
        accountNumber: "",
        studentType: "",
        bankPassbook: null,
        nicCopy: null,
        cv: null,
        degreeCertificate: null,
        declarationForm: null,
      });
    }
  }, [isDocOpen, currentRoundDocument]);

  // Auto-show previous documents when modal opens if they exist
  useEffect(() => {
    if (isDocOpen && (previousDocuments?.length > 0 || currentRoundDocument)) {
      setShowPreviousDocs(true);
    }
  }, [isDocOpen, previousDocuments, currentRoundDocument]);

  // Function to import data from previous submission
  const handleImportPrevious = (prevDoc: any) => {
    setFormData((prev) => ({
      ...prev,
      bankAccountName: prevDoc.bankAccountName || prev.bankAccountName,
      address: prevDoc.address || prev.address,
      nicNumber: prevDoc.nicNumber || prev.nicNumber,
      accountNumber: prevDoc.accountNumber || prev.accountNumber,
      studentType: prevDoc.studentType || prev.studentType,
      // Note: Files cannot be imported, user needs to upload new files
    }));
    showToast("Previous document data imported! Please upload new files.", "success");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.bankAccountName || !formData.nicNumber || !formData.accountNumber || !formData.address || !formData.studentType) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!user?.id) {
      showToast("User not authenticated", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data request
      const submitData = new FormData();
      
      // Append text fields
      submitData.append("userId", user.id);
      if (recSeriesId) {
        submitData.append("recSeriesId", recSeriesId);
      }
      submitData.append("bankAccountName", formData.bankAccountName);
      submitData.append("address", formData.address);
      submitData.append("nicNumber", formData.nicNumber);
      submitData.append("accountNumber", formData.accountNumber);
      submitData.append("studentType", formData.studentType);
      submitData.append("position", JSON.stringify(position));

      // Append files if they exist
      if (formData.bankPassbook) {
        submitData.append("bankPassbook", formData.bankPassbook);
      }
      if (formData.nicCopy) {
        submitData.append("nicCopy", formData.nicCopy);
      }
      if (formData.cv) {
        submitData.append("cv", formData.cv);
      }
      if (formData.degreeCertificate) {
        submitData.append("degreeCertificate", formData.degreeCertificate);
      }
      if (formData.declarationForm) {
        submitData.append("declarationForm", formData.declarationForm);
      }

      const response = await axiosInstance.post("/documents/submit", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        const message = currentRoundDocument 
          ? "Documents updated successfully!" 
          : "Documents submitted successfully!";
        showToast(message, "success");
        if (onSuccess) {
          onSuccess(); // Call success callback to refresh parent
        } else {
          onClose(); // Fallback to just closing
        }
      } else if (response.status === 207) {
        showToast(
          "Documents uploaded with some failures. Please check and retry.",
          "info"
        );
      }
    } catch (error: any) {
      console.error("Error submitting documents:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit documents. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isDocOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 sm:p-4">
      <div className="bg-bg-card rounded-lg w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 lg:p-8 border border-border-default/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-default/50 sm:pb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-text-primary sm:text-xl">
              Document Submission
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 transition rounded-full hover:bg-primary-light/20 flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-secondary sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Current Round Document - Show if exists (for editing) */}
        {currentRoundDocument && (
          <div className="mb-6 p-4 border-2 rounded-lg border-blue-400 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <FilePen className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-gray-900">
                Current Submission - Ready to Edit
              </h3>
              <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-200 rounded">
                Form Pre-filled Below
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {currentRoundDocument.recSeriesName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Submitted on {new Date(currentRoundDocument.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-2">
                <div>
                  <span className="font-medium">Bank Account:</span>{" "}
                  {currentRoundDocument.bankAccountName}
                </div>
                <div>
                  <span className="font-medium">NIC:</span> {currentRoundDocument.nicNumber}
                </div>
                <div>
                  <span className="font-medium">Account Number:</span>{" "}
                  {currentRoundDocument.accountNumber}
                </div>
                <div>
                  <span className="font-medium">Student Type:</span>{" "}
                  {currentRoundDocument.studentType}
                </div>
              </div>
              {currentRoundDocument.driveFiles && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Previously Uploaded Files:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(currentRoundDocument.driveFiles).map(
                      ([key, file]: [string, any]) => (
                        <a
                          key={key}
                          href={file.viewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {key}
                        </a>
                      )
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: You can update files by uploading new ones below
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Documents Section - Show prominently if exists */}
        {(previousDocuments && previousDocuments.length > 0) && (
          <div className="mb-6 p-4 border-2 rounded-lg border-green-300 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-700" />
                <h3 className="font-semibold text-gray-900">
                  Previously Submitted Documents ({previousDocuments.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviousDocs(!showPreviousDocs)}
                className="text-sm text-green-700 hover:text-green-800"
              >
                {showPreviousDocs ? "Hide" : "Show Details"}
              </button>
            </div>
            
            {/* Most Recent Document - Prominent Import Option */}
            {previousDocuments.length > 0 && (
              <div className="mb-4 p-3 bg-white rounded border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Most Recent: {previousDocuments[0].recSeriesName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Submitted on {new Date(previousDocuments[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImportPrevious(previousDocuments[0])}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Import This Data
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-2">
                  <div>
                    <span className="font-medium">Bank Account:</span>{" "}
                    {previousDocuments[0].bankAccountName}
                  </div>
                  <div>
                    <span className="font-medium">NIC:</span> {previousDocuments[0].nicNumber}
                  </div>
                  <div>
                    <span className="font-medium">Account Number:</span>{" "}
                    {previousDocuments[0].accountNumber}
                  </div>
                  <div>
                    <span className="font-medium">Student Type:</span>{" "}
                    {previousDocuments[0].studentType}
                  </div>
                </div>
              </div>
            )}

            {/* All Previous Documents - Expandable */}
            {showPreviousDocs && previousDocuments.length > 1 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">All Previous Submissions:</h4>
                {previousDocuments.slice(1).map((prevDoc, idx) => (
                  <div
                    key={prevDoc._id || idx}
                    className="p-3 bg-white rounded border border-green-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {prevDoc.recSeriesName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(prevDoc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportPrevious(prevDoc)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Import
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Bank Account:</span>{" "}
                        {prevDoc.bankAccountName}
                      </div>
                      <div>
                        <span className="font-medium">NIC:</span> {prevDoc.nicNumber}
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span>{" "}
                        {prevDoc.accountNumber}
                      </div>
                      <div>
                        <span className="font-medium">Student Type:</span>{" "}
                        {prevDoc.studentType}
                      </div>
                    </div>
                    {prevDoc.driveFiles && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Uploaded Files:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(prevDoc.driveFiles).map(
                            ([key, file]: [string, any]) => (
                              <a
                                key={key}
                                href={file.viewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {key}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Position Info */}
          <div className="p-3 mb-4 border rounded-lg border-border-default/50 sm:p-4 sm:mb-6 bg-primary-light/10">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <GraduationCap className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary sm:text-base">
                Position Information
              </h2>
            </div>

            {/* Module List */}
            <div className="space-y-2">
              {position.modules.map((mod, index) => (
                <div
                  key={index}
                  className="flex justify-between pb-1 text-sm border-b text-text-primary border-border-default/30 last:border-0"
                >
                  <span className="font-medium">{mod.moduleCode}</span>
                  <span>{mod.moduleName}</span>
                </div>
              ))}
            </div>

            {/* Total Hours */}
            <div className="mt-4 text-sm">
              <p className="text-text-secondary">Total TA Hours</p>
              <p className="font-medium text-text-primary">{position.totalTAHours} hours</p>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="flex-shrink-0 w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary">
                  Name as in Bank Account *
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-border-default bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your name as shown in bank account"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary">
                  NIC Number *
                </label>
                <input
                  type="text"
                  name="nicNumber"
                  value={formData.nicNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-border-default bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your NIC number"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-border-default bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your bank account number"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary">
                  Student Type *
                </label>
                <select
                  name="studentType"
                  value={formData.studentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-border-default bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select your student type</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block mb-1 text-sm font-medium text-text-primary">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg border-border-default bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="Enter your complete address"
              />
            </div>
          </div>
          {/* Declaration Form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FilePen className="flex-shrink-0 w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Declaration Form</h3>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="p-4 border rounded-lg border-border-default/50 bg-primary-light/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-success" />
                  <h4 className="font-medium text-text-primary">
                    Step 1: Download Declaration Form
                  </h4>
                </div>
                <p className="mb-3 text-sm text-text-secondary">
                  Download the official declaration form, fill it out
                  completely, and sign it.
                </p>
                <Button
                  label="Download Declaration Form (PDF)"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => window.open(DECLARATION_FORM_URL, '_blank')}
                />
              </div>

              {/* Step 2 */}
              <div className="p-4 border rounded-lg border-border-default/50 bg-primary-light/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-success" />
                  <h4 className="font-medium text-text-primary">
                    Step 2: Upload Completed Form
                  </h4>
                </div>
                <p className="mb-3 text-sm text-text-secondary">
                  Upload the signed and completed declaration form below.
                </p>
                <FileInput
                  label="Completed Declaration Form"
                  name="declarationForm"
                  accept=".pdf,.doc,.docx"
                  value={formData.declarationForm}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="flex-shrink-0 w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Document Uploads</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FileInput
                label="Copy of Bank Passbook"
                name="bankPassbook"
                accept=".pdf,.jpg,.jpeg,.png"
                value={formData.bankPassbook}
                onChange={handleFileChange}
              />

              <FileInput
                label="Photo/Scan of NIC"
                name="nicCopy"
                accept=".pdf,.jpg,.jpeg,.png"
                value={formData.nicCopy}
                onChange={handleFileChange}
              />

              <FileInput
                label="Updated CV"
                name="cv"
                accept=".pdf,.doc,.docx"
                value={formData.cv}
                onChange={handleFileChange}
              />

              {formData.studentType === "postgraduate" && (
                <FileInput
                  label="Degree Certificate or Transcript"
                  name="degreeCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={formData.degreeCertificate}
                  onChange={handleFileChange}
                  helperText="Required for postgraduate students"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border-default/50">
            <button
              type="button"
              className="px-4 py-2 transition-colors border rounded-lg border-border-default text-text-primary bg-bg-card hover:bg-primary-light/20 disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting 
                ? (currentRoundDocument ? "Updating..." : "Submitting...") 
                : (currentRoundDocument ? "Update Documents" : "Submit Documents")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
