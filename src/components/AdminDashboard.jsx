import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Box, List, ListItem, ListItemText, 
  useTheme, useMediaQuery, Card, CardContent, Divider,
  IconButton, Fade
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  PeopleAlt, School, WomanRounded, ManRounded,
  TrendingUp, Assessment, CalendarToday
} from '@mui/icons-material';
import { db } from '../firebase-config';
import { collection, query, onSnapshot } from 'firebase/firestore';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
}));

const StatIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: 'linear-gradient(45deg, #800000, #FFD700)',
  color: '#fff',
  marginBottom: theme.spacing(1),
  boxShadow: '0 4px 20px rgba(128, 0, 0, 0.2)',
}));

const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  position: 'relative',
}));

class DashboardManager {
  constructor() {
    this._students = [];
    this._stats = {
      totalStudents: 0,
      genderDistribution: { Male: 0, Female: 0, Other: 0 },
      programDistribution: {},
      semesterDistribution: { First: 0, Second: 0, Summer: 0 },
      recentActivity: []
    };
  }

  // Getters
  get students() { return [...this._students]; }
  get stats() { return { ...this._stats }; }
  get totalStudents() { return this._stats.totalStudents; }
  get genderDistribution() { return { ...this._stats.genderDistribution }; }
  get programDistribution() { return { ...this._stats.programDistribution }; }
  get semesterDistribution() { return { ...this._stats.semesterDistribution }; }
  get recentActivity() { return [...this._stats.recentActivity]; }
  get totalPrograms() { return Object.keys(this._stats.programDistribution).length; }

  // Setters
  set students(data) {
    this._students = [...data];
    this._updateStats();
  }

  // Methods
  _updateStats() {
    const genderDist = { Male: 0, Female: 0, Other: 0 };
    const programDist = {};
    const semesterDist = { First: 0, Second: 0, Summer: 0 };

    this._students.forEach(student => {
      // Gender distribution
      genderDist[student.gender] = (genderDist[student.gender] || 0) + 1;

      // Program distribution
      programDist[student.program] = (programDist[student.program] || 0) + 1;

      // Semester distribution
      semesterDist[student.semester] = (semesterDist[student.semester] || 0) + 1;
    });

    // Sort program distribution by count
    const sortedProgramDist = Object.fromEntries(
      Object.entries(programDist).sort(([,a], [,b]) => b - a)
    );

    this._stats = {
      totalStudents: this._students.length,
      genderDistribution: genderDist,
      programDistribution: sortedProgramDist,
      semesterDistribution: semesterDist,
      recentActivity: this._students
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
  }

  getPercentage(value, total) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}

function AdminDashboard() {
  const [dashboardManager] = useState(() => new DashboardManager());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, forceUpdate] = useState();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const q = query(collection(db, 'studentData'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dashboardManager.students = studentsList;
        setLoading(false);
        forceUpdate({}); // Force re-render when data changes
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dashboardManager]);

  const StatItem = ({ icon, value, label }) => (
    <Grid item xs={12} sm={6} md={3}>
      <StyledCard>
        <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
          <StatIcon>
            {React.cloneElement(icon, { fontSize: isMobile ? "small" : "medium" })}
          </StatIcon>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="div" 
            gutterBottom
            sx={{
              background: 'linear-gradient(45deg, #800000, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              mb: 1
            }}
          >
            {value}
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            {label}
          </Typography>
        </CardContent>
      </StyledCard>
    </Grid>
  );

  const DistributionList = ({ title, data, icon }) => (
    <StyledCard>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            size="small"
            sx={{ 
              mr: 1,
              background: 'linear-gradient(45deg, #800000, #FFD700)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #600000, #DFB700)',
              }
            }}
          >
            {icon}
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#800000',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box 
          sx={{ 
            maxHeight: '300px',
            overflowY: 'auto',
            msOverflowStyle: 'none',  // Hide scrollbar for IE and Edge
            scrollbarWidth: 'none',   // Hide scrollbar for Firefox
            '&::-webkit-scrollbar': { // Hide scrollbar for Chrome, Safari, and Opera
              display: 'none'
            },
          }}
        >
          <List dense>
            {Object.entries(data).map(([key, value], index) => (
              <React.Fragment key={key}>
                <ListItem sx={{ py: 1, position: 'relative' }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {key}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {`${value} student${value !== 1 ? 's' : ''}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                          ({dashboardManager.getPercentage(value, dashboardManager.totalStudents)}%)
                        </Typography>
                      </Box>
                    }
                  />
                  <Box
                    sx={{
                      width: `${(value / Math.max(...Object.values(data))) * 100}%`,
                      height: 3,
                      background: 'linear-gradient(45deg, #800000, #FFD700)',
                      borderRadius: 1,
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      transition: 'width 0.6s ease-in-out',
                    }}
                  />
                </ListItem>
                {index < Object.entries(data).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </CardContent>
    </StyledCard>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <DashboardContainer maxWidth="lg">
        <Typography 
          variant="h4" 
          align="center" 
          sx={{
            mb: 3,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #800000, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Analytics Dashboard
        </Typography>

        <Grid container spacing={2}>
          <StatItem 
            icon={<PeopleAlt />}
            value={dashboardManager.totalStudents}
            label="Total Students"
          />
          <StatItem 
            icon={<ManRounded />}
            value={dashboardManager.genderDistribution.Male}
            label="Male Students"
          />
          <StatItem 
            icon={<WomanRounded />}
            value={dashboardManager.genderDistribution.Female}
            label="Female Students"
          />
          <StatItem 
            icon={<School />}
            value={dashboardManager.totalPrograms}
            label="Total Programs"
          />

          <Grid item xs={12} md={4}>
            <DistributionList 
              title="Programs Distribution" 
              data={dashboardManager.programDistribution}
              icon={<Assessment />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DistributionList 
              title="Semester Distribution" 
              data={dashboardManager.semesterDistribution}
              icon={<CalendarToday />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton 
                    sx={{ 
                      mr: 2,
                      background: 'linear-gradient(45deg, #800000, #FFD700)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #600000, #DFB700)',
                      }
                    }}
                  >
                    <TrendingUp />
                  </IconButton>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#800000',
                      fontWeight: 'bold'
                    }}
                  >
                    Recent Activity
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    maxHeight: '300px',
                    overflowY: 'auto',
                    msOverflowStyle: 'none',  // Hide scrollbar for IE and Edge
                    scrollbarWidth: 'none',   // Hide scrollbar for Firefox
                    '&::-webkit-scrollbar': { // Hide scrollbar for Chrome, Safari, and Opera
                      display: 'none'
                    },
                  }}
                >
                  {dashboardManager.recentActivity.length > 0 ? (
                    <List>
                      {dashboardManager.recentActivity.map((activity, index) => (
                        <React.Fragment key={index}>
                          <ListItem sx={{ py: 2 }}>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  {`${activity.name} - ${activity.program}`}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                  {`${activity.partnerCompany} (${new Date(activity.startDate).toLocaleDateString()} - ${new Date(activity.endDate).toLocaleDateString()})`}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < dashboardManager.recentActivity.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1">No recent activity to display.</Typography>
                  )}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </DashboardContainer>
    </Fade>
  );
}

export default AdminDashboard;
