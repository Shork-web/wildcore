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
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import { Person, Email, Lock, School, Phone, AdminPanelSettings, VpnKey, Add } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Auth from '../../classes/Auth';

const COLLEGES = {
  'COLLEGE OF ENGINEERING AND ARCHITECTURE': [
    'BS Architecture',
    'BS Chemical Engineering',
    'BS Civil Engineering',
    'BS Computer Engineering',
    'BS Electrical Engineering',
    'BS Electronics Engineering',
    'BS Industrial Engineering',
    'BS Mechanical Engineering',
    'BS Mining Engineering'
  ],
  'COLLEGE OF MANAGEMENT, BUSINESS & ACCOUNTANCY': [
    'BS Accountancy',
    'BS Accounting Information Systems',
    'BS Management Accounting',
    'BS Business Administration',
    'BS Hospitality Management',
    'BS Tourism Management',
    'BS Office Administration',
    'Bachelor in Public Administration'
  ],
  'COLLEGE OF ARTS, SCIENCES, & EDUCATION': [
    'AB Communication',
    'AB English with Applied Linguistics',
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
    'Bachelor of Multimedia Arts',
    'BS Biology',
    'BS Math with Applied Industrial Mathematics',
    'BS Psychology'
  ],
  'COLLEGE OF NURSING & ALLIED HEALTH SCIENCES': [
    'BS Nursing',
    'BS Pharmacy'
  ],
  'COLLEGE OF COMPUTER STUDIES': [
    'BS Computer Science',
    'BS Information Technology'
  ],
  'COLLEGE OF CRIMINAL JUSTICE': [
    'BS Criminology'
  ]
};

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
    college: '',
    sections: [],
    currentSectionInput: '',
    createdAt: new Date().toISOString()
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const auth = new Auth();
  const navigate = useNavigate();

  const validatePasswords = () => {
    return userData.password === userData.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (!validatePasswords()) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        return;
      }

      if (userData.accountType === 'instructor') {
        if (!userData.college) {
          setMessage({ type: 'error', text: 'Please select a college' });
          setIsSubmitting(false);
          return;
        }
        
        if (userData.sections.length === 0) {
          setMessage({ type: 'error', text: 'Please add at least one section' });
          setIsSubmitting(false);
          return;
        }
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
        college: userData.college,
        sections: userData.sections,
        createdAt: new Date().toISOString(),
        adminKey: userData.adminKey
      };

      const result = await auth.signUp(userForAuth);

      if (result.success) {
        setSnackbarSeverity('success');
        setSnackbarMessage('Account created successfully!');
        setOpenSnackbar(true);
        
        await auth.signOut();
        
        setTimeout(() => {
          navigate('/sign-in');
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
    const { name, value } = e.target;
    
    // Validation for phone number and ID number fields
    if (name === 'phoneNumber' || name === 'idNumber') {
      // Only allow numbers and hyphens
      const validatedValue = value.replace(/[^0-9-]/g, '');
      // Ensure proper format: numbers and hyphens only
      if (validatedValue === '' || /^[0-9-]*$/.test(validatedValue)) {
        setUserData(prev => ({
          ...prev,
          [name]: validatedValue
        }));
      }
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAccountTypeChange = (type) => {
    setUserData(prev => ({
      ...prev,
      accountType: type,
      adminKey: type !== 'admin' ? '' : prev.adminKey,
      college: type === 'instructor' ? '' : prev.college,
      sections: type === 'instructor' ? prev.sections : []
    }));
  };

  const handleAddSection = () => {
    if (userData.currentSectionInput.trim() !== '' && 
        !userData.sections.includes(userData.currentSectionInput.trim())) {
      setUserData(prev => ({
        ...prev,
        sections: [...prev.sections, prev.currentSectionInput.trim()],
        currentSectionInput: ''
      }));
    }
  };

  const handleRemoveSection = (sectionToRemove) => {
    setUserData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section !== sectionToRemove)
    }));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddSection();
    }
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
                  inputProps={{ inputMode: 'numeric' }}
                  placeholder="Numbers and dashes only"
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
                  inputProps={{ inputMode: 'numeric' }}
                  placeholder="Numbers and dashes only"
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
              {userData.accountType === 'instructor' && (
                <>
                  <Grid item xs={12} sm={12}>
                    <TextField
                      select
                      required
                      fullWidth
                      name="college"
                      label="College"
                      value={userData.college}
                      onChange={handleChange}
                      SelectProps={{
                        native: true,
                      }}
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
                    >
                      <option value="">Select a College</option>
                      {Object.keys(COLLEGES).map((college) => (
                        <option key={college} value={college}>
                          {college}
                        </option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: '#555' }}>
                      Sections <Typography component="span" color="error">*</Typography>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        fullWidth
                        name="currentSectionInput"
                        label="Add Section"
                        value={userData.currentSectionInput}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
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
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddSection}
                        sx={{ ml: 1, height: '56px', minWidth: '56px' }}
                      >
                        <Add />
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {userData.sections.map((section, index) => (
                        <Chip
                          key={index}
                          label={section}
                          onDelete={() => handleRemoveSection(section)}
                          color="primary"
                          sx={{ 
                            background: '#800000',
                            '&:hover': { background: '#600000' }
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}
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

            {userData.accountType === 'admin' && (
              <TextField
                required
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
            )}

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
