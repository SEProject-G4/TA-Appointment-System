import React, { useState } from 'react'

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

const ViewModuleDetails: React.FC = () => {
  const [expandedTAs, setExpandedTAs] = useState<Set<number>>(new Set());

  const toggleTAExpansion = (index: number) => {
    const newExpanded = new Set(expandedTAs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTAs(newExpanded);
  };

  const getDocumentStatus = (ta: ModuleDetails['assignedTAs'][0]) => {
    const submittedCount = Object.values(ta.documents).filter(doc => doc.submitted).length;
    const totalCount = Object.keys(ta.documents).length;
    
    if (submittedCount === 0) {
      return { status: 'Not submitted', color: 'text-error', bgColor: 'bg-error/10', canExpand: false };
    } else if (submittedCount === totalCount) {
      return { status: '', color: '', bgColor: '', canExpand: true };
    } else {
      return { status: 'Not submitted', color: 'text-error', bgColor: 'bg-error/10', canExpand: false };
    }
  };

  // Mock data - replace with actual data from API
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
          declarationCopy: { submitted: false }
        }
      },
      { 
        name: "Jane Smith", 
        email: "jane.smith@cse.mrt.ac.lk",
        documents: {
          nicCopy: { submitted: true, fileUrl: "/files/nic_jane.pdf", fileName: "nic_jane.pdf" },
          bankPassportCopy: { submitted: true, fileUrl: "/files/passport_jane.pdf", fileName: "passport_jane.pdf" },
          declarationCopy: { submitted: true, fileUrl: "/files/declaration_jane.pdf", fileName: "declaration_jane.pdf" }
        }
      },
      { 
        name: "Mike Johnson", 
        email: "mike.johnson@cse.mrt.ac.lk",
        documents: {
          nicCopy: { submitted: true, fileUrl: "/files/nic_mike.pdf", fileName: "nic_mike.pdf" },
          bankPassportCopy: { submitted: true, fileUrl: "/files/passport_mike.pdf", fileName: "passport_mike.pdf" },
          declarationCopy: { submitted: true, fileUrl: "/files/declaration_mike.pdf", fileName: "declaration_mike.pdf" }
        }
      }
    ],
    totalTAHours: 18,
    totalTAsNeeded: 5,
  };

  return (
    <div className="space-y-6">      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="max-w-sm mx-auto bg-bg-card rounded-xl shadow-lg overflow-hidden border border-border-default hover:shadow-xl transition-shadow duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary px-4 py-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-text-inverted font-bold text-lg">{moduleData.moduleCode}</h2>
                <span className="bg-bg-card bg-opacity-20 text-text-inverted text-xs px-2 py-1 rounded-full">
                  {moduleData.semester} {moduleData.year}
                </span>
              </div>
              <p className="text-text-secondary font-bold text-sm mt-1">{moduleData.moduleName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* TA Hours Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-info bg-opacity-10 rounded-lg p-3 border border-info/20">
              <div className="text-center">
                {/* <div className="w-8 h-8 bg-info bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div> */}
                <p className="text-xs text-text-primary mb-1">Hours per Week</p>
                <p className="text-lg font-bold text-text-primary">{moduleData.totalTAHours}h</p>
              </div>
            </div>

            <div className="bg-success bg-opacity-10 rounded-lg p-3 border border-success/20">
              <div className="text-center">
                {/* <div className="w-8 h-8 bg-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div> */}
                <p className="text-xs text-text-primary mb-1">Assigned TAs</p>
                <p className="text-lg font-bold text-text-primary">{moduleData.assignedTAs.length}</p>
              </div>
            </div>
          </div>

          {/* TA Progress Bar */}
          <div className="bg-bg-page rounded-lg p-3 border border-border-default">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-text-primary">TA Assignment Progress</p>
              </div>
              <p className="text-xs text-text-primary">{moduleData.assignedTAs.length}/{moduleData.totalTAsNeeded} TAs</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out relative"
                style={{ width: `${(moduleData.assignedTAs.length / moduleData.totalTAsNeeded) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Assigned TAs Section */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
              <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Assigned Teaching Assistants
            </h3>
            
            <div className="space-y-2">
              {moduleData.assignedTAs.map((ta, index) => {
                const documentStatus = getDocumentStatus(ta);
                const isExpanded = expandedTAs.has(index);
                
                return (
                <div key={index} className="bg-bg-page rounded-lg border border-border-default overflow-hidden">
                    {/* TA Header - Always visible */}
                    <div className="p-3 border-l-4 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-light bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        <div>
                            <p className="text-sm font-semibold text-text-primary">{ta.name}</p>
                            <p className="text-xs text-text-primary">{ta.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Document Status - Only show if there's a status */}
                          {documentStatus.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${documentStatus.color} ${documentStatus.bgColor}`}>
                              {documentStatus.status}
                            </span>
                          )}
                          
                          {/* Expand/Collapse Button - Only show if all documents are submitted */}
                          {documentStatus.canExpand && (
                            <button
                              onClick={() => toggleTAExpansion(index)}
                              className="p-1 hover:bg-bg-card rounded-full transition-colors duration-200"
                            >
                              <svg 
                                className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Documents Section */}
                    {isExpanded && (
                      <div className="border-t border-border-default bg-bg-card/50">
                        <div className="p-3 space-y-2">
                          <h4 className="text-xs font-semibold text-text-primary mb-2">Required Documents</h4>
                          
                          {/* NIC Copy */}
                          <div className="flex items-center justify-between p-2 bg-bg-page rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-info" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-text-primary">NIC Copy</span>
                            </div>
                            {ta.documents.nicCopy.submitted ? (
                              <button 
                                onClick={() => window.open(ta.documents.nicCopy.fileUrl, '_blank')}
                                className="flex items-center space-x-2 px-3 py-1 bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-xs text-error">Not submitted</span>
                            )}
                          </div>

                          {/* Bank Passport Copy */}
                          <div className="flex items-center justify-between p-2 bg-bg-page rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-warning bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-text-primary">Bank Passport Copy</span>
                            </div>
                            {ta.documents.bankPassportCopy.submitted ? (
                              <button 
                                onClick={() => window.open(ta.documents.bankPassportCopy.fileUrl, '_blank')}
                                className="flex items-center space-x-2 px-3 py-1 bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-xs text-error">Not submitted</span>
                            )}
                          </div>

                          {/* Declaration Copy */}
                          <div className="flex items-center justify-between p-2 bg-bg-page rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-text-primary">Declaration Copy</span>
                            </div>
                            {ta.documents.declarationCopy.submitted ? (
                              <button 
                                onClick={() => window.open(ta.documents.declarationCopy.fileUrl, '_blank')}
                                className="flex items-center space-x-2 px-3 py-1 bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-xs text-error">Not submitted</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default ViewModuleDetails
