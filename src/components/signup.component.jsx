import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Link,
  Grid,
  InputAdornment,
  Fade,
  Divider,
  Collapse,
  Alert,
  Snackbar
} from '@mui/material';
import { Person, Email, Lock, School, Phone, AdminPanelSettings, VpnKey } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Auth from '../classes/Auth';

export default function SignUp() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    phoneNumber: '',
    accountType: 'instructor',
    adminKey: '',
    adminKeyVerified: false,
    role: 'instructor',
    createdAt: new Date().toISOString()
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const auth = new Auth();

  const validatePasswords = () => {
    return userData.password === userData.confirmPassword;
  };

  const validateAdminKey = () => {
    if (userData.accountType === 'admin') {
      // Replace with your actual admin key validation
      return userData.adminKey === 'CITADMIN';
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!validatePasswords()) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        return;
      }

      if (!validateAdminKey()) {
        setMessage({ type: 'error', text: 'Invalid Admin Key' });
        return;
      }

      const userForAuth = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        idNumber: userData.idNumber,
        phoneNumber: userData.phoneNumber,
        role: userData.accountType,
        createdAt: new Date().toISOString(),
        adminKeyVerified: userData.accountType === 'admin',
        accountType: userData.accountType
      };

      if (userData.accountType === 'admin') {
        userForAuth.adminKey = userData.adminKey;
      }

      const result = await auth.signUp(userForAuth);

      if (result.success) {
        setSnackbarSeverity('success');
        setSnackbarMessage('Account created successfully!');
        setOpenSnackbar(true);
        
        await auth.signOut();
        
        setTimeout(() => {
          window.location.replace('/sign-in');
        }, 500);
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage(result.error || 'Failed to create account');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage(error.message || 'An error occurred');
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setUserData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAccountTypeChange = (type) => {
    setUserData(prev => ({
      ...prev,
      accountType: type,
      adminKey: type !== 'admin' ? '' : prev.adminKey
    }));
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Fade in timeout={800}>
      <Container component="main" maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 4,
            mb: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
            width: '100%',
            maxWidth: '800px',
            margin: 'auto',
          }}
        >
          <Typography
            component="h1"
            variant="h3"
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
            Create Account
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2, width: '100%' }}>
              {message.text}
            </Alert>
          )}

          <Typography variant="h6" sx={{ mb: 2, color: '#800000' }}>
            Register Type
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              onClick={() => handleAccountTypeChange('instructor')}
              sx={{
                flex: 1,
                color: userData.accountType === 'instructor' ? '#800000' : '#555',
                borderBottom: userData.accountType === 'instructor' ? '3px solid #800000' : 'none',
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
                color: userData.accountType === 'admin' ? '#800000' : '#555',
                borderBottom: userData.accountType === 'admin' ? '3px solid #800000' : 'none',
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

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#800000' }}>
              Personal Information
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  autoFocus
                  value={userData.firstName}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <Person sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={userData.lastName}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <Person sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="idNumber"
                  label="ID Number"
                  value={userData.idNumber}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <School sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="phoneNumber"
                  label="Phone Number"
                  value={userData.phoneNumber}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <Phone sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2, color: '#800000' }}>
              Account Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={userData.email}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={userData.password}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <Lock sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={userData.confirmPassword}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
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
                        <Lock sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Collapse in={userData.accountType === 'admin'}>
              <TextField
                required={userData.accountType === 'admin'}
                fullWidth
                name="adminKey"
                label="Admin Key"
                type="password"
                value={userData.adminKey}
                onChange={handleChange}
                sx={{
                  mt: 3,
                  '& .MuiOutlinedInput-root': {
                    height: '56px',
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
                      <VpnKey sx={{ color: '#800000' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Collapse>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Grid container justifyContent="center">
              <Grid item>
                <Link
                  component={RouterLink}
                  to="/sign-in"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    color: '#800000',
                    transition: 'color 0.3s ease',
                    fontSize: '1rem',
                    '&:hover': {
                      color: '#FFD700',
                    },
                  }}
                >
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Fade>
  );
}
