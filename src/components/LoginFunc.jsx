import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { 
  AppBar, 
  Toolbar, 
  Container, 
  Box, 
  useTheme,
  useMediaQuery,
  keyframes
} from '@mui/material';
import Login from './login.component';
import SignUp from './signup.component';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/login.css';
import '../css/Signup.css';
import '../css/transitions.css';

import logo from '../assets/wordlogo.png';
import citLogo from '../assets/citlogo.png';

// Define the rotation animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

function LoginFunc({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogin = () => {
    onLogin();
    navigate('/dashboard');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* AppBar - Removed login/signup buttons */}
      <AppBar position="fixed" sx={{ backgroundColor: '#800000', boxShadow: 3 }}>
        <Toolbar sx={{ justifyContent: 'flex-start' }}> {/* Changed from space-between to flex-start */}
          <Link to="/sign-in" style={{ textDecoration: 'none' }}>
            <img
              src={logo}
              alt="logo"
              style={{ 
                width: isMobile ? '120px' : '150px', 
                height: 'auto'
              }}
            />
          </Link>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        maxWidth={false} 
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: 8, sm: 10 }, // Adjust top padding to account for AppBar
          px: { xs: 2, sm: 4 },
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: location.pathname === '/sign-up' ? '800px' : '450px',
            transition: 'max-width 0.3s ease-in-out',
          }}
        >
          <TransitionGroup>
            <CSSTransition
              key={location.pathname}
              classNames="fade"
              timeout={300}
            >
              <Routes location={location}>
                <Route path="/sign-in" element={<Login onLogin={handleLogin} />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/" element={<Navigate to="/sign-in" />} />
              </Routes>
            </CSSTransition>
          </TransitionGroup>
        </Box>
      </Container>

      {/* Background Logo */}
      <BackgroundLogo isMobile={isMobile} />

      {/* Background Overlay - Reduced blur */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${require('../assets/bg.jpg')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)', // Reduced from 8px to 2px
          zIndex: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)', // Reduced opacity from 0.3 to 0.2
          }
        }}
      />
    </Box>
  );
}

function BackgroundLogo({ isMobile }) {
  const location = useLocation();
  const showLogo = ['/sign-in', '/sign-up', '/'].includes(location.pathname);

  if (!showLogo) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: isMobile ? '-100px' : '-150px',
        left: isMobile ? '-60px' : '-80px',
        opacity: 0.8,
        zIndex: 2,
        animation: `${rotate} 20s linear infinite`,
        transform: isMobile ? 'scale(0.7)' : 'scale(1)',
        transition: 'transform 0.3s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      <img
        src={citLogo}
        alt="CIT University Logo"
        style={{
          width: '400px',
          filter: 'grayscale(40%) blur(1px)', // Added blur effect
        }}
      />
    </Box>
  );
}

export default LoginFunc;
