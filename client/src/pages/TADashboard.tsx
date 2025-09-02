import React from "react";
import TARequestCard from "../components/TARequestCard";
import TAStatCard from "../components/TAStatCard";

import { GraduationCap, BookOpen, Users, Newspaper, User } from "lucide-react";
function TADashboard() {
  return (
    <div className="min-h-screen bg-bg-card text-text-primary">
      <div className="container px-4 py-8 mx-auto">
        {/* header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-8 h-8 text-text-primary" />
            </div>
            <h1 className="text-4xl font-bold ">TA Application Portal</h1>
          </div>
          <p className="max-w-2xl mx-auto text-lg text-text-secondary">
            Apply for Teaching Assistant positions across various computer
            science modules. Find the perfect opportunity to share your
            knowledge and gain valuable experience.
          </p>
        </div>
        {/* stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <TAStatCard 
            statName="Available Modules"
            statValue={10}
            icon={BookOpen}
          />
          <TAStatCard 
            statName="Total TA Positions"
            statValue={20}
            icon={Users}
          />
          <TAStatCard 
            statName="Total Applications Received"
            statValue={10}
            icon={Newspaper}
          />
        </div>        
      </div>
      
      {/* TA requests */}
      <div className="gap-2 m-8">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Applied TA Positions</h2>
            <TARequestCard 
        moduleCode="CS2040S"
        moduleName="Data Structures and Algorithms"
        coordinators={["Prof. Chong Ket Fah", "Dr. Steven Halim"]}
        requiredTAHours={12}
        requiredTANumber={10}
        appliedTANumber={2}
        requirements={[
          "Grade A- or above in CS2040S",
          "Proficiency in Java or Python",
          "Good problem-solving skills"
        ]}
        documentDueDate="2024-08-01"
        applicationDueDate="2024-07-15"
    />
    <div className="mt-6"></div>
    <TARequestCard  
        moduleCode="CS2045S"
        moduleName="Computer Security"
        coordinators={["Prof. abc fernando"]}
        requiredTAHours={5}
        requiredTANumber={3}
        appliedTANumber={2}
        requirements={[
          "Grade A- or above in CS2045S",
          "Proficiency in Java or Python",
          "Good problem-solving skills"
        ]}
        documentDueDate="2024-08-01"
        applicationDueDate="2024-07-15"
    />
      </div>

    </div>
  );
}

export default TADashboard;
