import React, { useState } from "react";
import { BookOpen, Eye, File } from "lucide-react";
import { Button } from "./ui/Button";
import TADetailedCard from "./TADetailedCard";
import TADocumentCard from "./TADocumentCard";

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
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "document pending":
        return "bg-bg-card text-primary-foreground";
      case "Rejected":
        return "bg-error text-accent-foreground";
      case "Accepted":
        return "bg-success text-card";
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);

  return (
    <>
      <div className="p-6 transition-all duration-300 border bg-gradient-to-br from-card to-muted/10 border-border/50 hover:shadow-lg">
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
                <div
                  className={`${getStatusColor(
                    status
                  )} mb-1 text-xs font-medium border-transparent hover:bg-primary-light/80 inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                >
                  {status}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {moduleName}
              </h3>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              icon={<File className="w-4 h-4" />}
              label="Submit Documents"
              onClick={() => setIsDocOpen(true)}
            ></Button>
            <Button
              icon={<Eye className="w-4 h-4" />}
              label="View Details"
              onClick={() => setIsOpen(true)}
            ></Button>
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
      {/* Document Submission Modal */}
      {isDocOpen && (
        <TADocumentCard
          isDocOpen={isDocOpen}
          onClose={() => setIsDocOpen(false)}
          position={{
            moduleCode,
            moduleName,
            coordinators,
            requiredTAHours,
          }}
        />
      )}
    </>
  );
};

export default TAAppliedCard;
