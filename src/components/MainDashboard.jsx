import React, { useContext } from 'react';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import { AuthContext } from '../Core'; 
import styled from 'styled-components';

const MainDashboardContainer = styled('div')({
  height: '100vh',
  overflowY: 'auto',
});

function MainDashboard({ students }) {
  const { userRole } = useContext(AuthContext);

  // Render Admin or User Dashboard based on role
  return userRole === 'admin' ? (
    <MainDashboardContainer>
      <AdminDashboard students={students} />
    </MainDashboardContainer>
  ) : (
    <UserDashboard />
  );
}

export default MainDashboard;
