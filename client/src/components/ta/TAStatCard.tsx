import React from "react";


interface TAStatCardProps {
  statName: string;
    statValue: number;
    icon: React.ElementType;
}

const TAStatCard: React.FC<TAStatCardProps> = ({
    statName,
    statValue,
    icon:Icon
}) => {


  
  return (
    <div className="p-4 sm:p-6 border shadow-sm bg-primary-light/10 rounded-xl border-border-default/50">
      <div className="flex items-center gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-text-primary">{statValue}</h3>
          <p className="text-xs sm:text-sm text-text-secondary leading-tight">{statName}</p>
        </div>
      </div>
    </div>
  );
};
export default TAStatCard;


