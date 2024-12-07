import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Navigation from './components/Navigation';
import Login from './components/login.component';
import Signup from './components/signup.component';
import MainDashboard from './components/MainDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected User/Instructor Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root route - will redirect based on role */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <MainDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 