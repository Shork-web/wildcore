import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, Stack, CircularProgress } from '@mui/material';

function StudentAnalytics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');

  // Fetch data from Firestore
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const surveysRef = collection(db, 'studentSurveys');
        const snapshot = await getDocs(surveysRef);
        const surveys = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSurveyData(surveys);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, []);

  // Extract unique filter options from actual data
  const filterOptions = {
    years: [...new Set(surveyData.map(survey => survey.schoolYear))],
    semesters: [...new Set(surveyData.map(survey => survey.semester))],
    programs: [...new Set(surveyData.map(survey => survey.program))]
  };

  // Filter data based on selections
  const getFilteredData = () => {
    return surveyData.filter(survey => {
      return (selectedYear === 'all' || survey.schoolYear === selectedYear) &&
             (selectedSemester === 'all' || survey.semester === selectedSemester) &&
             (selectedProgram === 'all' || survey.program === selectedProgram);
    });
  };

  // Process data for metrics display
  const processMetricsData = () => {
    const filteredData = getFilteredData();
    
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

    // Program Success Metrics
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
        // Work Attitude
        if (survey.workAttitude?.ratings) {
          workAttitudeData.teamwork.rating += survey.workAttitude.ratings.teamwork || 0;
          workAttitudeData.communication.rating += survey.workAttitude.ratings.communication || 0;
          workAttitudeData.punctuality.rating += survey.workAttitude.ratings.punctuality || 0;
          workAttitudeData.initiative.rating += survey.workAttitude.ratings.initiative || 0;
        }

        // Work Performance
        if (survey.workPerformance?.ratings) {
          workPerformanceData.technicalSkills.rating += survey.workPerformance.ratings.technicalSkills || 0;
          workPerformanceData.adaptability.rating += survey.workPerformance.ratings.adaptability || 0;
          workPerformanceData.productivity.rating += survey.workPerformance.ratings.productivity || 0;
          workPerformanceData.criticalThinking.rating += survey.workPerformance.ratings.criticalThinking || 0;
        }

        // Program Success
        if (survey.programSuccess) {
          programSuccessData.placement.rating += survey.programSuccess.placement || 0;
          programSuccessData.careerRelevance.rating += survey.programSuccess.careerRelevance || 0;
          programSuccessData.skillsDevelopment.rating += survey.programSuccess.skillsDevelopment || 0;
          programSuccessData.overallSatisfaction.rating += survey.programSuccess.overallSatisfaction || 0;
        }
      });

      // Calculate averages
      Object.values(workAttitudeData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? +(metric.rating / totalSurveys).toFixed(1) : 0;
      });

      Object.values(workPerformanceData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? +(metric.rating / totalSurveys).toFixed(1) : 0;
      });

      Object.values(programSuccessData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? +(metric.rating / totalSurveys).toFixed(1) : 0;
      });
    }

    // For demo/testing - generate sample data if no data is available
    if (totalSurveys === 0) {
      const generateDemoRating = () => +(3.5 + Math.random() * 1.5).toFixed(1);
      
      Object.values(workAttitudeData).forEach(metric => {
        metric.rating = generateDemoRating();
      });

      Object.values(workPerformanceData).forEach(metric => {
        metric.rating = generateDemoRating();
      });

      Object.values(programSuccessData).forEach(metric => {
        metric.rating = generateDemoRating();
      });
    }

    return {
      workAttitude: Object.values(workAttitudeData),
      workPerformance: Object.values(workPerformanceData),
      programSuccess: Object.values(programSuccessData)
    };
  };

  // Filter Section Component
  const FilterSection = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
            <MenuItem value="all">Select Years</MenuItem>
            {filterOptions.years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
            <MenuItem value="all">Select Semesters</MenuItem>
            {filterOptions.semesters.map((semester) => (
              <MenuItem key={semester} value={semester}>
                {semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
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
          >
            <MenuItem value="all">Select Programs</MenuItem>
            {filterOptions.programs.map((program) => (
              <MenuItem key={program} value={program}>
                {program}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

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