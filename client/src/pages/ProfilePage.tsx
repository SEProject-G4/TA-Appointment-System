import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaUser, FaEnvelope, FaIdBadge, FaGraduationCap } from "react-icons/fa";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">No User Data</h2>
          <p className="text-text-secondary">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const ProfileField: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | undefined;
    isMultiline?: boolean;
  }> = ({ icon, label, value, isMultiline = false }) => (
    <div className="bg-bg-card rounded-lg p-4 shadow-sm border border-border-default">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex-1">
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            {label}
          </label>
          {isMultiline ? (
            <div className="text-text-primary whitespace-pre-wrap">
              {value || "Not provided"}
            </div>
          ) : (
            <div className="text-text-primary font-medium">
              {value || "Not provided"}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-bg-card rounded-lg shadow-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary shadow-lg overflow-hidden">
                <img
                  src={user.profilePicture}
                  alt={`${user.name}'s profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || "User"
                    )}&background=0d7377&color=ffffff&size=128`;
                  }}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {user.name}
              </h1>
              <p className="text-xl text-text-secondary mb-1">{user.email}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                <FaGraduationCap className="mr-2" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-bg-card rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <FaUser className="text-primary" />
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
                Personal Information
              </h3>

              <ProfileField
                icon={<FaUser />}
                label="Full Name"
                value={user.name}
              />

              <ProfileField
                icon={<FaEnvelope />}
                label="Email Address"
                value={user.email}
              />

              <ProfileField
                icon={<FaIdBadge />}
                label="User ID"
                value={user.id}
              />
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
                Academic Information
              </h3>

              <ProfileField
                icon={<FaGraduationCap />}
                label="Role"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              />

              <div className="bg-bg-card rounded-lg p-4 shadow-sm border border-border-default">
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-1">
                    <FaGraduationCap />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-secondary mb-1 block">
                      Role Description
                    </label>
                    <div className="text-text-primary">
                      {user.role === 'undergraduate' && "Undergraduate student eligible for TA positions"}
                      {user.role === 'postgraduate' && "Postgraduate student eligible for TA positions"}
                      {user.role === 'lecturer' && "Faculty member who can supervise TA positions"}
                      {user.role === 'admin' && "System administrator with full access"}
                      {user.role === 'hod' && "Head of Department with administrative privileges"}
                      {user.role === 'cse-office' && "CSE Office staff member"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
              Account Status
            </h3>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Account Active</h4>
                  <p className="text-sm text-green-700">
                    Your account is active and in good standing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note about editing */}
          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <FaUser className="text-primary mt-1" />
              <div>
                <h4 className="font-medium text-text-primary mb-1">Profile Information</h4>
                <p className="text-sm text-text-secondary">
                  Your profile information is managed by the system administrator. 
                  If you need to update any details, please contact the administrative office.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;