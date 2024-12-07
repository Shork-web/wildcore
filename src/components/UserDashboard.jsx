import React from 'react';
import { Container, Grid, Typography, Paper, Box, Card, CardContent, IconButton, Divider, Chip } from '@mui/material';
import { styled } from '@mui/system';
import { Assignment, History, School, ArrowForward, Notifications, TrendingUp, HelpOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
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
}));

function FeatureCard({ icon, title, description, action, path }) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <DashboardCard elevation={2}>
      <CardContent>
        <IconWrapper>{icon}</IconWrapper>
        <CardTitle variant="h6">{title}</CardTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip label={action} color="primary" size="small" />
          <IconButton 
            size="small" 
            color="primary"
            onClick={handleNavigate}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(128, 0, 0, 0.04)',
                transform: 'scale(1.1)'
              },
              transition: 'transform 0.2s ease-in-out'
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
        <IconButton color="primary" size="large">
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
                title="Review Student List"
                description="Review all previously submitted student records and verify their accuracy."
                action="View List"
                path="/students"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<School />}
                title="Update Records"
                description="Edit existing records to keep the information up-to-date and accurate."
                action="Update Records"
                path="/students"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<HelpOutline />}
                title="Need Help?"
                description="Access user guides, FAQs, and contact support for assistance."
                action="Get Help"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
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
              • Use "Student List" to access and review all submitted records.
            </Typography>
            <Typography variant="body2" paragraph>
              • Select "Update Records" to modify existing student information.
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
