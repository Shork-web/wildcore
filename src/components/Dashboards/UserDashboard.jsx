import React from 'react';
import { Container, Grid, Typography, Box, Card, CardContent, IconButton, Divider, Tooltip, Zoom } from '@mui/material';
import { styled } from '@mui/system';
import { Assignment, History, HelpOutline, EmojiEvents, TrendingUp, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  position: 'relative',
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #800000 30%, #B22222 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(0.5),
  fontSize: '2.2rem',
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'text.secondary',
  marginBottom: theme.spacing(4),
  fontSize: '1rem',
  maxWidth: '600px',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(128, 0, 0, 0.2)',
    '&::before': {
      opacity: 1,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '5px',
    height: '100%',
    background: 'linear-gradient(180deg, #800000, #FF8C00)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  }
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.25rem',
  background: 'linear-gradient(45deg, #800000, #B22222)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(1.5),
}));

const CardDescription = styled(Typography)(({ theme }) => ({
  color: 'text.secondary',
  fontSize: '0.875rem',
  marginBottom: theme.spacing(2.5),
  lineHeight: 1.6,
}));

const CardAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: 'auto',
}));

const ActionButton = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.8, 2),
  background: 'linear-gradient(45deg, #800000, #B22222)',
  color: 'white',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  borderRadius: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(128, 0, 0, 0.2)',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(128, 0, 0, 0.3)',
    transform: 'translateX(5px)',
  },
}));

const IconCircle = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #800000, #B22222)',
  color: 'white',
  width: 56,
  height: 56,
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2.5),
  boxShadow: '0 8px 20px rgba(128, 0, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'rotate(10deg) scale(1.1)',
  }
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 12px 28px rgba(128, 0, 0, 0.25)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '80px',
    height: '80px',
    background: 'radial-gradient(circle, rgba(128, 0, 0, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '0 0 0 80px',
    zIndex: 0,
  },
}));

const InfoTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.2rem',
  background: 'linear-gradient(45deg, #800000, #B22222)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2.5),
}));

const InfoListItem = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  marginBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  position: 'relative',
  lineHeight: 1.6,
  color: 'rgba(0, 0, 0, 0.7)',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '8px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#800000',
  },
  '&:hover': {
    color: '#800000',
  },
  transition: 'color 0.2s ease',
}));

const BackgroundGradient = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '10%',
  right: '5%',
  width: '300px',
  height: '300px',
  background: 'radial-gradient(circle, rgba(128, 0, 0, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
  borderRadius: '50%',
  zIndex: -1,
}));

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
  </svg>
);

const FloatingHelpButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #800000, #B22222)',
  color: 'white',
  boxShadow: '0 4px 20px rgba(128, 0, 0, 0.3)',
  zIndex: 1000,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(10deg)',
    boxShadow: '0 6px 25px rgba(128, 0, 0, 0.4)',
  },
}));

function UserDashboard() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleHelpClick = () => {
    // Navigate to FAQ/help page when help icon is clicked
    navigate('/faq');
  };

  return (
    <DashboardContainer maxWidth="xl">
      <BackgroundGradient />
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Title variant="h3">WILD R.O.U.T.E</Title>
          <Subtitle variant="body1">Work-Integrated Learning and Development – Records of OJT, Updates, Training & Evaluation</Subtitle>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FeatureCard>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3.5 }}>
                  <IconCircle>
                    <Assignment />
                  </IconCircle>
                  <CardTitle>Add New Student</CardTitle>
                  <CardDescription>
                    Create a new student record with program details and internship information.
                  </CardDescription>
                  <CardAction>
                    <ActionButton onClick={() => handleNavigation('/add-student')}>
                      Add Student
                      <Box component="span" sx={{ ml: 1.5, display: 'flex', alignItems: 'center' }}>
                        <ArrowIcon />
                      </Box>
                    </ActionButton>
                  </CardAction>
                </CardContent>
              </FeatureCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FeatureCard>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3.5 }}>
                  <IconCircle>
                    <History />
                  </IconCircle>
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>
                    View and manage student records. Review, edit, and verify student information.
                  </CardDescription>
                  <CardAction>
                    <ActionButton onClick={() => handleNavigation('/students')}>
                      View & Edit
                      <Box component="span" sx={{ ml: 1.5, display: 'flex', alignItems: 'center' }}>
                        <ArrowIcon />
                      </Box>
                    </ActionButton>
                  </CardAction>
                </CardContent>
              </FeatureCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FeatureCard>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3.5 }}>
                  <IconCircle>
                    <Assessment />
                  </IconCircle>
                  <CardTitle>Student Analytics</CardTitle>
                  <CardDescription>
                    Access visual analytics and insights about student performance across companies and semesters.
                  </CardDescription>
                  <CardAction>
                    <ActionButton onClick={() => handleNavigation('/student-analytics')}>
                      View Insights
                      <Box component="span" sx={{ ml: 1.5, display: 'flex', alignItems: 'center' }}>
                        <ArrowIcon />
                      </Box>
                    </ActionButton>
                  </CardAction>
                </CardContent>
              </FeatureCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FeatureCard>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3.5 }}>
                  <IconCircle>
                    <EmojiEvents />
                  </IconCircle>
                  <CardTitle>Student Rankings</CardTitle>
                  <CardDescription>
                    View top-performing students ranked by their evaluation scores across programs.
                  </CardDescription>
                  <CardAction>
                    <ActionButton onClick={() => handleNavigation('/student-rankings')}>
                      View Rankings
                      <Box component="span" sx={{ ml: 1.5, display: 'flex', alignItems: 'center' }}>
                        <ArrowIcon />
                      </Box>
                    </ActionButton>
                  </CardAction>
                </CardContent>
              </FeatureCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <InfoCard>
            <CardContent sx={{ p: 4 }}>
              <InfoTitle>
                <TrendingUp sx={{ mr: 1.5, fontSize: '1.4rem' }} />
                Getting Started
              </InfoTitle>
              
              <InfoListItem>
                Click "Add New Student" to create a new internship record with complete student details.
              </InfoListItem>
              
              <InfoListItem>
                Use "Student Records" to view, edit and manage all submitted records.
              </InfoListItem>
              
              <InfoListItem>
                Check "Student Analytics" for performance insights and statistics.
              </InfoListItem>
              
              <Divider sx={{ my: 3, opacity: 0.6 }} />
              
              <InfoTitle>
                Pro Tips
              </InfoTitle>
              
              <InfoListItem>
                Fill out all required fields marked with an asterisk (*).
              </InfoListItem>
              
              <InfoListItem>
                Keep student contact information up to date.
              </InfoListItem>
              
              <InfoListItem>
                Regularly review and verify submitted records.
              </InfoListItem>
            </CardContent>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Floating Help Button */}
      <Tooltip 
        title="Need Help?" 
        placement="left" 
        arrow 
        TransitionComponent={Zoom}
      >
        <FloatingHelpButton
          onClick={handleHelpClick}
          aria-label="Get Help"
        >
          <HelpOutline sx={{ fontSize: '28px' }} />
        </FloatingHelpButton>
      </Tooltip>
    </DashboardContainer>
  );
}

export default UserDashboard;
