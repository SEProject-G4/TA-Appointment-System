import React from "react";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, className }) => {
  return (
    <div className={`w-full py-12 sm:py-16 text-center ${className || ''}`}>
      {icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <div className="text-2xl">{icon}</div>
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-text-primary sm:text-xl">{title}</h3>
      {subtitle && (
        <p className="text-sm text-text-secondary sm:text-base">{subtitle}</p>
      )}
    </div>
  );
};

export default EmptyState;


