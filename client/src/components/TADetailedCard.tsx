import { Calendar, Clock, Users, File, Book, X } from "lucide-react";
import React from "react";

interface TADetailedCardProps {
  isOpen: boolean;
  onClose: () => void;
  details: {
    moduleCode: string;
    moduleName: string;
    coordinators: string[];
    requiredTAHours: number;
    requiredTANumber: number;
    appliedTANumber: number;
    requirements: string[];
    documentDueDate: string;
    applicationDueDate: string;
    appliedDate: string;
    status: string;
  } | null;
}

const TADetailedCard: React.FC<TADetailedCardProps> = ({
  isOpen,
  onClose,
  details,
}) => {
  if (!isOpen || !details) return null;

  const {
    moduleCode,
    moduleName,
    coordinators,
    requiredTAHours,
    requiredTANumber,
    appliedTANumber,
    requirements,
    documentDueDate,
    applicationDueDate,
    appliedDate,
    status,
  } = details;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              Application Details
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Module Info */}
        <div className="p-4 mb-6 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                {moduleCode}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-secondary/10 text-secondary">
                {status}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Applied on: {appliedDate}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{moduleName}</h2>
        </div>

        {/* Coordinators & Position */}
        <div className="grid gap-4 mb-6 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">
                Module Coordinators
              </h3>
            </div>
            <div className="space-y-1">
              {coordinators.map((c, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-1 mr-2 text-sm text-gray-700 bg-gray-100 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">Position Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Required Hours:</span>
                <span className="font-medium">{requiredTAHours} hrs/week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Required TAs:</span>
                <span className="font-medium">{requiredTANumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Applied TAs:</span>
                <span className="font-medium">{appliedTANumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deadlines */}
        <div className="p-4 mb-6 border rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-800">Important Deadlines</h3>
          </div>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="p-3 rounded-lg bg-primary/5">
              <p className="text-gray-500">Application Due Date</p>
              <p className="font-medium">{applicationDueDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/5">
              <p className="text-gray-500">Document Due Date</p>
              <p className="font-medium">{documentDueDate}</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <File className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-800">
              Position Requirements
            </h3>
          </div>
          <ul className="pl-5 space-y-1 text-sm text-gray-600 list-disc">
            {requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TADetailedCard;
