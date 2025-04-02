import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress } from '@mui/material';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config';

function CompanyMetrics() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState({});
  const [years, setYears] = useState([]);
  const [semesters] = useState(['1st', '2nd', 'Summer']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    const setupRealtimeListener = () => {
      try {
        if (!db) {
          console.log('Waiting for database initialization...');
          return;
        }

        const evaluationsRef = collection(db, 'companyEvaluations');
        
        unsubscribe = onSnapshot(evaluationsRef, (snapshot) => {
          if (!isMounted) return;
        
        const data = {
          companies: new Set(),
          years: new Set(),
          evaluations: {}
        };

        snapshot.docs.forEach(doc => {
          const evaluation = doc.data();
          
            if (evaluation.status !== 'submitted') return;

          const { companyName, schoolYear, semester } = evaluation;

          data.companies.add(companyName);
          data.years.add(schoolYear);

          if (!data.evaluations[companyName]) {
            data.evaluations[companyName] = {};
          }
          if (!data.evaluations[companyName][schoolYear]) {
            data.evaluations[companyName][schoolYear] = {};
          }
          if (!data.evaluations[companyName][schoolYear][semester]) {
            data.evaluations[companyName][schoolYear][semester] = [];
          }

            // Store evaluation with exact database structure
          data.evaluations[companyName][schoolYear][semester].push({
              workEnvironmentData: [
                {
                  aspect: 'Workstation',
                  rating: evaluation.workEnvironment?.workstation || 0,
                  category: 'Environment',
                  description: 'Evaluation of ergonomic design, space allocation, and overall functionality of assigned work areas'
                },
                {
                  aspect: 'Resources',
                  rating: evaluation.workEnvironment?.resources || 0,
                  category: 'Support',
                  description: 'Assessment of availability, quality, and accessibility of essential tools and equipment for task execution'
                },
                {
                  aspect: 'Safety',
                  rating: evaluation.workEnvironment?.safety || 0,
                  category: 'Environment',
                  description: 'Analysis of implemented safety protocols, emergency preparedness, and workplace hazard mitigation'
                },
                {
                  aspect: 'Workload',
                  rating: evaluation.workEnvironment?.workload || 0,
                  category: 'Management',
                  description: 'Measurement of task distribution balance, time management requirements, and work intensity levels'
                }
              ],
              performanceData: [
                {
                  aspect: 'Supervision',
                  rating: evaluation.performanceSupport?.supervision || 0,
                  category: 'Support',
                  description: 'Evaluation of leadership effectiveness, guidance quality, and managerial support provided'
                },
                {
                  aspect: 'Feedback',
                  rating: evaluation.performanceSupport?.feedback || 0,
                  category: 'Development',
                  description: 'Assessment of constructive criticism frequency, clarity, and actionable insights provided'
                },
                {
                  aspect: 'Training',
                  rating: evaluation.performanceSupport?.training || 0,
                  category: 'Development',
                  description: 'Analysis of professional development opportunities, skill enhancement programs, and training effectiveness'
                },
                {
                  aspect: 'Mentorship',
                  rating: evaluation.performanceSupport?.mentorship || 0,
                  category: 'Support',
                  description: 'Evaluation of career guidance quality, knowledge transfer effectiveness, and professional relationship building'
                }
              ],
              experienceData: [
                {
                  aspect: 'Relevance',
                  rating: evaluation.experienceQuality?.relevance || 0,
                  category: 'Value',
                  description: 'Assessment of alignment between internship tasks and academic/career development objectives'
                },
                {
                  aspect: 'Skills',
                  rating: evaluation.experienceQuality?.skills || 0,
                  category: 'Growth',
                  description: 'Measurement of technical and soft skill acquisition through practical application and professional exposure'
                },
                {
                  aspect: 'Growth',
                  rating: evaluation.experienceQuality?.growth || 0,
                  category: 'Development',
                  description: 'Evaluation of personal and professional development opportunities and career advancement potential'
                },
                {
                  aspect: 'Satisfaction',
                  rating: evaluation.experienceQuality?.satisfaction || 0,
                  category: 'Experience',
                  description: 'Comprehensive assessment of overall internship experience quality and professional fulfillment'
                }
              ],
              trendData: [{
                month: new Date(evaluation.submittedAt?.toDate()).toLocaleString('default', { month: 'long' }),
                satisfaction: evaluation.overall?.averageRating || 0,
                engagement: (evaluation.overall?.totalScore || 0) / (evaluation.overall?.maxPossibleScore || 60) * 5
              }]
            });
          });

          if (isMounted) {
        setCompanies(Array.from(data.companies).map(name => ({ id: name, name })));
        setEvaluationsData(data.evaluations);
        setYears(Array.from(data.years).sort());
            
            const yearsArray = Array.from(data.years).sort();
            const companiesArray = Array.from(data.companies);

            // Set initial values only if needed
            if (!selectedYear || !yearsArray.includes(selectedYear)) {
              const latestYear = yearsArray.pop();
              setSelectedYear(latestYear || '');
            }
            
            if (!selectedCompany || !companiesArray.includes(selectedCompany)) {
              const firstCompany = companiesArray[0];
              setSelectedCompany(firstCompany || '');
            }

            if (!selectedSemester) {
              setSelectedSemester('1st');
            }
            
            setLoading(false);
          }
        }, (error) => {
          console.error('Error in real-time listener:', error);
          if (isMounted) {
            setError(error.message);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error setting up listener:', error);
        if (isMounted) {
        setError(error.message);
        setLoading(false);
        }
      }
    };

    setupRealtimeListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedYear, selectedCompany, selectedSemester]);

  // Update the getFilteredData function
  const getFilteredData = (dataType) => {
    if (!selectedCompany || !selectedYear || !selectedSemester) return [];
    
    const evaluations = evaluationsData[selectedCompany]?.[selectedYear]?.[selectedSemester] || [];
    
    if (evaluations.length === 0) return [];

    // Calculate averages for multiple evaluations
    const averagedData = evaluations.reduce((acc, evaluation, index) => {
      if (index === 0) return evaluation[dataType];

      return evaluation[dataType].map((item, i) => ({
        ...item,
        rating: (acc[i].rating + item.rating) / 2
      }));
    }, []);

    return averagedData;
  };

  // Update the CompanySelector to remove "All Companies" option
  const CompanySelector = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="company-select-label">Select Company</InputLabel>
            <Select
              labelId="company-select-label"
              id="company-select"
              value={selectedCompany}
              label="Select Company"
              onChange={(e) => setSelectedCompany(e.target.value)}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>School Year</InputLabel>
            <Select
              value={selectedYear}
              label="School Year"
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Semester</InputLabel>
            <Select
              value={selectedSemester}
              label="Semester"
              onChange={(e) => setSelectedSemester(e.target.value)}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
            >
              {semesters.map((sem) => (
                <MenuItem key={sem} value={sem}>{sem}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {selectedCompany && (
        <Grid item xs={12}>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#800000', fontWeight: 'bold' }}>
                {companies.find(c => c.id === selectedCompany)?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedYear} - {selectedSemester} Semester
            </Typography>
          </Box>
        </Grid>
        )}
      </Grid>
    </Paper>
  );

  // Get rating color based on score
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#2e7d32'; // Green for Excellent
    if (rating >= 4.0) return '#1976d2'; // Blue for Good
    return '#ed6c02'; // Orange for Needs Improvement
  };

  // Get rating text based on score
  const getRatingText = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Good';
    return 'Needs Improvement';
  };

  // Get background color for rating badge
  const getRatingBgColor = (rating) => {
    if (rating >= 4.5) return '#e8f5e9'; // Light green
    if (rating >= 4.0) return '#e3f2fd'; // Light blue
    return '#fff3e0'; // Light orange
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <CompanySelector />
      </Grid>

      {getFilteredData('workEnvironmentData').length === 0 && (
        <Grid item xs={12}>
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#800000' }}>
              No data available. Please select a different semester.
            </Typography>
          </Box>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Work Environment Assessment
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Evaluation of workplace atmosphere, culture, and employee engagement
            </Typography>
            <Grid container spacing={3}>
              {/* Work Environment Cards */}
              {getFilteredData('workEnvironmentData').map((metric) => (
                <Grid item xs={12} md={6} lg={3} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold' }}>
                            {metric.aspect}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              bgcolor: getRatingBgColor(metric.rating),
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block',
                              mt: 1
                            }}
                          >
                            {metric.category}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: getRatingColor(metric.rating),
                            fontWeight: 'bold',
                            ml: 2
                          }}
                        >
                          {metric.rating.toFixed(1)}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>

                      <Box sx={{ 
                        mt: 'auto',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getRatingBgColor(metric.rating),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: getRatingColor(metric.rating),
                          fontWeight: 'bold'
                        }}>
                          {getRatingText(metric.rating)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          out of 5.0
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Performance Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Detailed evaluation of work performance and efficiency metrics
            </Typography>
            <Grid container spacing={3}>
              {/* Performance Metrics Cards */}
              {getFilteredData('performanceData').map((metric) => (
                <Grid item xs={12} md={6} lg={3} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold', flex: 1 }}>
                          {metric.aspect}
                        </Typography>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: getRatingColor(metric.rating),
                            fontWeight: 'bold'
                          }}
                        >
                          {metric.rating.toFixed(1)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>
                      
                      <Box sx={{ 
                        mt: 2, 
                        p: 1, 
                        borderRadius: 1,
                        bgcolor: getRatingBgColor(metric.rating)
                      }}>
                        <Typography variant="caption" sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: getRatingColor(metric.rating)
                        }}>
                          <span>Category: {metric.category}</span>
                          <span>
                            {getRatingText(metric.rating)}
                          </span>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Overall Experience & Impact
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Comprehensive evaluation of company effectiveness and student satisfaction
            </Typography>
            <Grid container spacing={3}>
              {/* Experience Metrics Cards */}
              {getFilteredData('experienceData').map((metric) => (
                <Grid item xs={12} md={6} lg={3} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: '#800000', fontWeight: 'bold' }}>
                        {metric.aspect}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <Typography variant="h4" sx={{ 
                          color: getRatingColor(metric.rating),
                          fontWeight: 'bold'
                        }}>
                          {metric.rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          out of 5.0
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        mt: 1,
                        color: getRatingColor(metric.rating)
                      }}>
                        {getRatingText(metric.rating)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CompanyMetrics; 