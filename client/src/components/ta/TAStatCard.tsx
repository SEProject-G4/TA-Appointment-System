import React from "react";


interface TAStatCardProps {
  statName: string;
    statValue: number | string;
    icon: React.ElementType;
}

const TAStatCard: React.FC<TAStatCardProps> = ({
    statName,
    statValue,
    icon:Icon
}) => {


  
  return (
    <div className="p-4 border shadow-sm sm:p-6 bg-primary-light/10 rounded-xl border-border-default/50">
      <div className="flex items-center gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold sm:text-2xl text-text-primary">{statValue}</h3>
          <p className="text-xs leading-tight sm:text-sm text-text-secondary">{statName}</p>
        </div>
      </div>
    </div>
  );
};
export default TAStatCard;


