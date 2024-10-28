import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { AppBar, Toolbar, Button } from '@mui/material';

function Navigation() {
  const { userRole, toggleUserRole } = useContext(AuthContext);

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Common Links */}
        <Button color="inherit" component={Link} to="/">
          Dashboard
        </Button>

        {/* Admin Links */}
        {userRole === 'admin' && (
          <>
            <Button color="inherit" component={Link} to="/students">
              Student List
            </Button>
            {/* Add other admin tabs here, excluding 'Add Student' */}
          </>
        )}

        {/* User Links */}
        {userRole === 'user' && (
          <>
            <Button color="inherit" component={Link} to="/add-student">
              Add Student
            </Button>
            <Button color="inherit" component={Link} to="/students">
              History
            </Button>
          </>
        )}

        {/* Toggle Role Button (for testing) */}
        <Button color="inherit" onClick={toggleUserRole} style={{ marginLeft: 'auto' }}>
          Switch to {userRole === 'admin' ? 'User' : 'Admin'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;
