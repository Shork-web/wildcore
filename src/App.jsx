import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Navigation from './components/Navigation';
import Login from './components/login.component';
import Signup from './components/signup.component';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import ConcernsSolutions from './components/ConcernsSolutions';

function DefaultRoute() {
  const { userRole } = useAuthContext();
  return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

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

          {/* Root route */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <DefaultRoute />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to appropriate dashboard */}
          <Route
            path="*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <DefaultRoute />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 