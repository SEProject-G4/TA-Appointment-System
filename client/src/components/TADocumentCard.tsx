import { FileText, GraduationCap, Upload, User, X } from "lucide-react";
import React, { useState } from "react";

interface DocumentSubmissionModalProps {
  isDocOpen: boolean;
  onClose: () => void;
  position: {
    moduleCode: string;
    moduleName: string;
    coordinators: string[];
    requiredTAHours: number;
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
            <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
              <div>
                <p className="text-gray-500">Module Code</p>
                <p className="font-medium">{position.moduleCode}</p>
              </div>
              <div>
                <p className="text-gray-500">Subject</p>
                <p className="font-medium">{position.moduleName}</p>
              </div>
              <div>
                <p className="text-gray-500">Lecturers</p>
                <p>{position.coordinators.join(", ")}</p>
              </div>
              <div>
                <p className="text-gray-500">Hours per Week</p>
                <p className="font-medium">{position.requiredTAHours} hours</p>
              </div>
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
              <div >
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

          {/* Document Uploads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">
                Document Uploads
              </h3>
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
