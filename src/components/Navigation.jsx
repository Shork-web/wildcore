import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AppBar, Toolbar, Button } from '@mui/material';

function Navigation() {
  const { userRole, currentUser } = useContext(AuthContext);

  // If not logged in, show only login/signup buttons
  if (!currentUser) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/sign-in">
            Login
          </Button>
          <Button color="inherit" component={Link} to="/sign-up">
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Dashboard link based on role */}
        <Button 
          color="inherit" 
          component={Link} 
          to={userRole === 'admin' ? '/admin' : '/dashboard'}
        >
          Dashboard
        </Button>

        {/* Admin Links */}
        {userRole === 'admin' && (
          <>
            <Button color="inherit" component={Link} to="/students">
              Student List
            </Button>
          </>
        )}

        {/* Instructor Links */}
        {userRole === 'instructor' && (
          <>
            <Button color="inherit" component={Link} to="/add-student">
              Add Student
            </Button>
            <Button color="inherit" component={Link} to="/students">
              Student List
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;
