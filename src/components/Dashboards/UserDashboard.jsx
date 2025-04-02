import React from 'react';
import { Container, Grid, Typography, Paper, Box, Card, CardContent, IconButton, Divider, Chip } from '@mui/material';
import { styled } from '@mui/system';
import { Assignment, History, HelpOutline, ArrowForward, Notifications, TrendingUp, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(128, 0, 0, 0.1)',
    '&::after': {
      opacity: 1,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(128, 0, 0, 0.02) 0%, rgba(128, 0, 0, 0) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: '50%',
  padding: theme.spacing(1),
  display: 'inline-flex',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'scale(1)',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
  },
}));

function FeatureCard({ icon, title, description, action, path }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <DashboardCard elevation={2}>
      <CardContent>
        <IconWrapper>{icon}</IconWrapper>
        <CardTitle variant="h6">{title}</CardTitle>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            transition: 'color 0.3s ease',
            '&:hover': {
              color: 'text.primary',
            },
          }}
        >
          {description}
        </Typography>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Chip 
            label={action} 
            color="primary" 
            size="small"
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: '#600000',
              },
            }}
          />
          <IconButton 
            size="small" 
            color="primary"
            onClick={handleClick}
            sx={{ 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                backgroundColor: 'rgba(128, 0, 0, 0.08)',
                transform: 'scale(1.15) rotate(90deg)',
              },
            }}
          >
            <ArrowForward />
          </IconButton>
        </Box>
      </CardContent>
    </DashboardCard>
  );
}

function UserDashboard() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
            WILD C.O.R.E
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Work Integrated Learning Data Collection and Reporting Engine
          </Typography>
        </Box>
        <IconButton 
          color="primary" 
          size="large"
          sx={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(128, 0, 0, 0.08)',
              transform: 'rotate(15deg)',
            },
          }}
        >
          <Notifications />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<Assignment />}
                title="Add New Student"
                description="Create a new student record with program details and internship information."
                action="Add Student"
                path="/add-student"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<History />}
                title="Student List"
                description="View and manage student records. Review, edit, and verify student information."
                action="View & Edit"
                path="/students"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<Assessment />}
                title="Student Analytics"
                description="Access visual analytics and insights about student performance across companies and semesters."
                action="View Insights"
                path="/student-analytics"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<HelpOutline />}
                title="Need Help?"
                description="Access user guides, FAQs, and contact support for assistance."
                action="Get Help"
                path="/faq"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(128, 0, 0, 0.1)',
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Getting Started
              </Typography>
              <TrendingUp color="primary" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              • Click "Add New Student" to create a new internship record with complete student details.
            </Typography>
            <Typography variant="body2" paragraph>
              • Use "Student Records" to view, edit and manage all submitted records.
            </Typography>
            <Typography variant="body2" paragraph>
              • Check "Student Analytics" for performance insights and statistics.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Pro Tips
            </Typography>
            <Typography variant="body2" paragraph>
              • Fill out all required fields marked with an asterisk (*).
            </Typography>
            <Typography variant="body2" paragraph>
              • Keep student contact information up to date.
            </Typography>
            <Typography variant="body2">
              • Regularly review and verify submitted records.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UserDashboard;
