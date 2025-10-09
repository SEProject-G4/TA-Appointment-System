import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

// toggle the view between cards and list in TA dashboards
interface ViewToggleProps {
  currentView: 'cards' | 'list';
  onViewChange: (view: 'cards' | 'list') => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  currentView, 
  onViewChange, 
  className = '' 
}) => {
  return (
    <div className={`inline-flex rounded-lg border border-border-default bg-bg-card p-1 shadow-lg ${className}`}>
      <button
        onClick={() => onViewChange('cards')}
        className={`inline-flex items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out relative overflow-hidden group ${
          currentView === 'cards'
            ? 'bg-primary-dark text-text-inverted shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'text-text-secondary hover:bg-primary-light/20 hover:text-text-primary'
        }`}
      >
        {/* Shimmer effect for active state */}
        {currentView === 'cards' && (
          <div className="absolute inset-0 transition-transform duration-1000 ease-in-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
        )}
        
        <div className="relative flex items-center justify-center gap-1 sm:gap-2">
          <div className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
            currentView === 'cards' 
              ? 'rounded-md bg-white/20 group-hover:scale-110' 
              : ''
          }`}>
            <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span className="tracking-wide hidden sm:inline">Cards</span>
        </div>
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`inline-flex items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out relative overflow-hidden group ${
          currentView === 'list'
            ? 'bg-primary-dark text-text-inverted shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'text-text-secondary hover:bg-primary-light/20 hover:text-text-primary'
        }`}
      >
        {/* Shimmer effect for active state */}
        {currentView === 'list' && (
          <div className="absolute inset-0 transition-transform duration-1000 ease-in-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
        )}
        
        <div className="relative flex items-center justify-center gap-1 sm:gap-2">
          <div className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
            currentView === 'list' 
              ? 'rounded-md bg-white/20 group-hover:scale-110' 
              : ''
          }`}>
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span className="tracking-wide hidden sm:inline">List</span>
        </div>
      </button>
    </div>
  );
};

export default ViewToggle;