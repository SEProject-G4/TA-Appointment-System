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
  const [expandedTAs, setExpandedTAs] = useState<Set<string>>(new Set());

  const toggleTAExpansion = (moduleIndex: number, taIndex: number) => {
    const key = `${moduleIndex}-${taIndex}`;
    const newExpanded = new Set(expandedTAs);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
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
          declarationCopy: { submitted: true, fileUrl: "/files/declaration_sarah.pdf", fileName: "declaration_sarah.pdf" }
        }
      },
      { 
        name: "David Chen", 
        email: "david.chen@cse.mrt.ac.lk",
        documents: {
          nicCopy: { submitted: true, fileUrl: "/files/nic_david.pdf", fileName: "nic_david.pdf" },
          bankPassportCopy: { submitted: false },
          declarationCopy: { submitted: true, fileUrl: "/files/declaration_david.pdf", fileName: "declaration_david.pdf" }
        }
      }
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
          declarationCopy: { submitted: true, fileUrl: "/files/declaration_emily.pdf", fileName: "declaration_emily.pdf" }
        }
      },
      { 
        name: "Alex Thompson", 
        email: "alex.thompson@cse.mrt.ac.lk",
        documents: {
          nicCopy: { submitted: false },
          bankPassportCopy: { submitted: false },
          declarationCopy: { submitted: false }
        }
      },
      { 
        name: "Lisa Park", 
        email: "lisa.park@cse.mrt.ac.lk",
        documents: {
          nicCopy: { submitted: true, fileUrl: "/files/nic_lisa.pdf", fileName: "nic_lisa.pdf" },
          bankPassportCopy: { submitted: true, fileUrl: "/files/passport_lisa.pdf", fileName: "passport_lisa.pdf" },
          declarationCopy: { submitted: false }
        }
      }
    ],
    totalTAHours: 20,
    totalTAsNeeded: 4,
  };

  const allModules = [moduleData, moduleData2, moduleData3];

  return (
    <div className="space-y-8 mt-6 px-4 md:px-6 lg:px-8">      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allModules.map((module, moduleIndex) => (
                     <div key={moduleIndex} className="w-full bg-bg-card rounded-3xl shadow-xl border border-border-default overflow-hidden">
            {/* Header */}
                         <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light px-6 py-4 relative overflow-hidden rounded-t-3xl">
               <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-text-inverted font-bold text-2xl tracking-tight">{module.moduleCode}</h2>
                  <span className="bg-white bg-opacity-25 backdrop-blur-sm text-text-inverted text-xs px-3 py-1.5 rounded-full font-medium border border-white/20">
                    {module.semester} {module.year}
                  </span>
                </div>
                <p className="text-text-inverted font-semibold text-base leading-tight">{module.moduleName}</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* TA Hours Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-info/5 to-info/10 rounded-xl p-4 border border-info/20 hover:border-info/30 transition-colors duration-200">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-info/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-text-secondary mb-1 font-medium">Hours per Week</p>
                    <p className="text-xl font-bold text-text-primary">{module.totalTAHours}h</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-xl p-4 border border-success/20 hover:border-success/30 transition-colors duration-200">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-text-secondary mb-1 font-medium">Assigned TAs</p>
                    <p className="text-xl font-bold text-text-primary">{module.assignedTAs.length}</p>
                  </div>
                </div>
              </div>

                             {/* TA Progress Bar */}
               <div className="bg-bg-page rounded-xl p-4 border border-border-default/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">TA Assignment Progress</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary bg-primary/10 px-3 py-1 rounded-full">{module.assignedTAs.length}/{module.totalTAsNeeded} TAs</p>
                </div>
                
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary-light h-3 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${(module.assignedTAs.length / module.totalTAsNeeded) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Assigned TAs Section */}
              <div>
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  Assigned Teaching Assistants
                </h3>
                
                <div className="space-y-3">
                  {module.assignedTAs.map((ta, index) => {
                    const documentStatus = getDocumentStatus(ta);
                    const isExpanded = expandedTAs.has(`${moduleIndex}-${index}`);
                    
                    return (
                                         <div key={index} className="bg-bg-page rounded-xl border border-border-default/60 overflow-hidden">
                        {/* TA Header - Always visible */}
                                                 <div className="p-4 border-l-4 border-primary/40 bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                                             <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">{ta.name}</p>
                                <p className="text-xs text-text-secondary">{ta.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {/* Document Status - Only show if there's a status */}
                              {documentStatus.status && (
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold bg-warning/10 text-warning ${documentStatus.color} ${documentStatus.bgColor} border border-current/20`}>
                                  {documentStatus.status}
                                </span>
                              )}
                              
                              {/* Expand/Collapse Button - Only show if all documents are submitted */}
                              {documentStatus.canExpand && (
                                                                 <button
                                   onClick={() => toggleTAExpansion(moduleIndex, index)}
                                   className="p-2 hover:bg-primary/10 rounded-full transition-all duration-200"
                                 >
                                  <svg 
                                    className={`w-4 h-4 text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
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
                                                     <div className="border-t border-border-default/60 bg-bg-card/30">
                            <div className="p-4 space-y-3">
                              <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center">
                                <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                Required Documents
                              </h4>
                              
                              {/* NIC Copy */}
                                                             <div className="flex items-center justify-between p-3 bg-bg-page rounded-lg border border-border-default/40">
                                <div className="flex items-center space-x-3">
                                                                     <div className="w-7 h-7 bg-info/20 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-text-primary">NIC Copy</span>
                                </div>
                                {ta.documents.nicCopy.submitted ? (
                                  <button 
                                    onClick={() => window.open(ta.documents.nicCopy.fileUrl, '_blank')}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-success/10 to-success/20 text-success rounded-lg hover:from-success/20 hover:to-success/30 transition-all duration-200 border border-success/20 hover:border-success/30 hover:scale-105"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-medium">View</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-error font-medium bg-error/10 px-3 py-2 rounded-lg border border-error/20">Not submitted</span>
                                )}
                              </div>

                                                             {/* Bank Passport Copy */}
                                                               <div className="flex items-center justify-between p-3 bg-bg-page rounded-lg border border-border-default/40">
                                 <div className="flex items-center space-x-3">
                                                                       <div className="w-7 h-7 bg-warning/20 rounded-full flex items-center justify-center">
                                     <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                   <span className="text-sm font-semibold text-text-primary">Bank Passport Copy</span>
                                 </div>
                                 {ta.documents.bankPassportCopy.submitted ? (
                                   <button 
                                     onClick={() => window.open(ta.documents.bankPassportCopy.fileUrl, '_blank')}
                                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-success/10 to-success/20 text-success rounded-lg hover:from-success/20 hover:to-success/30 transition-all duration-200 border border-success/20 hover:border-success/30 hover:scale-105"
                                   >
                                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                     </svg>
                                     <span className="text-xs font-medium">View</span>
                                   </button>
                                 ) : (
                                   <span className="text-xs text-error font-medium bg-error/10 px-3 py-2 rounded-lg border border-error/20">Not submitted</span>
                                 )}
                               </div>

                               {/* Declaration Copy */}
                                                               <div className="flex items-center justify-between p-3 bg-bg-page rounded-lg border border-border-default/40">
                                 <div className="flex items-center space-x-3">
                                                                       <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                                     <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                   <span className="text-sm font-semibold text-text-primary">Declaration Copy</span>
                                 </div>
                                 {ta.documents.declarationCopy.submitted ? (
                                   <button 
                                     onClick={() => window.open(ta.documents.declarationCopy.fileUrl, '_blank')}
                                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-success/10 to-success/20 text-success rounded-lg hover:from-success/20 hover:to-success/30 transition-all duration-200 border border-success/20 hover:border-success/30 hover:scale-105"
                                   >
                                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                     </svg>
                                     <span className="text-xs font-medium">View</span>
                                   </button>
                                 ) : (
                                   <span className="text-xs text-error font-medium bg-error/10 px-3 py-2 rounded-lg border border-error/20">Not submitted</span>
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
        ))}
      </div>
    </div>
  )
}

export default ViewModuleDetails
