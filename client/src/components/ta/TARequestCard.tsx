import React, { useState } from "react";
import { BookOpen, Users, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface TARequestCardProps {
  moduleCode: string;
  moduleName: string;
  coordinators: string[];
  requiredTAHours: number;
  requiredTANumber: number;
  appliedTANumber: number;
  requirements: string[];
  documentDueDate: string;
  applicationDueDate: string;
  onApply: () => Promise<void>;
  isApplied?: boolean;
  viewMode?: 'cards' | 'list';
}

const TARequestCard: React.FC<TARequestCardProps> = ({
  moduleCode,
  moduleName,
  coordinators,
  requiredTAHours,
  appliedTANumber,
  requirements,
  requiredTANumber,
  documentDueDate,
  applicationDueDate,
  onApply,
  viewMode = 'list',
}) => {
  const progressPercentage = (appliedTANumber / requiredTANumber) * 100;
  const isFullyFilled = appliedTANumber >= requiredTANumber;
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const {showToast} = useToast();

  const handleApply = async() => {
    try{
      setLoading(true); 
      await onApply();
      showToast("Application submitted successfully!", "success");
    } catch (error) {
      console.error("Error submitting application:", error);
      showToast("Error submitting application. Please try again.", "error");
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  }

  // Card View Layout
  if (viewMode === 'cards') {
    return (
      <>
      <div className="w-full p-4 sm:p-6 duration-300 border rounded-lg shadow-sm bg-bg-card hover:shadow-md border-border/50 outline-dashed outline-1">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="text-xs font-medium border-transparent bg-bg-card text-text-secondary hover:bg-primary-light/80 inline-flex items-center rounded-full border px-2 sm:px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0">
              {moduleCode}
            </div>
          </div>
          <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold leading-tight text-foreground">
            {moduleName}
          </h3>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-text-secondary">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>{requiredTAHours} hours/week</span>
        </div>

        {/* Progress */}
        <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-600">Positions</span>
            <span className={`text-xs sm:text-sm font-semibold ${
              isFullyFilled ? "text-green-600" : "text-blue-600"
            }`}>
              {appliedTANumber} / {requiredTANumber}
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full">
            <div
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                isFullyFilled ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Dates */}
        <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">App Due:</span>
            <span className="font-semibold text-red-600 text-xs sm:text-sm">{applicationDueDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Doc Due:</span>
            <span className="font-semibold text-orange-600 text-xs sm:text-sm">{documentDueDate}</span>
          </div>
        </div>

        {/* Coordinators */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-muted-foreground">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>Coordinators</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {coordinators.slice(0, 2).map((coordinator, index) => (
              <div
                key={index}
                className="text-text-primary inline-flex items-center rounded-full border px-1.5 sm:px-2 py-0.5 text-xs font-semibold"
              >
                {coordinator}
              </div>
            ))}
            {coordinators.length > 2 && (
              <div className="text-text-secondary inline-flex items-center rounded-full border px-1.5 sm:px-2 py-0.5 text-xs">
                +{coordinators.length - 2} more
              </div>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-4 sm:mb-6">
          <h4 className="mb-2 text-xs sm:text-sm font-medium text-foreground">
            Requirements
          </h4>
          <div className="space-y-1">
            {requirements.slice(0, 2).map((requirement, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {requirement}
                </span>
              </div>
            ))}
            {requirements.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{requirements.length - 2} more requirements
              </div>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <Button
          label="Apply Now"
          onClick={() => setConfirmDialogOpen(true)}
          disabled={loading}
        />
      </div>
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Confirm Application?"
        message={`This action cannot be undone. Once confirmed, your application will be submitted as a TA for ${moduleCode} – ${moduleName}.`}
        onConfirm={handleApply}
        onCancel={() => setConfirmDialogOpen(false)}
      />
      </>
    );
  }

  // List View Layout (Original)
  return (
    <>
    <div className="w-full p-6 mb-4 transition-all duration-300 rounded-md shadow-sm outline-dashed outline-1 bg-bg-card hover:shadow-md">
      <div className="grid items-center grid-cols-12 gap-6">
        {/* left */}
        <div className="col-span-12 space-y-3 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium border-transparent bg-bg-card text-text-secondary hover:bg-primary-light/80 inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                {moduleCode}
              </div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">
                {moduleName}
              </h3>
            </div>
          </div>

          {/* coordinators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Coordinators:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {coordinators.map((coordinator, index) => (
                <div
                  key={index}
                  className="text-text-primary inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {coordinator}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* middle */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="w-4 h-4" />
            <span>{requiredTAHours} hours/week</span>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Application Progress
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Positions Filled</span>
                <span
                  className={`text-sm font-semibold ${
                    isFullyFilled ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {appliedTANumber} / {requiredTANumber}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isFullyFilled ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="mb-1 text-xs text-gray-500">Application Due</div>
                <div className="font-semibold text-red-600">{applicationDueDate}</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Document Due</div>
                <div className="font-semibold text-orange-600">{documentDueDate}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* right */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-foreground">
              Requirements
            </h4>
            <div className="space-y-1">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-start gap-2"> 
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-muted-foreground">
                    {requirement}
                  </span>
                </div>
              ))} 
            </div>
          </div>
          
          <Button
            label="Apply Now"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={loading}
          />  
        </div>
      </div>
    </div>
    <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Confirm Application?"
        message={`This action cannot be undone. Once confirmed, your application will be submitted as a TA for ${moduleCode} – ${moduleName}.`}
        onConfirm={handleApply}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </>
  );
};

export default TARequestCard;