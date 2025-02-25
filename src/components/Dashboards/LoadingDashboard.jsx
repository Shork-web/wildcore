import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// Define pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Define fade animation
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const LoadingDashboard = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        gap: 3,
        animation: `${fadeIn} 0.5s ease-in-out`,
        backgroundColor: 'white',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer progress circle */}
        <CircularProgress
          size={100}
          thickness={2}
          sx={{
            color: '#FFD700',
            position: 'absolute',
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        />
        {/* Inner progress circle */}
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: '#800000',
            animation: `${pulse} 2s infinite ease-in-out`,
            animationDelay: '0.3s',
          }}
        />
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            background: 'linear-gradient(45deg, #800000, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          Loading Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            animation: `${fadeIn} 0.5s ease-in-out`,
            animationDelay: '0.2s',
          }}
        >
          Please wait while we fetch your data...
        </Typography>
      </Box>

      {/* Loading dots */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 2,
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#800000',
              animation: `${pulse} 1s infinite ease-in-out`,
              animationDelay: `${index * 0.2}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default LoadingDashboard; 