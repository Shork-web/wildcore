import React, { useState, createContext, useContext, useCallback } from 'react';
import { Container, Dialog, Grid, Button, Box, DialogActions, DialogContent, DialogContentText, DialogTitle, CssBaseline } from '@mui/material';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import LoginFunc from './components/LoginFunc';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AppBar, Toolbar } from '@mui/material';
import logo from './assets/wordlogo.png'; 
import ConcernsSolutions from './components/ConcernsSolutions';

// Define custom colors for Maroon and Gold
const maroon = '#800000';
const gold = '#FFD700';

// Create a custom theme with Maroon and Gold
const theme = createTheme({
  palette: {
    primary: {
      main: maroon, 
    },
    secondary: {
      main: gold, // Gold color for secondary elements
    },
  },
  Typography: {
    h6: {
      fontWeight: 600,
    },
  },
});

// Create the context for user role
export const AuthContext = createContext();

// Create a provider component for user role management
export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('user'); // 'admin' or 'user'

  // Function to toggle user role
  const toggleUserRole = () => {
    setUserRole((prevRole) => (prevRole === 'admin' ? 'user' : 'admin'));
  };

  return (
    <AuthContext.Provider value={{ userRole, toggleUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// ProtectedRoute component to guard routes based on user roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole } = useContext(AuthContext);
  return allowedRoles.includes(userRole) ? children : <Navigate to="/" />;
};

// Create a new context for students data
export const StudentsContext = createContext();

function Core() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const updateStudents = useCallback((newStudents) => {
    setStudents(newStudents);
    localStorage.setItem('students', JSON.stringify(newStudents));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <StudentsContext.Provider value={{ students, updateStudents }}>
          {isLoggedIn ? (
            <CoreContent handleLogout={handleLogout} />
          ) : (
            <LoginFunc onLogin={handleLogin} />
          )}
        </StudentsContext.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function CoreContent({ handleLogout }) {
  const { students, updateStudents } = useContext(StudentsContext);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { userRole, toggleUserRole } = useContext(AuthContext);

  // Add Student Function
  const addStudent = (student) => {
    if (editingStudent) {
      const updatedStudents = students.map((s) =>
        s.id === student.id ? student : s
      );
      updateStudents(updatedStudents);
    } else {
      const newStudents = [...students, { ...student, id: Date.now() }];
      updateStudents(newStudents);
    }
    setIsDialogOpen(false);
    setEditingStudent(null);
  };

  // Edit Student Function
  const editStudent = (student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  // Close Dialog Function
  const closeDialog = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  // Delete Student Function
  const deleteStudent = (id) => {
    const updatedStudents = students.filter((student) => student.id !== id);
    updateStudents(updatedStudents);
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setIsLogoutDialogOpen(false);
  };

  const confirmLogout = () => {
    closeLogoutDialog();
    handleLogout();
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img
              src={logo}
              alt="WILD C.O.R.E Logo"
              style={{ height: '40px', marginRight: '20px' }}
            />
          </Box>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          {userRole === 'admin' && (
            <>
              <Button color="inherit" component={Link} to="/students">
                Students
              </Button>
              <Button color="inherit" component={Link} to="/concerns">
                Concerns & Solutions
              </Button>
            </>
          )}
          {userRole === 'user' && (
            <>
              <Button color="inherit" component={Link} to="/add-student">
                Student Form
              </Button>
              <Button color="inherit" component={Link} to="/students">
                Student History
              </Button>
            </>
          )}
          <Button color="inherit" onClick={toggleUserRole}>
            Switch to {userRole === 'admin' ? 'User' : 'Admin'}
          </Button>
          <Button color="inherit" onClick={openLogoutDialog}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, backgroundColor: 'white' }}>
        <Grid container spacing={3}>
          <Routes>
            <Route path="/" element={userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <StudentList
                    students={students}
                    updateStudent={editStudent}
                    deleteStudent={deleteStudent}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/concerns"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConcernsSolutions students={students} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-student"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <StudentForm addStudent={addStudent} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Grid>
      </Container>

      {/* Edit Student Dialog */}
      {editingStudent && (
        <Dialog
          open={isDialogOpen}
          onClose={closeDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh', // Set maximum height to 90% of viewport height
              m: 2, // Add margin around the dialog
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(45deg, #800000, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            Edit Student Information
          </DialogTitle>
          <DialogContent
            sx={{
              p: 3,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#800000',
                borderRadius: '4px',
                '&:hover': {
                  background: '#600000',
                },
              },
            }}
          >
            <StudentForm addStudent={addStudent} initialData={editingStudent} />
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: '1px solid rgba(0, 0, 0, 0.12)',
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              p: 2,
            }}
          >
            <Button 
              onClick={closeDialog}
              sx={{ 
                color: '#800000',
                '&:hover': {
                  backgroundColor: 'rgba(128, 0, 0, 0.1)'
                }
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={isLogoutDialogOpen}
        onClose={closeLogoutDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Logout"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLogoutDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmLogout} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Core;
