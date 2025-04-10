import React from 'react';
import SideBar from '../shared/Sidebar';
import Header from '../shared/Header';

const UserDashboard = ({ isAuthenticated, setIsAuthenticated }) => {
  return (
    <>
      <SideBar 
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
    />
      <div className="main-content">
        <Header />
      </div>
    </>
  );
};

export default UserDashboard;