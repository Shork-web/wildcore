import React from 'react';
import { Container, Grid, Typography, Box, Card, CardContent, IconButton, Divider, Tooltip, Zoom } from '@mui/material';
import { styled } from '@mui/system';
import { Assignment, History, HelpOutline, EmojiEvents, TrendingUp, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
  position: 'relative',
  '@media (max-width: 600px)': {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  background: 'linear-gradient(45deg, #800000 30%, #CC0000 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(1),
  fontSize: '2.5rem',
  letterSpacing: '-0.5px',
  '@media (max-width: 600px)': {
    fontSize: '2rem',
  },
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(0, 0, 0, 0.6)',
  marginBottom: theme.spacing(5),
  fontSize: '1.1rem',
  maxWidth: '700px',
  lineHeight: 1.6,
  '@media (max-width: 600px)': {
    fontSize: '1rem',
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '24px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  '&:hover': {
    transform: 'translateY(-12px)',
    boxShadow: '0 22px 43px rgba(128, 0, 0, 0.2)',
    '& .icon-circle': {
      transform: 'rotate(10deg) scale(1.1)',
      boxShadow: '0 12px 30px rgba(128, 0, 0, 0.3)',
    },
    '&::before': {
      height: '100%',
      opacity: 1,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '6px',
    height: '0%',
    background: 'linear-gradient(180deg, #800000, #FF4444)',
    opacity: 0,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.4rem',
  background: 'linear-gradient(45deg, #800000, #CC0000)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(2),
  letterSpacing: '-0.5px',
}));

const CardDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(0, 0, 0, 0.7)',
  fontSize: '0.95rem',
  marginBottom: theme.spacing(3),
  lineHeight: 1.7,
}));

const CardAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: 'auto',
}));

const ActionButton = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.2, 2.5),
  background: 'linear-gradient(45deg, #800000, #CC0000)',
  color: 'white',
  fontSize: '0.9rem',
  fontWeight: '600',
  borderRadius: '40px',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 6px 20px rgba(128, 0, 0, 0.25)',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(128, 0, 0, 0.35)',
    transform: 'translateX(8px)',
  },
}));

const IconCircle = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #800000, #CC0000)',
  color: 'white',
  width: 64,
  height: 64,
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  boxShadow: '0 12px 25px rgba(128, 0, 0, 0.25)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '& svg': {
    fontSize: '28px',
  },
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 16px 40px rgba(128, 0, 0, 0.15)',
    transform: 'translateY(-8px)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(128, 0, 0, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '0 0 0 120px',
    zIndex: 0,
  },
}));

const InfoTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.3rem',
  background: 'linear-gradient(45deg, #800000, #CC0000)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  letterSpacing: '-0.5px',
}));

const InfoListItem = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  marginBottom: theme.spacing(2.5),
  paddingLeft: theme.spacing(2.5),
  position: 'relative',
  lineHeight: 1.7,
  color: 'rgba(0, 0, 0, 0.75)',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '10px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#800000',
    transition: 'transform 0.2s ease',
  },
  '&:hover': {
    color: '#800000',
    '&::before': {
      transform: 'scale(1.5)',
    }
  },
  transition: 'color 0.2s ease',
}));

const BackgroundGradient = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '5%',
  right: '2%',
  width: '400px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(128, 0, 0, 0.03) 0%, rgba(255, 255, 255, 0) 70%)',
  borderRadius: '50%',
  zIndex: -1,
  animation: 'pulse 8s ease-in-out infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 0.5,
    },
    '50%': {
      transform: 'scale(1.2)',
      opacity: 0.8,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 0.5,
    },
  },
}));

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
  </svg>
);

const FloatingHelpButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '40px',
  right: '40px',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #800000, #CC0000)',
  color: 'white',
  boxShadow: '0 6px 25px rgba(128, 0, 0, 0.35)',
  zIndex: 1000,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.15) rotate(15deg)',
    boxShadow: '0 8px 30px rgba(128, 0, 0, 0.45)',
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
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <Title variant="h3">WILD R.O.U.T.E</Title>
        <Subtitle variant="body1">
          Work-Integrated Learning and Development – Records of OJT, Updates, Training & Evaluation
        </Subtitle>
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
