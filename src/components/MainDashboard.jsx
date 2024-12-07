import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styled from 'styled-components';

const MainDashboardContainer = styled('div')({
  height: '100vh',
  overflowY: 'auto',
});

function MainDashboard() {
  const { userRole, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'user' || userRole === 'instructor') {
        navigate('/dashboard');
      }
    }
  }, [userRole, loading, navigate]);

  // Show loading state while determining role
  if (loading) {
    return <div>Loading...</div>;
  }

  return null; // Component will redirect before rendering
}

export default MainDashboard;
