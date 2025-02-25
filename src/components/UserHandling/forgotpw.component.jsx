import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Link,
  InputAdornment,
  Grid,
  Fade,
  Alert,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  keyframes
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../../firebase-config';
import '../../css/login.css';
import citlogo from '../../assets/citlogo.png';
import wordlogo from '../../assets/wordlogo.png';
import bgImage from '../../assets/bg.jpg';

// Define the rotation animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const auth = getAuth(app);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ type: 'success', text: 'Password reset email sent! Please check your inbox.' });
      setTimeout(() => navigate('/sign-in'), 3000);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ backgroundColor: '#800000', boxShadow: 3 }}>
        <Toolbar sx={{ justifyContent: 'flex-start' }}>
          <Link to="/sign-in" style={{ textDecoration: 'none' }}>
            <img
              src={wordlogo}
              alt="logo"
              style={{ 
                width: isMobile ? '120px' : '150px', 
                height: 'auto'
              }}
            />
          </Link>
        </Toolbar>
      </AppBar>

      <Container 
        maxWidth={false} 
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: 8, sm: 10 },
          px: { xs: 2, sm: 4 },
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
        }}
      >
        <Fade in timeout={800}>
          <Container component="main" maxWidth="xs">
            <Paper
              elevation={6}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mt: 8,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mb: 4,
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #800000, #FFD700)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reset Password
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'center', 
                  color: '#555',
                  maxWidth: '80%'
                }}
              >
                Enter your email address and we'll send you a link to reset your password.
              </Typography>

              {message.text && (
                <Alert severity={message.type} sx={{ mb: 2, width: '100%' }}>
                  {message.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#800000',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#800000',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #800000, #FFD700)',
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(128, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #600000, #DFB700)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(128, 0, 0, 0.3)',
                    },
                  }}
                >
                  Send Reset Link
                </Button>
                <Grid container justifyContent="center">
                  <Grid item>
                    <Link
                      component={RouterLink}
                      to="/sign-in"
                      sx={{
                        textDecoration: 'none',
                        color: '#800000',
                        transition: 'color 0.3s ease',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        '&:hover': {
                          color: '#FFD700',
                        },
                      }}
                    >
                      Back to Sign In
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Container>
        </Fade>
      </Container>

      {/* Background Logo */}
      <Box
        sx={{
          position: 'fixed',
          bottom: isMobile ? '-100px' : '-150px',
          left: isMobile ? '-60px' : '-80px',
          opacity: 0.8,
          zIndex: 0,
          animation: `${rotate} 20s linear infinite`,
          transform: isMobile ? 'scale(0.7)' : 'scale(1)',
          transition: 'transform 0.3s ease-in-out',
          pointerEvents: 'none',
        }}
      >
        <img
          src={citlogo}
          alt="CIT University Logo"
          style={{
            width: '400px',
            filter: 'grayscale(40%) blur(1px)',
          }}
        />
      </Box>

      {/* Background Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)',
          zIndex: -1,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
      />
    </Box>
  );
} 