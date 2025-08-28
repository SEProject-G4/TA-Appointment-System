import React, { useState } from "react";
import { FaChevronRight, FaUserGraduate, FaClipboardList } from "react-icons/fa";

interface ModuleDetails {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  assignedTAs: Array<{
    name: string;
    email: string;
    documents: {
      nicCopy: { submitted: boolean; fileUrl?: string; fileName?: string };
      bankPassportCopy: { submitted: boolean; fileUrl?: string; fileName?: string };
      declarationCopy: { submitted: boolean; fileUrl?: string; fileName?: string };
    };
  }>;
  totalTAHours: number;
  totalTAsNeeded: number;
}

const getDocumentStatus = (ta: ModuleDetails["assignedTAs"][0]) => {
  const submittedCount = Object.values(ta.documents).filter((doc) => doc.submitted).length;
  const totalCount = Object.keys(ta.documents).length;
  if (submittedCount === 0) {
    return { status: "Pending", badge: "badge-pending", canExpand: false };
  } else if (submittedCount === totalCount) {
    return { status: "Complete", badge: "badge-accepted", canExpand: true };
  } else {
    return { status: "Partial", badge: "badge-rejected", canExpand: false };
  }
};

const moduleData: ModuleDetails = {
  moduleCode: "CS101",
  moduleName: "Introduction to Computer Science",
  semester: "3rd Semester",
  year: "2024",
  assignedTAs: [
    {
      name: "John Doe",
      email: "john.doe@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: false },
        bankPassportCopy: { submitted: false },
        declarationCopy: { submitted: false },
      },
    },
    {
      name: "Jane Smith",
      email: "jane.smith@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_jane.pdf", fileName: "nic_jane.pdf" },
        bankPassportCopy: { submitted: true, fileUrl: "/files/passport_jane.pdf", fileName: "passport_jane.pdf" },
        declarationCopy: { submitted: true, fileUrl: "/files/declaration_jane.pdf", fileName: "declaration_jane.pdf" },
      },
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_mike.pdf", fileName: "nic_mike.pdf" },
        bankPassportCopy: { submitted: true, fileUrl: "/files/passport_mike.pdf", fileName: "passport_mike.pdf" },
        declarationCopy: { submitted: true, fileUrl: "/files/declaration_mike.pdf", fileName: "declaration_mike.pdf" },
      },
    },
  ],
  totalTAHours: 18,
  totalTAsNeeded: 3,
};

const moduleData2: ModuleDetails = {
  moduleCode: "CS301",
  moduleName: "Introduction to Machine Learning",
  semester: "5th Semester",
  year: "2024",
  assignedTAs: [
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_sarah.pdf", fileName: "nic_sarah.pdf" },
        bankPassportCopy: { submitted: true, fileUrl: "/files/passport_sarah.pdf", fileName: "passport_sarah.pdf" },
        declarationCopy: { submitted: true, fileUrl: "/files/declaration_sarah.pdf", fileName: "declaration_sarah.pdf" },
      },
    },
    {
      name: "David Chen",
      email: "david.chen@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_david.pdf", fileName: "nic_david.pdf" },
        bankPassportCopy: { submitted: false },
        declarationCopy: { submitted: true, fileUrl: "/files/declaration_david.pdf", fileName: "declaration_david.pdf" },
      },
    },
  ],
  totalTAHours: 15,
  totalTAsNeeded: 3,
};

const moduleData3: ModuleDetails = {
  moduleCode: "CS401",
  moduleName: "Introduction to Artificial Intelligence",
  semester: "7th Semester",
  year: "2024",
  assignedTAs: [
    {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_emily.pdf", fileName: "nic_emily.pdf" },
        bankPassportCopy: { submitted: true, fileUrl: "/files/passport_emily.pdf", fileName: "passport_emily.pdf" },
        declarationCopy: { submitted: true, fileUrl: "/files/declaration_emily.pdf", fileName: "declaration_emily.pdf" },
      },
    },
    {
      name: "Alex Thompson",
      email: "alex.thompson@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: false },
        bankPassportCopy: { submitted: false },
        declarationCopy: { submitted: false },
      },
    },
    {
      name: "Lisa Park",
      email: "lisa.park@cse.mrt.ac.lk",
      documents: {
        nicCopy: { submitted: true, fileUrl: "/files/nic_lisa.pdf", fileName: "nic_lisa.pdf" },
        bankPassportCopy: { submitted: true, fileUrl: "/files/passport_lisa.pdf", fileName: "passport_lisa.pdf" },
        declarationCopy: { submitted: false },
      },
    },
  ],
  totalTAHours: 20,
  totalTAsNeeded: 4,
};

const allModules = [moduleData, moduleData2, moduleData3];

const ViewModuleDetails: React.FC = () => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const toggleModuleExpansion = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">View Module Details</h1>
          <p className="text-text-secondary font-raleway">Overview of all assigned modules and teaching assistant status</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary border border-border-default hover:bg-gray-50'
            }`}
          >
            List view
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'card'
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary border border-border-default hover:bg-gray-50'
            }`}
          >
            Card view
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        // List View
        <div className="w-full space-y-4">
          {allModules.map((module, moduleIndex) => {
            const isOpen = expandedModules.has(moduleIndex);
            return (
              <div key={moduleIndex} className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
                {/* Module Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleModuleExpansion(moduleIndex)}
                >
                  <div className="flex items-center space-x-4">
                    <FaChevronRight 
                      className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <div>
                <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-text-primary">{module.moduleCode}</h2>
                        <span className="bg-primary/10 text-primary-dark text-xs px-3 py-1 rounded-full font-medium">
                    {module.semester} {module.year}
                  </span>
                </div>
                      <p className="text-text-secondary text-sm mt-1">{module.moduleName}</p>
                    </div>
              </div>
                  <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-xs text-text-secondary">TA Hours</div>
                  <div className="text-lg font-semibold text-text-primary">{module.totalTAHours}h</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary">Assigned TAs</div>
                  <div className="text-lg font-semibold text-text-primary">{module.assignedTAs.length}</div>
                </div>
              </div>
            </div>

                {/* Expanded Content */}
                <div className={`panel ${isOpen ? 'panel-open' : 'panel-closed'} border-t border-border-default`}>
            <div className="p-4 space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FaClipboardList className="w-4 h-4 text-primary-dark" />
                  <span className="text-sm font-semibold text-text-primary">Assignment Progress</span>
                </div>
                <span className="text-sm font-bold text-text-primary bg-bg-page px-3 py-1 rounded-full">
                  {module.assignedTAs.length}/{module.totalTAsNeeded}
                </span>
              </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-500"
                  style={{ width: `${(module.assignedTAs.length / module.totalTAsNeeded) * 100}%` }}
                />
              </div>

              {/* TA List */}
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center">
                  <FaUserGraduate className="w-4 h-4 text-primary-dark mr-2" />
                  Teaching Assistants
                </h3>
                      <div className="space-y-3">
                  {module.assignedTAs.map((ta, taIndex) => {
                    const documentStatus = getDocumentStatus(ta);
                    return (
                            <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                              <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-text-primary">{ta.name}</span>
                              <span className="text-xs text-text-secondary">{ta.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`badge ${documentStatus.badge}`}>{documentStatus.status}</span>
                          </div>
                        </div>
                              
                              {/* Document Details */}
                              <div className="mt-3 space-y-2">
                                <h4 className="text-sm font-semibold text-text-primary">Required Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {/* NIC Copy */}
                                  <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
                                <span className="text-sm font-medium text-text-primary">NIC Copy</span>
                                {ta.documents.nicCopy.submitted ? (
                                  <button
                                    onClick={() => window.open(ta.documents.nicCopy.fileUrl, "_blank")}
                                    className="btn btn-primary btn-xs"
                                  >
                                    View
                                  </button>
                                ) : (
                                  <span className="badge badge-pending">Not submitted</span>
                                )}
                              </div>
                              {/* Bank Passport Copy */}
                                  <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
                                <span className="text-sm font-medium text-text-primary">Bank Passport Copy</span>
                                {ta.documents.bankPassportCopy.submitted ? (
                                  <button
                                    onClick={() => window.open(ta.documents.bankPassportCopy.fileUrl, "_blank")}
                                    className="btn btn-primary btn-xs"
                                  >
                                    View
                                  </button>
                                ) : (
                                  <span className="badge badge-pending">Not submitted</span>
                                )}
                              </div>
                              {/* Declaration Copy */}
                                  <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
                                <span className="text-sm font-medium text-text-primary">Declaration Copy</span>
                                {ta.documents.declarationCopy.submitted ? (
                                  <button
                                    onClick={() => window.open(ta.documents.declarationCopy.fileUrl, "_blank")}
                                    className="btn btn-primary btn-xs"
                                  >
                                    View
                                  </button>
                                ) : (
                                  <span className="badge badge-pending">Not submitted</span>
                                )}
                              </div>
                            </div>
                          </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {allModules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="p-4 border-b border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-bold text-text-primary">{module.moduleCode}</h2>
                    <span className="bg-primary/10 text-primary-dark text-xs px-3 py-1 rounded-full font-medium">
                      {module.semester} {module.year}
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-3">{module.moduleName}</p>
                <div className="w-full h-px bg-border-default"></div>
              </div>

              <div className="p-4 space-y-4">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FaClipboardList className="w-4 h-4 text-primary-dark" />
                    <span className="text-sm font-semibold text-text-primary">Assignment Progress</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary bg-bg-page px-3 py-1 rounded-full">
                    {module.assignedTAs.length}/{module.totalTAsNeeded}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-500"
                    style={{ width: `${(module.assignedTAs.length / module.totalTAsNeeded) * 100}%` }}
                  />
                </div>

                {/* TA Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">TA Hours</div>
                    <div className="text-lg font-semibold text-text-primary">{module.totalTAHours}h</div>
                  </div>
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">Assigned TAs</div>
                    <div className="text-lg font-semibold text-text-primary">{module.assignedTAs.length}</div>
                  </div>
                </div>

                {/* TA List */}
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center">
                    <FaUserGraduate className="w-4 h-4 text-primary-dark mr-2" />
                    Teaching Assistants
                  </h3>
                  <div className="space-y-2">
                    {module.assignedTAs.map((ta, taIndex) => {
                      const documentStatus = getDocumentStatus(ta);
                      return (
                        <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-text-primary">{ta.name}</span>
                                <span className="text-xs text-text-secondary">{ta.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`badge ${documentStatus.badge}`}>{documentStatus.status}</span>
                            </div>
                          </div>
                          
                          {/* Document Summary */}
                          <div className="mt-2">
                            <div className="text-xs text-text-secondary">Documents: {
                              Object.values(ta.documents).filter(doc => doc.submitted).length
                            }/3 submitted</div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ViewModuleDetails;
