import React, { useState } from 'react'

interface ModuleEditData {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  requiredTAHoursPerWeek: number;
  numberOfRequiredTAs: number;
  requirements: string;
}

const EditModuleDetails: React.FC = () => {
  // Mock data - replace with actual data from API
  const [moduleData, setModuleData] = useState<ModuleEditData>({
    moduleCode: "CS101",
    moduleName: "Introduction to Computer Science",
    semester: "3rd Semester",
    year: "2024",
    requiredTAHoursPerWeek: 6,
    numberOfRequiredTAs: 5,
    requirements: "Students must have completed CS100 or equivalent. Strong programming skills in Python and Java required. Minimum GPA of 3.0. Must be available for 6 hours per week during semester."
  });

  const handleInputChange = (field: keyof ModuleEditData, value: string | number) => {
    setModuleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Updated module data:', moduleData);
  };

  return (
    <div className="space-y-6">      
      <div className="max-w-2xl mx-auto bg-bg-card rounded-xl shadow-lg overflow-hidden border border-border-default">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-bg-card bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-text-inverted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-text-inverted font-bold text-xl">Edit Module Information</h2>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information - Display Only */}
          <div className="bg-info bg-opacity-10 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary uppercase tracking-wide">Module Code</p>
                  <p className="text-sm font-semibold text-text-primary">{moduleData.moduleCode}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary uppercase tracking-wide">Module Name</p>
                  <p className="text-sm font-semibold text-text-primary">{moduleData.moduleName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary uppercase tracking-wide">Semester</p>
                  <p className="text-sm font-semibold text-text-primary">{moduleData.semester}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary uppercase tracking-wide">Year</p>
                  <p className="text-sm font-semibold text-text-primary">{moduleData.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TA Requirements - Editable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Required TA Hours per Week
              </label>
              <input
                type="number"
                value={moduleData.requiredTAHoursPerWeek}
                onChange={(e) => handleInputChange('requiredTAHoursPerWeek', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 6"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Number of Required TAs
              </label>
              <input
                type="number"
                value={moduleData.numberOfRequiredTAs}
                onChange={(e) => handleInputChange('numberOfRequiredTAs', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 5"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Requirements - Editable */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Requirements for TA Position
            </label>
            <textarea
              value={moduleData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Enter detailed requirements for TA applicants..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 text-text-primary border border-border-default rounded-lg hover:bg-bg-page transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditModuleDetails
