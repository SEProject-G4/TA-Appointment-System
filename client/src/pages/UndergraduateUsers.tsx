import React from 'react'
import UsersGroupCard from '../components/UsersGroupCard';

function UndergraduateUsers() {
  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <h1 className="text-3xl font-bold mb-4">Undergraduate Users</h1>
      <p className="text-lg">Manage undergraduate users</p>
      <UsersGroupCard id="1" groupName="Intake 22" userCount={200} />
    </div>
  )
  
}

export default UndergraduateUsers;