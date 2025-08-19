import React from "react";
import TARequestCard from "../components/TARequestCard";
import { Navigation } from '../components/TANavbar'

import { GraduationCap, BookOpen, Users, Newspaper } from "lucide-react";
function TADashboard() {
  return (
    <div className="min-h-screen bg-bg-card text-text-primary">
      {/* <Navigation /> */}
      {/* add the nav bar */}
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
          <div className="p-6 border shadow-sm bg-bg-card rounded-xl border-border-default/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-primary">10</h3>
                <p className="text-sm text-text-secondary">available modules</p>
              </div>
            </div>
          </div>
          <div className="p-6 border shadow-sm bg-bg-card rounded-xl border-border-default/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-primary">34</h3>
                <p className="text-sm text-text-secondary">
                  Total TA positions
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 border shadow-sm bg-bg-card rounded-xl border-border-default/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Newspaper className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-primary">20</h3>
                <p className="text-sm text-text-secondary">
                  Total applications received
                </p>
              </div>
            </div>
          </div> 
        </div>        
      </div>
      
      {/* TA requests */}
      <div className="m-8">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Applied TA Positions</h2>
            <TARequestCard 
        moduleCode="CS2040S"
        moduleName="Data Structures and Algorithms"
        coordinators={["Prof. Chong Ket Fah", "Dr. Steven Halim"]}
        requiredTAHours={12}
        requiredTANumber={10}
        appliedTANumber={7}
        requirements={[
          "Grade A- or above in CS2040S",
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
