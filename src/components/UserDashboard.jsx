import React from 'react';
import { Container, Grid, Typography, Paper, Box, Card, CardContent, IconButton, Divider, Chip } from '@mui/material';
import { styled } from '@mui/system';
import { Assignment, History, HelpOutline, School, ArrowForward, Notifications, TrendingUp } from '@mui/icons-material';

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

function FeatureCard({ icon, title, description, action }) {
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
          <IconButton size="small" color="primary">
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<History />}
                title="View Student History"
                description="Review all previously submitted student records and verify their accuracy."
                action="View History"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<School />}
                title="Update Records"
                description="Edit existing records to keep the information up-to-date and accurate."
                action="Update Records"
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
                Quick Insights
              </Typography>
              <TrendingUp color="primary" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              • 85% of students completed their internships successfully this quarter.
            </Typography>
            <Typography variant="body2" paragraph>
              • Top 3 industries: Tech (40%), Finance (25%), Healthcare (20%).
            </Typography>
            <Typography variant="body2" paragraph>
              • Average internship duration: 3.5 months.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Pro Tips
            </Typography>
            <Typography variant="body2" paragraph>
              • Use advanced filters to generate targeted reports.
            </Typography>
            <Typography variant="body2">
              • Set up email alerts for important student milestones.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UserDashboard;
