import React from 'react';
import UserDashboard from './User';

const Dashboard = ({ isAuthenticated, setIsAuthenticated }) => {
  const userRole = localStorage.getItem('userRole');  // Change in production

  return (
    <UserDashboard 
      isAuthenticated={isAuthenticated}
      setIsAuthenticated={setIsAuthenticated}
      userRole={userRole}
    />
  );
};

export default Dashboard;