import React, { useState } from "react";
import { BookOpen, Users, Clock } from "lucide-react";
import { Button } from "./ui/Button";

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
}) => {
  const progressPercentage = (appliedTANumber / requiredTANumber) * 100;
  const isFullyFilled = appliedTANumber >= requiredTANumber;
  const [loading, setLoading] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = async() => {
    const confirmApply = window.confirm(
      `Are you sure you want to apply for ${moduleCode} - ${moduleName}?`
    );
    if (!confirmApply) return;
    try{
      setLoading(true);
      await onApply();
      setIsApplied(true);
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application:", error.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="w-full p-6 mb-4 transition-all duration-300 border-2 bg-gradient-to-br from-card to-muted/20 border-border/50 hover:shadow-lg hover:-translate-y-1">
      {/* Card content goes here */}
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

          {/* co-ordinators */}
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
                    {requirements}
                  </span>
                </div>
              ))} 
            </div>
          </div>
          {/* <button className="w-full h-8 font-medium transition-all duration-300 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary-glow hover:to-accent text-text-primary hover:shadow-md hover:scale-105">
            Apply Now
          </button> */}
            <Button
            label={isApplied ? "Applied" : "Apply Now"}
            onClick={handleApply}
            disabled={isApplied || isFullyFilled || loading}
          >
          </Button>  
        </div>
      </div>
    </div>
  );
};

export default TARequestCard;
