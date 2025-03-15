import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import NearbyUsers from './NearbyUsers';
import AdminPanel from './AdminPanel';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.fullName || 'User'}</h1>
      
      {user?.isAdmin || user?.role === 'admin' ? (
        <AdminPanel />
      ) : (
        <>
          <UserProfile />
          <NearbyUsers />
        </>
      )}
    </div>
  );
}

export default Dashboard; 