import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray';
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 'medium',
  color = 'blue',
  children,
}) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Map size prop to Tailwind CSS classes
  const sizeClasses = {
    'small': 'w-20 h-20',
    'medium': 'w-32 h-32',
    'large': 'w-48 h-48',
  }[size] || 'w-32 h-32';

  // Map color prop to Tailwind CSS classes
  const colorClasses = {
    'blue': 'stroke-blue-500',
    'green': 'stroke-green-500',
    'purple': 'stroke-purple-500',
    'red': 'stroke-red-500',
    'orange': 'stroke-orange-500',
    'gray': 'stroke-gray-300',
  }[color] || 'stroke-blue-500';

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center`}>
      <svg
        className="transform -rotate-90"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-gray-300"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClasses} transition-all duration-700 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      {/* Content for inside the circle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-gray-800">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
