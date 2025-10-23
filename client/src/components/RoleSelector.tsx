import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaUser, FaGraduationCap, FaUserTie, FaCog, FaUserGraduate, FaUserShield } from "react-icons/fa";

interface RoleSelectorProps {
  onCancel?: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onCancel }) => {
  const { availableRoles, selectUserRole, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-2xl" />;
      case 'undergraduate':
        return <FaGraduationCap className="text-2xl" />;
      case 'postgraduate':
        return <FaUserGraduate className="text-2xl" />;
      case 'lecturer':
        return <FaUserTie className="text-2xl" />;
      case 'hod':
        return <FaUserShield className="text-2xl" />;
      case 'cse-office':
        return <FaCog className="text-2xl" />;
      default:
        return <FaUser className="text-2xl" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'hod':
        return 'Head of Department';
      case 'cse-office':
        return 'CSE Office Staff';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'System administrator with full access to all features';
      case 'undergraduate':
        return 'Undergraduate student eligible for TA positions';
      case 'postgraduate':
        return 'Postgraduate student eligible for TA positions';
      case 'lecturer':
        return 'Faculty member who can supervise TA positions';
      case 'hod':
        return 'Head of Department with administrative privileges';
      case 'cse-office':
        return 'CSE Office staff member with administrative access';
      default:
        return 'Select this role to continue';
    }
  };

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    
    setIsSelecting(true);
    try {
      await selectUserRole(selectedRole);
    } catch (error) {
      console.error('Role selection failed:', error);
      // You could show an error message here
    } finally {
      setIsSelecting(false);
    }
  };

  if (loading || isSelecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">
            {isSelecting ? 'Selecting role...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20 flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Select Your Role</h1>
          <p className="text-text-secondary">
            Multiple roles are available for your account. Please select the role you want to use for this session.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {availableRoles.map((roleData) => (
            <div
              key={roleData.userId}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === roleData.role
                  ? 'border-primary bg-primary/5'
                  : 'border-border-default hover:border-primary/50 hover:bg-bg-page'
              }`}
              onClick={() => setSelectedRole(roleData.role)}
            >
              <div className="flex items-center space-x-4">
                <div className={`${selectedRole === roleData.role ? 'text-primary' : 'text-text-secondary'}`}>
                  {getRoleIcon(roleData.role)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {getRoleDisplayName(roleData.role)}
                    </h3>
                    {roleData.indexNumber && (
                      <span className="text-sm text-text-secondary">
                        ({roleData.indexNumber})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {roleData.displayName !== roleData.displayName && (
                      <span className="block font-medium">{roleData.displayName}</span>
                    )}
                    {getRoleDescription(roleData.role)}
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedRole === roleData.role
                    ? 'border-primary bg-primary'
                    : 'border-border-default'
                }`}>
                  {selectedRole === roleData.role && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-border-default text-text-secondary rounded-lg hover:bg-bg-page transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole}
            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
              selectedRole
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-bg-page text-text-secondary cursor-not-allowed'
            }`}
          >
            Continue as {selectedRole ? getRoleDisplayName(selectedRole) : 'Selected Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;