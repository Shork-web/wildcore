import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress, Chip } from '@mui/material';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { keyframes } from '@mui/system';
import { FilterAlt } from '@mui/icons-material';

// Define rotation animations
const rotateOuter = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const rotateInner = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
`;

function CompanyMetrics() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState({});
  const [years, setYears] = useState([]);
  const [semesters] = useState(['1st', '2nd', 'Summer']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFinal, unsubscribeMidterm;

    const setupRealtimeListeners = () => {
      try {
        if (!db) {
          console.log('Waiting for database initialization...');
          return;
        }

        // Combined data structure to store both final and midterm evaluations
        const data = {
          companies: new Set(),
          years: new Set(),
          evaluations: {},
          evaluationTypes: {
            final: {},
            midterm: {}
          }
        };

        // First listener: final evaluations
        const finalEvaluationsRef = collection(db, 'companyEvaluations_final');
        unsubscribeFinal = onSnapshot(finalEvaluationsRef, (snapshot) => {
          if (!isMounted) return;
        
          snapshot.docs.forEach(doc => {
            const evaluation = doc.data();
            
            if (evaluation.status !== 'submitted') return;

            const { companyName, schoolYear, semester } = evaluation;

            // Track metadata
            data.companies.add(companyName);
            data.years.add(schoolYear);

            // Store in type-specific structure for combining later
            if (!data.evaluationTypes.final[companyName]) {
              data.evaluationTypes.final[companyName] = {};
            }
            if (!data.evaluationTypes.final[companyName][schoolYear]) {
              data.evaluationTypes.final[companyName][schoolYear] = {};
            }
            if (!data.evaluationTypes.final[companyName][schoolYear][semester]) {
              data.evaluationTypes.final[companyName][schoolYear][semester] = [];
            }

            // Store evaluation with exact database structure
            data.evaluationTypes.final[companyName][schoolYear][semester].push({
              workEnvironmentData: [
                {
                  aspect: 'Workstation',
                  rating: Math.min(evaluation.workEnvironment?.workstation || 0, 5.0),
                  category: 'Environment',
                  description: 'Evaluation of ergonomic design, space allocation, and overall functionality of assigned work areas'
                },
                {
                  aspect: 'Resources',
                  rating: Math.min(evaluation.workEnvironment?.resources || 0, 5.0),
                  category: 'Support',
                  description: 'Assessment of availability, quality, and accessibility of essential tools and equipment for task execution'
                },
                {
                  aspect: 'Safety',
                  rating: Math.min(evaluation.workEnvironment?.safety || 0, 5.0),
                  category: 'Environment',
                  description: 'Analysis of implemented safety protocols, emergency preparedness, and workplace hazard mitigation'
                },
                {
                  aspect: 'Workload',
                  rating: Math.min(evaluation.workEnvironment?.workload || 0, 5.0),
                  category: 'Management',
                  description: 'Measurement of task distribution balance, time management requirements, and work intensity levels'
                }
              ],
              performanceData: [
                {
                  aspect: 'Supervision',
                  rating: Math.min(evaluation.performanceSupport?.supervision || 0, 5.0),
                  category: 'Support',
                  description: 'Evaluation of leadership effectiveness, guidance quality, and managerial support provided'
                },
                {
                  aspect: 'Feedback',
                  rating: Math.min(evaluation.performanceSupport?.feedback || 0, 5.0),
                  category: 'Development',
                  description: 'Assessment of constructive criticism frequency, clarity, and actionable insights provided'
                },
                {
                  aspect: 'Training',
                  rating: Math.min(evaluation.performanceSupport?.training || 0, 5.0),
                  category: 'Development',
                  description: 'Analysis of professional development opportunities, skill enhancement programs, and training effectiveness'
                },
                {
                  aspect: 'Mentorship',
                  rating: Math.min(evaluation.performanceSupport?.mentorship || 0, 5.0),
                  category: 'Support',
                  description: 'Evaluation of career guidance quality, knowledge transfer effectiveness, and professional relationship building'
                }
              ],
              experienceData: [
                {
                  aspect: 'Relevance',
                  rating: Math.min(evaluation.experienceQuality?.relevance || 0, 5.0),
                  category: 'Value',
                  description: 'Assessment of alignment between internship tasks and academic/career development objectives'
                },
                {
                  aspect: 'Skills',
                  rating: Math.min(evaluation.experienceQuality?.skills || 0, 5.0),
                  category: 'Growth',
                  description: 'Measurement of technical and soft skill acquisition through practical application and professional exposure'
                },
                {
                  aspect: 'Growth',
                  rating: Math.min(evaluation.experienceQuality?.growth || 0, 5.0),
                  category: 'Development',
                  description: 'Evaluation of personal and professional development opportunities and career advancement potential'
                },
                {
                  aspect: 'Satisfaction',
                  rating: Math.min(evaluation.experienceQuality?.satisfaction || 0, 5.0),
                  category: 'Experience',
                  description: 'Comprehensive assessment of overall internship experience quality and professional fulfillment'
                }
              ],
              trendData: [{
                month: new Date(evaluation.submittedAt?.toDate()).toLocaleString('default', { month: 'long' }),
                satisfaction: Math.min(evaluation.overall?.averageRating || 0, 5.0),
                engagement: Math.min((evaluation.overall?.totalScore || 0) / (evaluation.overall?.maxPossibleScore || 60) * 5, 5.0)
              }],
              surveyType: 'final' // Mark the evaluation type
            });
          });

          processCombinedData();
        }, handleFirestoreError);

        // Second listener: midterm evaluations
        const midtermEvaluationsRef = collection(db, 'companyEvaluations_midterm');
        unsubscribeMidterm = onSnapshot(midtermEvaluationsRef, (snapshot) => {
          if (!isMounted) return;
        
          snapshot.docs.forEach(doc => {
            const evaluation = doc.data();
            
            if (evaluation.status !== 'submitted') return;

            const { companyName, schoolYear, semester } = evaluation;

            // Track metadata
            data.companies.add(companyName);
            data.years.add(schoolYear);

            // Store in type-specific structure for combining later
            if (!data.evaluationTypes.midterm[companyName]) {
              data.evaluationTypes.midterm[companyName] = {};
            }
            if (!data.evaluationTypes.midterm[companyName][schoolYear]) {
              data.evaluationTypes.midterm[companyName][schoolYear] = {};
            }
            if (!data.evaluationTypes.midterm[companyName][schoolYear][semester]) {
              data.evaluationTypes.midterm[companyName][schoolYear][semester] = [];
            }

            // Store evaluation with exact database structure
            data.evaluationTypes.midterm[companyName][schoolYear][semester].push({
              workEnvironmentData: [
                {
                  aspect: 'Workstation',
                  rating: Math.min(evaluation.workEnvironment?.workstation || 0, 5.0),
                  category: 'Environment',
                  description: 'Evaluation of ergonomic design, space allocation, and overall functionality of assigned work areas'
                },
                {
                  aspect: 'Resources',
                  rating: Math.min(evaluation.workEnvironment?.resources || 0, 5.0),
                  category: 'Support',
                  description: 'Assessment of availability, quality, and accessibility of essential tools and equipment for task execution'
                },
                {
                  aspect: 'Safety',
                  rating: Math.min(evaluation.workEnvironment?.safety || 0, 5.0),
                  category: 'Environment',
                  description: 'Analysis of implemented safety protocols, emergency preparedness, and workplace hazard mitigation'
                },
                {
                  aspect: 'Workload',
                  rating: Math.min(evaluation.workEnvironment?.workload || 0, 5.0),
                  category: 'Management',
                  description: 'Measurement of task distribution balance, time management requirements, and work intensity levels'
                }
              ],
              performanceData: [
                {
                  aspect: 'Supervision',
                  rating: Math.min(evaluation.performanceSupport?.supervision || 0, 5.0),
                  category: 'Support',
                  description: 'Evaluation of leadership effectiveness, guidance quality, and managerial support provided'
                },
                {
                  aspect: 'Feedback',
                  rating: Math.min(evaluation.performanceSupport?.feedback || 0, 5.0),
                  category: 'Development',
                  description: 'Assessment of constructive criticism frequency, clarity, and actionable insights provided'
                },
                {
                  aspect: 'Training',
                  rating: Math.min(evaluation.performanceSupport?.training || 0, 5.0),
                  category: 'Development',
                  description: 'Analysis of professional development opportunities, skill enhancement programs, and training effectiveness'
                },
                {
                  aspect: 'Mentorship',
                  rating: Math.min(evaluation.performanceSupport?.mentorship || 0, 5.0),
                  category: 'Support',
                  description: 'Evaluation of career guidance quality, knowledge transfer effectiveness, and professional relationship building'
                }
              ],
              experienceData: [
                {
                  aspect: 'Relevance',
                  rating: Math.min(evaluation.experienceQuality?.relevance || 0, 5.0),
                  category: 'Value',
                  description: 'Assessment of alignment between internship tasks and academic/career development objectives'
                },
                {
                  aspect: 'Skills',
                  rating: Math.min(evaluation.experienceQuality?.skills || 0, 5.0),
                  category: 'Growth',
                  description: 'Measurement of technical and soft skill acquisition through practical application and professional exposure'
                },
                {
                  aspect: 'Growth',
                  rating: Math.min(evaluation.experienceQuality?.growth || 0, 5.0),
                  category: 'Development',
                  description: 'Evaluation of personal and professional development opportunities and career advancement potential'
                },
                {
                  aspect: 'Satisfaction',
                  rating: Math.min(evaluation.experienceQuality?.satisfaction || 0, 5.0),
                  category: 'Experience',
                  description: 'Comprehensive assessment of overall internship experience quality and professional fulfillment'
                }
              ],
              trendData: [{
                month: new Date(evaluation.submittedAt?.toDate()).toLocaleString('default', { month: 'long' }),
                satisfaction: Math.min(evaluation.overall?.averageRating || 0, 5.0),
                engagement: Math.min((evaluation.overall?.totalScore || 0) / (evaluation.overall?.maxPossibleScore || 60) * 5, 5.0)
              }],
              surveyType: 'midterm' // Mark the evaluation type
            });
          });

          processCombinedData();
        }, handleFirestoreError);

        // Process and combine both types of evaluations with 50-50 weighting
        function processCombinedData() {
          if (!isMounted) return;

          // Create a combined evaluations object with merged data
          data.evaluations = {};

          // Iterate through all companies
          Array.from(data.companies).forEach(company => {
            data.evaluations[company] = {};

            // Iterate through all years for this company
            Array.from(data.years).forEach(year => {
              const finalData = data.evaluationTypes.final[company]?.[year] || {};
              const midtermData = data.evaluationTypes.midterm[company]?.[year] || {};

              // Combine or initialize the year for this company
              data.evaluations[company][year] = {};

              // Get all semesters from both data types
              const allSemesters = new Set([
                ...Object.keys(finalData),
                ...Object.keys(midtermData)
              ]);

              // For each semester, combine the evaluations
              Array.from(allSemesters).forEach(semester => {
                const finalEvals = finalData[semester] || [];
                const midtermEvals = midtermData[semester] || [];

                // Handle different survey type selection cases
                if (selectedSurveyType === 'final' && finalEvals.length === 0) {
                  return; // Skip if no final surveys and only final is selected
                }
                if (selectedSurveyType === 'midterm' && midtermEvals.length === 0) {
                  return; // Skip if no midterm surveys and only midterm is selected
                }

                data.evaluations[company][year][semester] = [];

                // Based on selected filter type, choose which data to use
                if (selectedSurveyType === 'final') {
                  data.evaluations[company][year][semester] = finalEvals;
                } else if (selectedSurveyType === 'midterm') {
                  data.evaluations[company][year][semester] = midtermEvals;
                } else {
                  // Handle the "combined" case - apply 50-50 weighting
                  if (finalEvals.length > 0 && midtermEvals.length > 0) {
                    // Create a combined evaluation with 50-50 weighting
                    const combinedEval = combineSurveys(finalEvals, midtermEvals);
                    data.evaluations[company][year][semester] = [combinedEval];
                  } else if (finalEvals.length > 0) {
                    // If only final data available
                    data.evaluations[company][year][semester] = finalEvals;
                  } else if (midtermEvals.length > 0) {
                    // If only midterm data available
                    data.evaluations[company][year][semester] = midtermEvals;
                  }
                }
              });
            });
          });

          // Update the component state with combined data
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
      } catch (error) {
        console.error('Error setting up listeners:', error);
        if (isMounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    // Error handler for Firestore
    const handleFirestoreError = (error) => {
      console.error('Error in real-time listener:', error);
      if (isMounted) {
        setError(error.message);
        setLoading(false);
      }
    };

    // Function to combine surveys with 50-50 weighting
    const combineSurveys = (finalEvals, midtermEvals) => {
      // Process data sections and apply 50-50 weighting to each aspect
      const combinedEval = {
        surveyType: 'combined',
        hasBothTypes: true
      };

      // Helper function to combine a data section with weighting
      const combineDataSection = (sectionName) => {
        const finalData = finalEvals.length > 0 ? 
          getAveragedData(finalEvals, sectionName) : null;
        
        const midtermData = midtermEvals.length > 0 ? 
          getAveragedData(midtermEvals, sectionName) : null;

        // If only one type exists, use that one
        if (!finalData) return midtermData;
        if (!midtermData) return finalData;

        // Both exist, apply 50-50 weighting
        return finalData.map((item, index) => {
          const midtermItem = midtermData[index];
          return {
            ...item,
            rating: (item.rating * 0.5) + (midtermItem.rating * 0.5),
            fromBothTypes: true // Flag to indicate this is a weighted value
          };
        });
      };

      // Get averaged data for a section from multiple evaluations
      function getAveragedData(evaluations, sectionName) {
        return evaluations.reduce((acc, evaluation, index) => {
          if (index === 0) return evaluation[sectionName];

          return evaluation[sectionName].map((item, i) => ({
            ...item,
            rating: Math.min((acc[i].rating + item.rating) / 2, 5.0)
          }));
        }, []);
      }

      // Combine all data sections
      combinedEval.workEnvironmentData = combineDataSection('workEnvironmentData');
      combinedEval.performanceData = combineDataSection('performanceData');
      combinedEval.experienceData = combineDataSection('experienceData');
      
      // For trend data, just use the most recent one for now
      combinedEval.trendData = finalEvals[0]?.trendData || midtermEvals[0]?.trendData || [];

      return combinedEval;
    };

    setupRealtimeListeners();

    return () => {
      isMounted = false;
      if (unsubscribeFinal) {
        unsubscribeFinal();
      }
      if (unsubscribeMidterm) {
        unsubscribeMidterm();
      }
    };
  }, [selectedYear, selectedCompany, selectedSemester, selectedSurveyType]);

  // Update the getFilteredData function
  const getFilteredData = (dataType) => {
    if (!selectedCompany || !selectedYear || !selectedSemester) return [];
    
    const evaluations = evaluationsData[selectedCompany]?.[selectedYear]?.[selectedSemester] || [];
    
    if (evaluations.length === 0) return [];

    // If evaluations exist, just get the first one's data
    // (We've already combined or filtered the evaluations in the useEffect)
    return evaluations[0]?.[dataType] || [];
  };

  // Update the CompanySelector to add survey type filter
  const CompanySelector = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Evaluation Type</InputLabel>
            <Select
              value={selectedSurveyType}
              label="Evaluation Type"
              onChange={(e) => setSelectedSurveyType(e.target.value)}
              startAdornment={<FilterAlt sx={{ color: 'rgba(128, 0, 0, 0.54)', mr: 1, ml: -0.5 }} fontSize="small" />}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
            >
              <MenuItem value="all">All Evaluations</MenuItem>
              <MenuItem value="midterm">Midterm Evaluation</MenuItem>
              <MenuItem value="final">Final Evaluation</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {selectedCompany && (
        <Grid item xs={12}>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            borderLeft: '4px solid #800000'
          }}>
            <Typography variant="subtitle1" sx={{ color: '#800000', fontWeight: 'bold' }}>
              {companies.find(c => c.id === selectedCompany)?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedYear} - {selectedSemester} Semester
            </Typography>
          </Box>
        </Grid>
        )}

        {selectedSurveyType !== 'all' && (
          <Grid item xs={12}>
            <Chip 
              icon={<FilterAlt fontSize="small" />}
              label={`${selectedSurveyType === 'midterm' ? 'Midterm' : 'Final'} Evaluation Data Only`}
              color="primary"
              sx={{ 
                bgcolor: 'rgba(128, 0, 0, 0.1)',
                color: '#800000',
                fontWeight: 'medium',
                border: '1px solid rgba(128, 0, 0, 0.2)',
                '& .MuiChip-icon': {
                  color: '#800000',
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ ml: 1, display: 'inline-block', color: 'text.secondary', fontStyle: 'italic' }}
            >
              Showing metrics from {selectedSurveyType} evaluations only
            </Typography>
          </Grid>
        )}

        {selectedSurveyType === 'all' && getFilteredData('workEnvironmentData').some(item => item.fromBothTypes) && (
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'inline-block', 
                  color: 'text.secondary', 
                  fontStyle: 'italic',
                  bgcolor: 'rgba(128, 0, 0, 0.05)',
                  p: 1,
                  borderRadius: 1
                }}
              >
                Note: When viewing 'All Evaluations', metrics use 50% weighting from each evaluation type where both are available
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
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          width: '100%',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Box 
          sx={{ 
            position: 'relative', 
            mb: 4,
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CircularProgress
            size={80}
            thickness={2}
            sx={{
              color: '#FFD700',
              position: 'absolute',
              animation: `${rotateOuter} 3s linear infinite`,
            }}
          />
          <CircularProgress
            size={60}
            thickness={3}
            sx={{
              color: '#800000',
              position: 'absolute',
              animation: `${rotateInner} 2s linear infinite`,
            }}
          />
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 2,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #800000 30%, #FFD700 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Loading Company Metrics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the company evaluation data...
        </Typography>
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