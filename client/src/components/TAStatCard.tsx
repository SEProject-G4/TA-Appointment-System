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
    <div className="p-6 border shadow-sm bg-primary-light/10 rounded-xl border-border-default/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-text-primary">{statValue}</h3>
          <p className="text-sm text-text-secondary">{statName}</p>
        </div>
      </div>
    </div>
  );
};
export default TAStatCard;


