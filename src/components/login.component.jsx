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
  IconButton,
  Grid,
  Fade
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Modified handleSubmit to skip validation
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simply call onLogin without any validation
    onLogin();
    navigate('/dashboard');
  };

  // Added a quick login button for testing
  const handleQuickLogin = () => {
    onLogin();
    navigate('/dashboard');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log('Forgot password clicked');
  };

  return (
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
            Welcome Back
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                    <Lock sx={{ color: '#800000' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#800000' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {/* Quick Login Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleQuickLogin}
              sx={{
                mt: 2,
                mb: 1,
                py: 1.5,
                background: '#FFD700',
                color: '#800000',
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: '#FFE44D',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(255, 215, 0, 0.3)',
                },
              }}
            >
              Quick Login (Testing)
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
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
              }}
            >
              Sign In
            </Button>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleForgotPassword}
                  sx={{
                    textDecoration: 'none',
                    color: '#800000',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: '#FFD700',
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link
                  component={RouterLink}
                  to="/sign-up"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    color: '#800000',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: '#FFD700',
                    },
                  }}
                >
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Fade>
  );
}
