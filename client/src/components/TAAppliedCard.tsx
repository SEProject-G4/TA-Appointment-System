import React, { useState } from "react";
import { BookOpen, Eye, Calendar } from "lucide-react";
import { Button } from "./ui/Button";
import TADetailedCard from "./TADetailedCard";

interface AppliedRequestProps {
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
  viewMode?: 'cards' | 'list';
}

const TAAppliedCard: React.FC<AppliedRequestProps> = ({
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
  viewMode = 'list',
}) => {

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  // Card View Layout - Simplified
  if (viewMode === 'cards') {
    return (
      <>
        <div className="w-full max-w-sm p-6 transition-all duration-300 border rounded-lg shadow-sm bg-bg-card hover:shadow-md border-border/50">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs font-medium border-transparent bg-bg-card text-text-secondary hover:bg-primary-light/80 inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                {moduleCode}
              </div>
            </div>
            <h3 className="mb-3 text-lg font-semibold leading-tight text-foreground">
              {moduleName}
            </h3>
            
            {/* Status Badge */}
            <div className={`${getStatusColor(status)} text-sm font-medium inline-flex items-center rounded-full px-3 py-1.5 border mb-4`}>
              {status}
            </div>
          </div>

          {/* Applied Date */}
          <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span>Applied: {appliedDate}</span>
          </div>

          {/* View Details Button */}
          <Button
            
            label="View Details"
            onClick={() => setIsOpen(true)}
          />
        </div>

        {/* Detailed Card / Modal */}
        {isOpen && (
          <TADetailedCard
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            details={{
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
            }}
          />
        )}
      </>
    );
  }

  // List View Layout (Enhanced Original)
  return (
    <>
      <div className="p-6 mb-4 transition-all duration-300 border rounded-lg bg-gradient-to-br from-card to-muted/10 border-border/50 hover:shadow-lg">
        <div className="flex items-center justify-between">
          {/* Application Info */}
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="mb-1 text-xs font-medium border-transparent bg-bg-card text-text-secondary hover:bg-primary-light/80 inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {moduleCode}
                </div>
                <div className={`${getStatusColor(status)} text-xs font-medium inline-flex items-center rounded-full px-3 py-1 border`}>
                  {status}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {moduleName}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Applied: {appliedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              label="View Details"
              onClick={() => setIsOpen(true)}
            />    
          </div>
        </div>
      </div>

      {/* Detailed Card / Modal */}
      {isOpen && (
        <TADetailedCard
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          details={{
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
          }}
        />
      )}
    </>
  );
};

export default TAAppliedCard;