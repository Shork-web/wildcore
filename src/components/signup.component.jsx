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
  Alert
} from '@mui/material';
import { Person, Email, Lock, School, Phone, AdminPanelSettings, VpnKey } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import User from '../classes/User';
import Auth from '../classes/Auth';

export default function SignUp() {
  const [user] = useState(new User());
  const auth = new Auth();

  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user.validatePasswords()) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (!user.validateAdminKey()) {
      setMessage({ type: 'error', text: 'Invalid Admin Key' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await auth.signUp(user);
      if (result.success) {
        setMessage({ type: 'success', text: 'Account created successfully!' });
        setTimeout(() => navigate('/sign-in'), 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    user[e.target.name] = e.target.value;
  };

  const handleAccountTypeChange = (type) => {
    user.accountType = type;
    if (type !== 'admin') {
      user.adminKey = '';
    }
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
                color: user.accountType === 'instructor' ? '#800000' : '#555',
                borderBottom: user.accountType === 'instructor' ? '3px solid #800000' : 'none',
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
                color: user.accountType === 'admin' ? '#800000' : '#555',
                borderBottom: user.accountType === 'admin' ? '3px solid #800000' : 'none',
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
                  value={user.firstName}
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
                  value={user.lastName}
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
                  value={user.idNumber}
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
                  value={user.phoneNumber}
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
                  value={user.email}
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
                  value={user.password}
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
                  value={user.confirmPassword}
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

            <Collapse in={user.accountType === 'admin'}>
              <TextField
                required={user.accountType === 'admin'}
                fullWidth
                name="adminKey"
                label="Admin Key"
                type="password"
                value={user.adminKey}
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
              disabled={isSubmitting}
              sx={{
                mt: 4,
                mb: 3,
                py: 2,
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
      </Container>
    </Fade>
  );
}
