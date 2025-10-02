import {
  FileText,
  GraduationCap,
  Upload,
  User,
  X,
  FilePen,
  CheckCircle2,
  Download,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/Button";

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
}

export default function DocumentSubmissionModal({
  isDocOpen,
  onClose,
  position,
}: DocumentSubmissionModalProps) {
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
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    name: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted data:", formData);
    alert(`Documents submitted for ${position.moduleCode}`);
    onClose();
  };

  if (!isDocOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              Document Submission
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Position Info */}
          <div className="p-4 mb-6 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-800">
                Position Information
              </h2>
            </div>

            {/* Module List */}
            <div className="space-y-2">
              {position.modules.map((mod, index) => (
                <div
                  key={index}
                  className="flex justify-between pb-1 text-sm text-gray-700 border-b last:border-0"
                >
                  <span className="font-medium">{mod.moduleCode}</span>
                  <span>{mod.moduleName}</span>
                </div>
              ))}
            </div>

            {/* Total Hours */}
            <div className="mt-4 text-sm">
              <p className="text-gray-500">Total TA Hours</p>
              <p className="font-medium">{position.totalTAHours} hours</p>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Name as in Bank Account *
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blborder"
                  placeholder="Enter your name as shown in bank account"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  NIC Number *
                </label>
                <input
                  type="text"
                  name="nicNumber"
                  value={formData.nicNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your NIC number"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your bank account number"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Student Type *
                </label>
                <select
                  name="studentType"
                  value={formData.studentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your student type</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block mb-1 text-sm font-medium">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your complete address"
              />
            </div>
          </div>
          {/* Declaration Form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FilePen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">Declaration Form</h3>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-800">
                    Step 1: Download Declaration Form
                  </h4>
                </div>
                <p className="mb-3 text-sm text-gray-600">
                  Download the official declaration form, fill it out
                  completely, and sign it.
                </p>
                <Button
                  label="Download Declaration Form (PDF)"
                  icon={<Download className="w-4 h-4" />}
                />
              </div>

              {/* Step 2 */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-800">
                    Step 2: Upload Completed Form
                  </h4>
                </div>
                <p className="mb-3 text-sm text-gray-600">
                  Upload the signed and completed declaration form below.
                </p>
                <label className="block mb-1 text-sm font-medium">
                  Completed Declaration Form
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange("declarationForm", e)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">Document Uploads</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Copy of Bank Passbook
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange("bankPassbook", e)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Photo/Scan of NIC
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange("nicCopy", e)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Updated CV
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange("cv", e)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                  accept=".pdf,.doc,.docx"
                />
              </div>

              {formData.studentType === "postgraduate" && (
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Degree Certificate or Transcript
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange("degreeCertificate", e)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="mt-1 text-xs text-amber-600">
                    Required for postgraduate students
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Submit Documents
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
