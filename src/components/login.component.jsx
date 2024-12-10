import React, { useState, useCallback } from 'react';
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
  IconButton,
  Grid,
  Fade,
  Alert
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, School, AdminPanelSettings } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Auth from '../classes/Auth';

// Styles object to keep JSX clean
const styles = {
  paper: {
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
  },
  title: {
    mb: 4,
    fontWeight: 600,
    background: 'linear-gradient(45deg, #800000, #FFD700)',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  submitButton: {
    mt: 2,
    mb: 3,
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
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: '#800000',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#800000',
      },
    },
  }
};

export default function LoginComponent() {
  // State management
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    accountType: 'instructor',
    showPassword: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const auth = new Auth();

  // Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!loginData.email || !loginData.password) {
      setMessage({ type: 'error', text: 'Please enter valid credentials' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await auth.signIn(
        loginData.email,
        loginData.password,
        loginData.accountType
      );

      if (result.success) {
        // Get user role from result
        const userRole = result.user.role;
        
        // Role-based redirection
        if (userRole === 'admin' && loginData.accountType === 'admin') {
          navigate('/', { replace: true }); // Root path will handle admin dashboard
        } else if (userRole === 'instructor' && loginData.accountType === 'instructor') {
          navigate('/', { replace: true }); // Root path will handle user dashboard
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An error occurred during login. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = useCallback((e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleAccountTypeChange = useCallback((type) => {
    setLoginData(prev => ({
      ...prev,
      accountType: type
    }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setLoginData(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  }, []);

  const handleForgotPassword = useCallback((e) => {
    e.preventDefault();
    navigate('/forgot-password');
  }, [navigate]);

  // Render methods
  const renderAccountTypeButtons = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
      <Button
        onClick={() => handleAccountTypeChange('instructor')}
        sx={{
          flex: 1,
          color: loginData.accountType === 'instructor' ? '#800000' : '#555',
          borderBottom: loginData.accountType === 'instructor' ? '3px solid #800000' : 'none',
          borderRadius: 0,
          '&:hover': {
            background: 'transparent',
          },
          transition: 'background 0.3s ease',
          padding: '10px 20px',
          textTransform: 'uppercase',
        }}
      >
        <School sx={{ mr: 1 }} />
        Instructor
      </Button>
      <Button
        onClick={() => handleAccountTypeChange('admin')}
        sx={{
          flex: 1,
          color: loginData.accountType === 'admin' ? '#800000' : '#555',
          borderBottom: loginData.accountType === 'admin' ? '3px solid #800000' : 'none',
          borderRadius: 0,
          '&:hover': {
            background: 'transparent',
          },
          transition: 'background 0.3s ease',
          padding: '10px 20px',
          textTransform: 'uppercase',
        }}
      >
        <AdminPanelSettings sx={{ mr: 1 }} />
        Admin
      </Button>
    </Box>
  );

  const renderLoginForm = () => (
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
        value={loginData.email}
        onChange={handleChange}
        sx={styles.textField}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email sx={{ color: '#800000' }} />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={loginData.showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={loginData.password}
        onChange={handleChange}
        sx={styles.textField}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock sx={{ color: '#800000' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={togglePasswordVisibility}
                edge="end"
                sx={{ color: '#800000' }}
              >
                {loginData.showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isSubmitting}
        sx={styles.submitButton}
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </Button>
      <Grid container spacing={2} alignItems="center" justifyContent="center">
        <Grid item>
          <Link
            component="button"
            variant="body2"
            onClick={handleForgotPassword}
            sx={{
              textDecoration: 'none',
              color: '#800000',
              transition: 'color 0.3s ease',
              fontSize: '0.9rem',
              '&:hover': {
                color: '#FFD700',
              },
            }}
          >
            Forgot password?
          </Link>
        </Grid>
        <Grid item>
          <Typography variant="body2" sx={{ color: '#555', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/sign-up"
              sx={{
                textDecoration: 'none',
                color: '#FFD700',
                fontWeight: 'bold',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#800000',
                },
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Fade in timeout={800}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={6} sx={styles.paper}>
          <Typography component="h1" variant="h4" sx={styles.title}>
            Welcome Back
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2, width: '100%' }}>
              {message.text}
            </Alert>
          )}

          {renderAccountTypeButtons()}
          {renderLoginForm()}
        </Paper>
      </Container>
    </Fade>
  );
}
