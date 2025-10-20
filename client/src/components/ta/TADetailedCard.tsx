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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 sm:p-4">
      <div className="bg-bg-card rounded-lg shadow-xl w-full max-w-3xl p-4 sm:p-6 relative overflow-y-auto max-h-[95vh] sm:max-h-[90vh] border border-border-default/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b sm:pb-4 sm:mb-6 border-border-default/50">
          <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Book className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-lg font-semibold truncate sm:text-xl text-text-primary">
              Application Details
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 transition rounded-full hover:bg-primary-light/20 flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
          </button>
        </div>

        {/* Module Info */}
        <div className="p-3 mb-4 border rounded-lg sm:p-4 sm:mb-6 border-border-default/50 bg-primary-light/10">
          <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full sm:px-3 sm:text-sm bg-primary/10 text-primary">
                {moduleCode}
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-full sm:px-3 sm:text-sm bg-secondary/10 text-secondary">
                {status}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-text-secondary">
              Applied on: {appliedDate}
            </span>
          </div>
          <h2 className="text-base font-semibold sm:text-lg text-text-primary">{moduleName}</h2>
        </div>

        {/* Coordinators & Position */}
        <div className="grid gap-3 mb-4 sm:gap-4 sm:mb-6 lg:grid-cols-2">
          <div className="p-3 border rounded-lg sm:p-4 border-border-default/50 bg-bg-card">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Users className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="text-sm font-semibold sm:text-base text-text-primary">
                Module Coordinators
              </h3>
            </div>
            <div className="space-y-1">
              {coordinators.map((c, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-1 mb-1 mr-2 text-xs rounded sm:text-sm text-text-primary bg-primary-light/10"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 border rounded-lg sm:p-4 border-border-default/50 bg-bg-card">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Clock className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="text-sm font-semibold sm:text-base text-text-primary">Position Details</h3>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Required Hours:</span>
                <span className="font-medium text-text-primary">{requiredTAHours} hrs/week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Required TAs:</span>
                <span className="font-medium text-text-primary">{requiredTANumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Applied TAs:</span>
                <span className="font-medium text-text-primary">{appliedTANumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deadlines */}
        <div className="p-3 mb-4 border rounded-lg sm:p-4 sm:mb-6 border-border-default/50 bg-bg-card">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Calendar className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h3 className="text-sm font-semibold sm:text-base text-text-primary">Important Deadlines</h3>
          </div>
          <div className="grid gap-3 text-xs sm:gap-4 sm:text-sm lg:grid-cols-2">
            <div className="p-2 border rounded-lg sm:p-3 bg-primary-light/10 border-border-default/50">
              <p className="text-text-secondary">Application Due Date</p>
              <p className="font-medium text-text-primary">{applicationDueDate}</p>
            </div>
            <div className="p-2 border rounded-lg sm:p-3 bg-primary-light/10 border-border-default/50">
              <p className="text-text-secondary">Document Due Date</p>
              <p className="font-medium text-text-primary">{documentDueDate}</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="p-3 border rounded-lg sm:p-4 border-border-default/50 bg-bg-card">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <File className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h3 className="text-sm font-semibold sm:text-base text-text-primary">
              Position Requirements
            </h3>
          </div>
          <ul className="pl-4 space-y-1 text-xs list-disc sm:pl-5 sm:text-sm text-text-secondary">
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
