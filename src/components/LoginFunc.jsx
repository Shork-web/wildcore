import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
import ForgotPassword from './forgotpw.component';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/login.css';
import '../css/Signup.css';
import '../css/transitions.css';

import logo from '../assets/wordlogo.png';
import citLogo from '../assets/citlogo.png';

// Styles
const styles = {
  mainContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  appBar: {
    backgroundColor: '#800000',
    boxShadow: 3
  },
  contentContainer: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pt: { xs: 8, sm: 10 },
    px: { xs: 2, sm: 4 },
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
  },
  backgroundOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(2px)',
    zIndex: 0,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    }
  }
};

// Animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

function BackgroundLogo({ isMobile }) {
  const location = useLocation();
  const validRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/'];
  const showLogo = validRoutes.includes(location.pathname);

  if (!showLogo) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: '-100px', sm: '-120px', md: '-150px' },
        left: { xs: '-60px', sm: '-70px', md: '-80px' },
        opacity: 0.5,
        zIndex: 1,
        animation: `${rotate} 20s linear infinite`,
        transition: 'all 0.3s ease-in-out',
        pointerEvents: 'none',
        width: { xs: '200px', sm: '300px', md: '400px' },
        height: { xs: '200px', sm: '300px', md: '400px' },
      }}
    >
      <img
        src={citLogo}
        alt="CIT University Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'grayscale(40%) blur(1px)',
        }}
      />
    </Box>
  );
}

function LoginFunc() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={styles.mainContainer}>
      <AppBar position="fixed" sx={styles.appBar}>
        <Toolbar sx={{ justifyContent: 'flex-start' }}>
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

      <Container maxWidth={false} sx={styles.contentContainer}>
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
                <Route path="/sign-in" element={<Login />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/" element={<Navigate to="/sign-in" replace />} />
              </Routes>
            </CSSTransition>
          </TransitionGroup>
        </Box>
      </Container>

      <BackgroundLogo isMobile={isMobile} />

      <Box
        sx={{
          ...styles.backgroundOverlay,
          backgroundImage: `url(${require('../assets/bg.jpg')})`,
        }}
      />
    </Box>
  );
}

export default LoginFunc;
