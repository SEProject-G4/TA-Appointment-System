import React from 'react'
import { Delete,Trophy, FileUser,Newspaper } from "lucide-react";
import TAAppliedCard from '../components/TAAppliedCard';
import TAStatCard from '../components/TAStatCard';

function TADashboardApplied() {
  return (
    <div>
      <div className="min-h-screen bg-bg-card text-text-primary">
      {/* <Navigation /> */}
      {/* add the nav bar */}
      <div className="container px-4 py-8 mx-auto">
        {/* header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileUser className="w-8 h-8 text-text-primary" />
            </div>
            <h1 className="text-4xl font-bold ">Applied TA Positions</h1>
          </div>
          <p className="max-w-2xl mx-auto text-lg text-text-secondary">
            Track the status of your TA position applications. Stay updated on application progress.
          </p>
        </div>
        {/* stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <TAStatCard 
            statName="Applications Submitted"
            statValue={2}
            icon={Newspaper}
          />
          <TAStatCard 
            statName="Accepted Positions"
            statValue={1}
            icon={Trophy}
          />
          <TAStatCard 
            statName="Rejected Positions"
            statValue={1}
            icon={Delete}
          />
        </div>
      </div>
      {/* applied TA positions */}
      <div className='m-8'>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Applied TA Positions</h2>
        <TAAppliedCard
          moduleCode="CS101"
          moduleName="Computer Security"
          coordinators={["Dr. Smith", "Prof. Doe"]}
          requiredTAHours={20}
          requiredTANumber={2}
          appliedTANumber={1}
          status="Rejected"
          appliedDate="2024-06-01"
          documentDueDate="2024-06-15"
          applicationDueDate='2024-06-10'
          requirements={["Resume", "Cover Letter"]}
        />
        <div className='mt-4'></div>
          <TAAppliedCard
          moduleCode="CS101"
          moduleName="Theory of Computing"
          coordinators={["Dr. Smith", "Prof. Doe"]}
          requiredTAHours={20}
          requiredTANumber={2}
          appliedTANumber={1}
          status="Accepted"
          appliedDate="2024-06-01"
          documentDueDate="2024-06-15"
          applicationDueDate='2024-06-10'
          requirements={["Resume", "Cover Letter"]}
        />
      </div>

      </div>

      
    </div>
  ) 
}

export default TADashboardApplied


