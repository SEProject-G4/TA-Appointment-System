// ReusableButton.jsx
import React from "react";

type ButtonProps = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export const Button = ({ label, icon, onClick, type = "button", disabled = false }: ButtonProps) => {
  return (
    <button     
      type={type}
      onClick={onClick}
      className={`w-full ${!disabled ? "bg-primary-dark text-text-inverted" : "bg-primary-light text-black"} font-semibold py-3 px-6 rounded-md shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group`}
      disabled={disabled}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 transition-transform duration-1000 ease-in-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>

      {/* Button content */}
      <div className="relative flex items-center justify-center space-x-3">
        {/* Icon container */}
        {icon && (
          <div className="flex items-center justify-center w-6 h-6 transition-transform duration-300 rounded-md bg-white/20 group-hover:scale-110">
            {icon}
          </div>
        )}
        <span className="text-sm tracking-wide">{label}</span>
      </div>
    </button>
  );
};
