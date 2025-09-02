import React from 'react'
import { Trophy, FileUser,File, Clock, CircleCheckBig } from "lucide-react";
import TAAccepedCard from '../components/TAAcceptedCard';
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
            <CircleCheckBig className="w-8 h-8 text-success" />
    
            </div>
            <h1 className="text-4xl font-bold text-text-primary">Accepted TA Positions</h1>
          </div>
          <p className="max-w-2xl mx-auto text-lg text-text-secondary">
        Congratulations! Manage your accepted Teaching Assistant positions and stay organized with your responsibilities.
          </p>
        </div>
        {/* stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <TAStatCard 
            statName="Total Hours per Week"
            statValue={3}
            icon={Clock}
          />
          <TAStatCard 
            statName="Accepted Positions"
            statValue={2}
            icon={Trophy}
          />
          <TAStatCard 
            statName="Documents Pending"
            statValue={0}
            icon={File}
          />
          
        </div>
      </div>
      {/* applied TA positions */}
      <div className='m-8'>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Available TA Positions</h2>
        <TAAccepedCard
          moduleCode="CS101"
          moduleName="computer security"
          coordinators={["Dr. Smith", "Prof. Doe"]}
          requiredTAHours={20}
          requiredTANumber={2}
          appliedTANumber={1}
          status="Document Submitted"
          appliedDate="2024-06-01"
          documentDueDate="2024-06-15"
          applicationDueDate='2024-06-10'
          requirements={["Resume", "Cover Letter"]} 
          
        />
        <div className='mt-4'></div>
                <TAAccepedCard
          moduleCode="CS101"
          moduleName="Programming Languages"
          coordinators={["Dr. Smith", "Prof. Fernando"]}
          requiredTAHours={10}
          requiredTANumber={2}
          appliedTANumber={1}
          status="Rejected"
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


