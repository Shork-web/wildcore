import React from 'react';
import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import { 
  Facebook, 
  Instagram, 
  YouTube,
  LocationOn,
  Phone,
  Email
} from '@mui/icons-material';
import citLogo2 from '../assets/cit-logo2.png';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 2,
        mt: 'auto',
        backgroundColor: 'white',
        color: '#333',
        borderTop: '1px solid #eaeaea',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Left Section with Logo */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 2,
              maxWidth: '700px',
            }}
          >
            <img
              src={citLogo2}
              alt="CIT-U Logo"
              style={{
                height: '170px',
                width: 'auto',
                minWidth: '150px',
              }}
            />
            <Box sx={{ 
              textAlign: { xs: 'center', sm: 'left' },
              ml: { sm: 2 }
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 0.5,
                  color: '#800000',
                  textTransform: 'uppercase',
                  fontSize: '1rem',
                }}
              >
                Cebu Institute of Technology - University
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 0.5,
                color: 'text.secondary'
              }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2" color="inherit">
                  N. Bacalso Avenue, Cebu City ,Philippines 6000
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 0.5,
                color: 'text.secondary'
              }}>
                <Phone fontSize="small" />
                <Typography variant="body2" color="inherit">
                  +63 32 411 2000 (trunkline)
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: 0.5,
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'text.secondary'
                }}>
                  <Email fontSize="small" />
                  <Typography variant="body2" color="inherit">
                    info@cit.edu
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Get in Touch Section with Social Media Icons */}
          <Box sx={{ 
            textAlign: 'center',
            mt: { xs: 1, md: 0 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#800000',
                fontWeight: 'bold',
                fontSize: '1rem',
              }}
            >
              Get in Touch
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <IconButton
                component={Link}
                href="https://www.facebook.com/CITUniversity"
                target="_blank"
                sx={{ 
                  color: '#1877f2', // Facebook blue
                  padding: '6px',
                  '&:hover': {
                    backgroundColor: 'rgba(24, 119, 242, 0.1)',
                  }
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                component={Link}
                href="https://www.instagram.com/cituniversity/"
                target="_blank"
                sx={{ 
                  color: '#e4405f', // Instagram pink
                  padding: '6px',
                  '&:hover': {
                    backgroundColor: 'rgba(228, 64, 95, 0.1)',
                  }
                }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                component={Link}
                href="https://www.youtube.com/@cit.university"
                target="_blank"
                sx={{ 
                  color: '#ff0000', // YouTube red
                  padding: '6px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  }
                }}
              >
                <YouTube />
              </IconButton>
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mt: 1,
              }}
            >
              © {new Date().getFullYear()} WILD C.O.R.E
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 