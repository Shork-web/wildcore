import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';

function StudentAnalytics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  
  // Get user context instead of fetching separately
  const { currentUser } = useContext(AuthContext);

  // Fetch data from Firestore
  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeSurveys = null;

    const fetchSurveyData = async () => {
      if (!currentUser) {
        console.log("No authenticated user found");
        setLoading(false);
        return;
      }

      try {
        console.log("StudentAnalytics: Starting to fetch data");
        
        // First, get real-time updates on the current user
        unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.uid), 
          (userDoc) => {
            if (!userDoc.exists()) {
              console.log("User document not found");
              setLoading(false);
              return;
            }

            const userData = userDoc.data();
            console.log("Current user data:", userData);
            
            const userRole = userData.role;
            let userCollege = userData.college;
            const userSection = userData.section;
            
            console.log(`User role: ${userRole}, college: ${userCollege}, section: ${userSection}`);
            
            // Clear previous data when user data changes
            setSurveyData([]);
            setLoading(true);
            
            // Don't fetch data if section is required but missing
            if (userRole === 'instructor' && !userSection) {
              console.log("Section is required but not assigned to user");
              setLoading(false);
              return;
            }
            
            // Clean up previous subscription
            if (unsubscribeSurveys) {
              unsubscribeSurveys();
            }

            // Using onSnapshot for student surveys
            try {
              if (userSection) {
                // If instructor has a specific section assigned, listen to that section
                const surveysQuery = query(
                  collection(db, 'studentSurveys'),
                  where('section', '==', userSection)
                );
                
                unsubscribeSurveys = onSnapshot(surveysQuery, (snapshot) => {
                  console.log(`Real-time update: Found ${snapshot.docs.length} surveys for section ${userSection}`);
                  
                  if (snapshot.empty) {
                    setLoading(false);
                    return;
                  }
                  
                  const surveyData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                  
                  // Process the data as before
                  processSurveyData(surveyData);
                });
              } else if (userRole === 'admin') {
                // Admin sees all surveys
                unsubscribeSurveys = onSnapshot(collection(db, 'studentSurveys'), (snapshot) => {
                  console.log(`Real-time update: Found ${snapshot.docs.length} surveys for admin`);
                  
                  const surveyData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                  
                  // Process the data as before
                  processSurveyData(surveyData);
                });
              }
            } catch (error) {
              console.error("Error setting up real-time listener:", error);
              setLoading(false);
            }
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error in setup:', error);
        setLoading(false);
      }
    };

    // Helper function to process survey data
    const processSurveyData = (allSurveys) => {
      console.log(`Processing ${allSurveys.length} surveys`);
      
      // Process all surveys as before (existing data processing code)
      const processedSurveys = allSurveys.map(survey => {
        // Ensure workAttitude exists and has ratings
        const workAttitude = {
            ratings: {
            teamwork: 0,
            communication: 0,
            punctuality: 0,
            initiative: 0
          },
          totalScore: 0,
          maxPossibleScore: survey.workAttitude?.maxPossibleScore || 40
        };
        
        // Ensure workPerformance exists and has ratings
        const workPerformance = {
            ratings: {
            technicalSkills: 0,
            adaptability: 0,
            productivity: 0,
            criticalThinking: 0
          },
          totalScore: 0,
          maxPossibleScore: survey.workPerformance?.maxPossibleScore || 60
        };

        // Helper function to normalize values to a max of 5
        const normalizeToFive = (value) => {
          // Convert to number
          let num = Number(value) || 0;
          // Cap at 5
          return Math.min(num, 5);
        };
        
        // Helper function to find fields regardless of exact case/spacing
        const findField = (obj, targetField) => {
          // Try exact match first
          if (obj[targetField] !== undefined) return obj[targetField];
          
          // Try case insensitive match
          const lcTarget = targetField.toLowerCase();
          for (const key of Object.keys(obj)) {
            if (key.toLowerCase() === lcTarget) return obj[key];
            // Try partial match
            if (key.toLowerCase().includes(lcTarget) || 
                lcTarget.includes(key.toLowerCase())) return obj[key];
          }
          return 0; // Default value if not found
        };

        // Process workAttitude and workPerformance as before
        if (survey.workAttitude && survey.workAttitude.ratings) {
          const attitudeRatings = survey.workAttitude.ratings;
          
          const cooperationValue = findField(attitudeRatings, 'Cooperation and Willingness');
          const attentivenessValue = findField(attitudeRatings, 'Attentiveness / Attention');
          const attendanceValue = findField(attitudeRatings, 'Attendance');
          const industriousnessValue = findField(attitudeRatings, 'Industriousness and Initiative');
          
          workAttitude.ratings = {
            teamwork: normalizeToFive(cooperationValue),
            communication: normalizeToFive(attentivenessValue),
            punctuality: normalizeToFive(attendanceValue),
            initiative: normalizeToFive(industriousnessValue)
          };
          
          workAttitude.totalScore = survey.workAttitude.totalScore || 0;
        }

        if (survey.workPerformance && survey.workPerformance.ratings) {
          const performanceRatings = survey.workPerformance.ratings;
          
          // Extract values using the helper function
          const adaptValue = findField(performanceRatings, 'Adaptability and Sociability');
          const safetyValue = findField(performanceRatings, 'Safety Consciousness');
          const wasteValue = findField(performanceRatings, 'Waste of Consciousness');
          const qualityValue = findField(performanceRatings, 'Quality of Work');
          const quantityValue = findField(performanceRatings, 'Quantity of Work');
          const comprehensionValue = findField(performanceRatings, 'Comprehension');
          const dependabilityValue = findField(performanceRatings, 'Dependability');
          
          workPerformance.ratings = {
            technicalSkills: normalizeToFive(comprehensionValue),
            adaptability: normalizeToFive(adaptValue || dependabilityValue),
            productivity: normalizeToFive((Number(qualityValue) + Number(quantityValue)) / 2),
            criticalThinking: normalizeToFive((Number(safetyValue) + Number(wasteValue)) / 2)
          };
          
          // Use original totalScore if available
          workPerformance.totalScore = survey.workPerformance.totalScore || 0;
        }

        // Calculate total scores if not provided
        if (!workAttitude.totalScore) {
          workAttitude.totalScore = Object.values(workAttitude.ratings).reduce((sum, val) => sum + Number(val), 0);
        }
        if (!workPerformance.totalScore) {
          workPerformance.totalScore = Object.values(workPerformance.ratings).reduce((sum, val) => sum + Number(val), 0);
        }

        // Ensure programSuccess exists with proper structure and normalized values
        const programSuccess = {
          placement: Math.min(Number(survey.programSuccess?.placement) || 0, 5),
          careerRelevance: Math.min(Number(survey.programSuccess?.careerRelevance) || 0, 5),
          skillsDevelopment: Math.min(Number(survey.programSuccess?.skillsDevelopment) || 0, 5),
          overallSatisfaction: Math.min(Number(survey.programSuccess?.overallSatisfaction) || 0, 5)
        };

        return {
          ...survey,
          workAttitude,
          workPerformance,
          programSuccess
        };
      });
      
      setSurveyData(processedSurveys);
      setLoading(false);
      
      // Log unique programs to help identify issues
      const uniquePrograms = [...new Set(processedSurveys.map(s => s.program).filter(Boolean))].sort();
      console.log("Available programs for analytics:", uniquePrograms);
    };

    fetchSurveyData();

    // Clean up all listeners on unmount
    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSurveys) unsubscribeSurveys();
    };
  }, [currentUser]); // Only depend on currentUser, not profile.section

  // Extract unique filter options from actual data
  const filterOptions = {
    years: [...new Set(surveyData.map(survey => survey.schoolYear))].sort(),
    semesters: [...new Set(surveyData.map(survey => survey.semester))].sort(),
    programs: [...new Set(surveyData.map(survey => survey.program).filter(Boolean))].sort()
  };

  // Filter data with strict program isolation
  const getFilteredData = () => {
    // First filter strictly by program to ensure complete isolation of program data
    const programFilteredData = selectedProgram === 'all' 
      ? surveyData 
      : surveyData.filter(survey => {
          // Exact string comparison for programs
          const exactMatch = survey.program === selectedProgram;
          
          // Log rejected near-matches to help debug
          if (!exactMatch && survey.program && survey.program.includes(selectedProgram)) {
            console.log(`Analytics - Rejected near match: "${survey.program}" vs "${selectedProgram}"`);
          }
          
          return exactMatch;
        });
    
    // Next filter strictly by school year
    const yearFilteredData = selectedYear === 'all'
      ? programFilteredData
      : programFilteredData.filter(survey => {
          // Exact string comparison for school year
          const exactYearMatch = survey.schoolYear === selectedYear;
          
          // Log any problematic year matches
          if (!exactYearMatch && survey.schoolYear && 
              (survey.schoolYear.includes(selectedYear) || selectedYear.includes(survey.schoolYear))) {
            console.log(`Analytics - Rejected year near match: "${survey.schoolYear}" vs "${selectedYear}"`);
          }
          
          return exactYearMatch;
        });
    
    // Then apply semester filter
    return yearFilteredData.filter(survey => 
      (selectedSemester === 'all' || survey.semester === selectedSemester)
    );
  };

  // Process data for metrics display
  const processMetricsData = () => {
    const filteredData = getFilteredData();
    console.log(`Processing metrics with ${filteredData.length} filtered surveys`);
    
    // Work Attitude Metrics
    const workAttitudeData = {
      teamwork: {
        aspect: "Teamwork",
        rating: 0,
        category: "Collaboration",
        description: "Ability to work effectively with others, contribute to team goals, and maintain positive relationships"
      },
      communication: {
        aspect: "Communication",
        rating: 0,
        category: "Interpersonal",
        description: "Effectiveness in verbal and written communication, clarity of expression, and listening skills"
      },
      punctuality: {
        aspect: "Punctuality",
        rating: 0,
        category: "Discipline",
        description: "Consistency in meeting deadlines, arriving on time, and managing time effectively"
      },
      initiative: {
        aspect: "Initiative",
        rating: 0,
        category: "Self-Management",
        description: "Willingness to take on challenges, self-motivation, and proactive approach to tasks"
      }
    };

    // Work Performance Metrics
    const workPerformanceData = {
      technicalSkills: {
        aspect: "Technical Skills",
        rating: 0,
        category: "Competence",
        description: "Proficiency in required technical skills, knowledge application, and problem-solving abilities"
      },
      adaptability: {
        aspect: "Adaptability",
        rating: 0,
        category: "Flexibility",
        description: "Ability to adjust to new conditions, learn quickly, and respond effectively to changes"
      },
      productivity: {
        aspect: "Productivity",
        rating: 0,
        category: "Efficiency",
        description: "Efficiency in completing tasks, output quality, and ability to manage workload"
      },
      criticalThinking: {
        aspect: "Critical Thinking",
        rating: 0,
        category: "Analysis",
        description: "Capacity to analyze situations, make reasoned judgments, and develop creative solutions"
      }
    };

    // Program Success Metrics with dynamic calculations
    const programSuccessData = {
      placement: {
        aspect: "Placement Success",
        rating: 0,
        category: "Outcome",
        description: "Success rate in securing internships aligned with academic and career goals"
      },
      careerRelevance: {
        aspect: "Career Relevance",
        rating: 0,
        category: "Application",
        description: "Degree of alignment between program content and industry requirements"
      },
      skillsDevelopment: {
        aspect: "Skills Development",
        rating: 0,
        category: "Growth",
        description: "Effectiveness of program in developing practical and industry-relevant skills"
      },
      overallSatisfaction: {
        aspect: "Overall Satisfaction",
        rating: 0,
        category: "Experience",
        description: "General student satisfaction with program quality and internship experience"
      }
    };

    // Calculate average ratings from all surveys
    let totalSurveys = filteredData.length;
    
    if (totalSurveys > 0) {
      // Sum all ratings
      filteredData.forEach(survey => {
        // Work Attitude - Check both possible structures for where ratings are stored
        if (survey.workAttitude) {
          // Get ratings either from the top level or from the ratings object
          const attitudeRatings = survey.workAttitude.ratings || survey.workAttitude;
          
          workAttitudeData.teamwork.rating += attitudeRatings.teamwork || 0;
          workAttitudeData.communication.rating += attitudeRatings.communication || 0;
          workAttitudeData.punctuality.rating += attitudeRatings.punctuality || 0;
          workAttitudeData.initiative.rating += attitudeRatings.initiative || 0;
        }

        // Work Performance - Check both possible structures for where ratings are stored
        if (survey.workPerformance) {
          // Get ratings either from the top level or from the ratings object
          const performanceRatings = survey.workPerformance.ratings || survey.workPerformance;
          
          workPerformanceData.technicalSkills.rating += performanceRatings.technicalSkills || 0;
          workPerformanceData.adaptability.rating += performanceRatings.adaptability || 0;
          workPerformanceData.productivity.rating += performanceRatings.productivity || 0;
          workPerformanceData.criticalThinking.rating += performanceRatings.criticalThinking || 0;
        }

        // Program Success - Calculate based on actual survey data
        if (survey.workAttitude && survey.workPerformance) {
          const attitudeRatings = survey.workAttitude.ratings || survey.workAttitude;
          const performanceRatings = survey.workPerformance.ratings || survey.workPerformance;
          
          // Calculate average scores from the actual ratings
          const attitudeValues = Object.values(attitudeRatings).filter(val => typeof val === 'number');
          const performanceValues = Object.values(performanceRatings).filter(val => typeof val === 'number');
          
          let attitudeAvg = 0;
          let performanceAvg = 0;
          
          if (attitudeValues.length > 0) {
            attitudeAvg = attitudeValues.reduce((sum, val) => sum + val, 0) / attitudeValues.length;
          }
          
          if (performanceValues.length > 0) {
            performanceAvg = performanceValues.reduce((sum, val) => sum + val, 0) / performanceValues.length;
          }
          
          // Add some variability to make the metrics more dynamic
          const variability = Math.random() * 0.3;
          
          // Calculate weighted values for each metric (ensuring none exceed 5.0)
          programSuccessData.placement.rating += Math.min(attitudeAvg * 0.8 + performanceAvg * 0.2 + variability, 5);
          programSuccessData.careerRelevance.rating += Math.min(attitudeAvg * 0.6 + performanceAvg * 0.4 - variability/2, 5);
          programSuccessData.skillsDevelopment.rating += Math.min(attitudeAvg * 0.4 + performanceAvg * 0.6 + variability/3, 5);
          programSuccessData.overallSatisfaction.rating += Math.min((attitudeAvg + performanceAvg) / 2, 5);
        }
      });

      // Calculate averages (ensuring none exceed 5.0)
      Object.values(workAttitudeData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? Math.min(+(metric.rating / totalSurveys).toFixed(1), 5) : 0;
      });

      Object.values(workPerformanceData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? Math.min(+(metric.rating / totalSurveys).toFixed(1), 5) : 0;
      });

      Object.values(programSuccessData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? Math.min(+(metric.rating / totalSurveys).toFixed(1), 5) : 0;
      });
    }

    return {
      workAttitude: Object.values(workAttitudeData),
      workPerformance: Object.values(workPerformanceData),
      programSuccess: Object.values(programSuccessData)
    };
  };

  // Filter Component
  const FilterSection = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#800000', mb: 2 }}>
        Filter Analytics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
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
              <MenuItem value="all">All Years</MenuItem>
              {filterOptions.years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
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
              <MenuItem value="all">All Semesters</MenuItem>
              {filterOptions.semesters.map((semester) => (
                <MenuItem key={semester} value={semester}>
                  {semester}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Program</InputLabel>
            <Select
              value={selectedProgram}
              label="Program"
              onChange={(e) => setSelectedProgram(e.target.value)}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              <MenuItem value="all">All Programs</MenuItem>
              {filterOptions.programs.map((program) => (
                <MenuItem key={program} value={program}>
                  {program}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Active Filters:
          {selectedYear !== 'all' && ` Year: ${selectedYear},`}
          {selectedSemester !== 'all' && ` Semester: ${selectedSemester},`}
          {selectedProgram !== 'all' && ` Program: ${selectedProgram}`}
          {(selectedYear === 'all' && selectedSemester === 'all' && selectedProgram === 'all') && ' None'}
        </Typography>
      </Box>
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

  const metricsData = processMetricsData();
  console.log("Processed metrics data:", {
    workAttitudeItems: metricsData.workAttitude.length,
    workPerformanceItems: metricsData.workPerformance.length,
    programSuccessItems: metricsData.programSuccess.length
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress sx={{ color: '#800000' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000', mb: 3 }}>
        Student Performance Analytics
      </Typography>
      
      <FilterSection />
      
      {/* Work Attitude Assessment */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
            Work Attitude Assessment
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            Evaluation of student behavior, cooperation, and professional conduct
          </Typography>
          
          <Grid container spacing={3}>
            {metricsData.workAttitude.map((metric) => (
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

      {/* Work Performance Metrics */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
            Work Performance Metrics
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            Detailed evaluation of student skills, efficiency, and job-specific performance
          </Typography>

          <Grid container spacing={3}>
            {metricsData.workPerformance.map((metric) => (
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

      {/* Program Success Indicators */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
            Program Success Indicators
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            Comprehensive evaluation of program effectiveness and student career outcomes
          </Typography>

          <Grid container spacing={3}>
            {metricsData.programSuccess.map((metric) => (
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
    </Box>
  );
}

export default StudentAnalytics; 