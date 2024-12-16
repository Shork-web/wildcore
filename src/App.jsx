import { BrowserRouter as Router, Routes, Route, Navigate, useContext } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Navigation from './components/Navigation';
import Login from './components/login.component';
import SignUp from './components/signup.component';
import ForgotPassword from './components/forgotpw.component';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import ConcernsSolutions from './components/ConcernsSolutions';
import { Box, CircularProgress, createTheme, ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            '*': {
              msOverflowStyle: 'none',  // Hide scrollbar for IE and Edge
              scrollbarWidth: 'none',    // Hide scrollbar for Firefox
            },
            '*::-webkit-scrollbar': {    // Hide scrollbar for Chrome, Safari, and Opera
              display: 'none'
            },
            'html, body': {
              overflow: 'auto',
            },
          }}
        />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navigation />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concerns"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ConcernsSolutions />
            </ProtectedRoute>
          }
        />

        {/* Protected Instructor Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-student"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <StudentForm />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes */}
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'instructor']}>
              <StudentList />
            </ProtectedRoute>
          }
        />

        {/* Root route - redirect based on role */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['admin', 'instructor']}>
              <RootRedirect />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// Helper component to handle root route redirection
function RootRedirect() {
  const { userRole } = useContext(AuthContext);
  return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default App; 