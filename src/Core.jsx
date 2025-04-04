import React, { useState, useCallback, useContext } from 'react';
import { Container, Dialog, Grid, Button, Box, DialogActions, DialogContent, DialogContentText, DialogTitle, CssBaseline } from '@mui/material';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import StudentForm from './components/Dashboards/StudentForm';
import StudentList from './components/Dashboards/StudentList';
import UserDashboard from './components/Dashboards/UserDashboard';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import LoginFunc from './components/UserHandling/LoginFunc';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AppBar, Toolbar } from '@mui/material';
import logo from './assets/wordlogo.png'; 
import ConcernsSolutions from './components/Dashboards/ConcernsSolutions';
import { AuthContext, AuthProvider, StudentsContext } from './context/AuthContext';
import ProtectedRoute from './components/UserHandling/ProtectedRoute';
import Footer from './components/Layout/Footer';
import Analytics from './components/Analytics/AnalyticsExport';
import FAQ from './components/FAQ/FAQ';
import StudentAnalytics from './components/Analytics/StudentAnalytics';
import StudentRankings from './components/Rankings/StudentRankings';
import AdminRankings from './components/Rankings/AdminRankings';

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

function Core() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CoreContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function CoreContent() {
  const [students, setStudents] = useState([]);
  const { currentUser } = useContext(AuthContext);

  // Remove localStorage usage from updateStudents
  const updateStudents = useCallback((newStudents) => {
    setStudents(newStudents);
  }, []);

  return (
    <StudentsContext.Provider value={{ students, updateStudents }}>
      {currentUser ? (
        <MainContent />
      ) : (
        <LoginFunc />
      )}
    </StudentsContext.Provider>
  );
}

function MainContent() {
  const { students, updateStudents } = useContext(StudentsContext);
  const { userRole, auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Function to determine if footer should be shown
  const shouldShowFooter = () => {
    return location.pathname === '/' || location.pathname === '/dashboard';
  };

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

  const confirmLogout = async () => {
    try {
      await auth.signOut();
      closeLogoutDialog();
      navigate('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              <Button color="inherit" component={Link} to="/analytics">
                Analytics
              </Button>
              <Button color="inherit" component={Link} to="/admin-rankings">
                Rankings
              </Button>
            </>
          )}
          {userRole === 'instructor' && (
            <>
              <Button color="inherit" component={Link} to="/add-student">
                Student Form
              </Button>
              <Button color="inherit" component={Link} to="/students">
                Student List
              </Button>
              <Button color="inherit" component={Link} to="/student-analytics">
                Analytics
              </Button>
              <Button color="inherit" component={Link} to="/student-rankings">
                Rankings
              </Button>
            </>
          )}
          <Button color="inherit" onClick={openLogoutDialog}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, backgroundColor: 'white', flex: 1 }}>
        <Grid container spacing={3}>
          <Routes>
            <Route path="/" element={
              <>
                {userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />}
              </>
            } />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'instructor']}>
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
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-rankings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRankings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-student"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <StudentForm addStudent={addStudent} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <FAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-analytics"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <StudentAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-rankings"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <StudentRankings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Grid>
      </Container>

      {/* Edit Student Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            m: 2,
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

      {shouldShowFooter() && <Footer />}
    </div>
  );
}

export default Core;
