import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AppBar, Toolbar, Button, Box, IconButton } from '@mui/material';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';

function Navigation() {
  const { userRole, currentUser, auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // If not logged in, show only login/signup buttons
  if (!currentUser) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/login">
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
            <Button color="inherit" component={Link} to="/concerns">
              Concerns & Solutions
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

        {/* Flexible space to push profile and logout to the right */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Profile Link */}
        <Button 
          color="inherit" 
          component={Link} 
          to="/profile"
          startIcon={<AccountCircle />}
          sx={{ mr: 1 }}
        >
          Profile
        </Button>

        {/* Logout Button */}
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;
