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
      return { status: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-100', canExpand: false };
    } else if (submittedCount === totalCount) {
      return { status: 'Complete', color: 'text-green-700', bgColor: 'bg-green-50', canExpand: true };
    } else {
      return { status: 'Partial', color: 'text-orange-700', bgColor: 'bg-orange-50', canExpand: false };
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Module Management Dashboard</h1>
          <p className="text-gray-600">Overview of all assigned modules and teaching assistant status</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {allModules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Module Header */}
              <div className="bg-gray-900 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-white font-semibold text-xl">{module.moduleCode}</h2>
                  <span className="bg-white text-gray-900 text-xs px-3 py-1 rounded-full font-medium">
                    {module.semester} {module.year}
                  </span>
                </div>
                <p className="text-gray-300 text-sm font-medium">{module.moduleName}</p>
              </div>

              {/* Module Content */}
              <div className="p-6 space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Hours per Week</p>
                      <p className="text-lg font-bold text-gray-900">{module.totalTAHours}h</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Assigned TAs</p>
                      <p className="text-lg font-bold text-gray-900">{module.assignedTAs.length}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-semibold text-gray-900">Assignment Progress</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 bg-gray-200 px-3 py-1 rounded-full">
                      {module.assignedTAs.length}/{module.totalTAsNeeded}
                    </p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(module.assignedTAs.length / module.totalTAsNeeded) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Teaching Assistants */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-4 h-4 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    Teaching Assistants
                  </h3>
                  
                  <div className="space-y-3">
                    {module.assignedTAs.map((ta, index) => {
                      const documentStatus = getDocumentStatus(ta);
                      const isExpanded = expandedTAs.has(`${moduleIndex}-${index}`);
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          {/* TA Header */}
                          <div className="p-4 border-l-4 border-gray-600 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{ta.name}</p>
                                  <p className="text-xs text-gray-600">{ta.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {documentStatus.status && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${documentStatus.bgColor} ${documentStatus.color} border`}>
                                    {documentStatus.status}
                                  </span>
                                )}
                                
                                {documentStatus.canExpand && (
                                  <button
                                    onClick={() => toggleTAExpansion(moduleIndex, index)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <svg 
                                      className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
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

                          {/* Documents Section */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-white">
                              <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                  <svg className="w-4 h-4 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  Required Documents
                                </h4>
                                
                                {/* NIC Copy */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">NIC Copy</span>
                                  </div>
                                  {ta.documents.nicCopy.submitted ? (
                                    <button 
                                      onClick={() => window.open(ta.documents.nicCopy.fileUrl, '_blank')}
                                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                      <span>View</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md border">Not submitted</span>
                                  )}
                                </div>

                                {/* Bank Passport Copy */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">Bank Passport Copy</span>
                                  </div>
                                  {ta.documents.bankPassportCopy.submitted ? (
                                    <button 
                                      onClick={() => window.open(ta.documents.bankPassportCopy.fileUrl, '_blank')}
                                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                      <span>View</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md border">Not submitted</span>
                                  )}
                                </div>

                                {/* Declaration Copy */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">Declaration Copy</span>
                                  </div>
                                  {ta.documents.declarationCopy.submitted ? (
                                    <button 
                                      onClick={() => window.open(ta.documents.declarationCopy.fileUrl, '_blank')}
                                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                      <span>View</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md border">Not submitted</span>
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
    </div>
  )
}

export default ViewModuleDetails
