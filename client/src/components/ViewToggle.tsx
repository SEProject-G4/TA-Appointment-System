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
    <div className={`inline-flex rounded-lg border border-border bg-background p-1 ${className}`}>
      <button
        onClick={() => onViewChange('cards')}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
          currentView === 'cards'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Cards
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
          currentView === 'list'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <List className="w-4 h-4" />
        List
      </button>
    </div>
  );
};

export default ViewToggle;