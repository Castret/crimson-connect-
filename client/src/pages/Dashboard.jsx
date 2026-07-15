import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'bloodbank') {
    return <Navigate to="/bloodbank/dashboard" replace />;
  }
  if (user?.role === 'hospital') {
    return <Navigate to="/hospital/dashboard" replace />;
  }
  return <Navigate to="/donor/dashboard" replace />;
};

export default Dashboard;
