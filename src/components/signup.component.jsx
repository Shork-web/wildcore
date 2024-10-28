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
  Divider
} from '@mui/material';
import { Person, Email, Lock, School, Phone } from '@mui/icons-material'; // Removed Home icon
import { Link as RouterLink } from 'react-router-dom';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    phoneNumber: '' // Removed address
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
                  value={formData.firstName}
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
                  value={formData.lastName}
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
                  value={formData.idNumber}
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
                  value={formData.phoneNumber}
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
                  value={formData.email}
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
                  value={formData.password}
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
                  value={formData.confirmPassword}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
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
              Create Account
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
