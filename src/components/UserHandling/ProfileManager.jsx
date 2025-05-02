import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import { Add, Person, School, Phone, Email } from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import Auth from '../../classes/Auth';

const auth = getAuth();
const db = getFirestore();
const authService = new Auth();

export default function ProfileManager() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    college: '',
    sections: [],
    currentSectionInput: '',
    role: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        if (!auth.currentUser?.uid) return;
        
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Convert section to sections array if needed (backward compatibility)
          let sectionsArray = [];
          if (data.sections && Array.isArray(data.sections)) {
            sectionsArray = data.sections;
          } else if (data.section) {
            sectionsArray = [data.section];
          }
          
          setUserData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            college: data.college || '',
            sections: sectionsArray,
            currentSectionInput: '',
            role: data.role || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setSnackbarMessage('Error fetching user data: ' + error.message);
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for phone number field
    if (name === 'phoneNumber') {
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

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      if (!auth.currentUser?.uid) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Validate basic fields
      if (!userData.firstName || !userData.lastName || !userData.phoneNumber) {
        throw new Error('Please fill in all required fields');
      }
      
      // Prepare update data
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        updatedAt: new Date().toISOString()
      };
      
      // Handle sections - instructor only
      if (userData.role === 'instructor') {
        // Use existing authService to update sections
        const result = await authService.updateUserSections(
          auth.currentUser.uid, 
          userData.sections
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update sections');
        }
      }
      
      // Update the profile in Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      
      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbarMessage('Error updating profile: ' + error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#800000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #800000, #CC0000)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}
      >
        Manage Your Profile
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: '#800000' }}>
              Personal Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="firstName"
              label="First Name"
              value={userData.firstName}
              onChange={handleChange}
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
              fullWidth
              name="email"
              label="Email"
              value={userData.email}
              disabled
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
              name="phoneNumber"
              label="Phone Number"
              value={userData.phoneNumber}
              onChange={handleChange}
              inputProps={{ inputMode: 'numeric' }}
              placeholder="Numbers and dashes only"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: '#800000' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {userData.role === 'instructor' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ mt: 2, mb: 2, color: '#800000' }}>
                  Academic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="college"
                  label="College/Department"
                  value={userData.college}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School sx={{ color: '#800000' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#555' }}>
                  Your Sections
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    name="currentSectionInput"
                    label="Add Section"
                    value={userData.currentSectionInput}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
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
                
                <Card variant="outlined" sx={{ p: 2, mb: 2, minHeight: '100px' }}>
                  <CardContent sx={{ p: 1 }}>
                    {userData.sections.length > 0 ? (
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
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        You don't have any sections yet. Add sections to manage students by class.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                
                <Typography variant="caption" color="text.secondary">
                  Note: Adding or removing sections will update which students appear in your dashboard.
                </Typography>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={isSaving}
              sx={{ 
                minWidth: '200px',
                py: 1.5,
                background: 'linear-gradient(45deg, #800000, #CC0000)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #600000, #AA0000)',
                }
              }}
            >
              {isSaving ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : 'Save Profile'}
            </Button>
          </Grid>
        </Grid>
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
    </Box>
  );
} 