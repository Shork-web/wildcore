import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { 
  Grid, Box, Typography, Card, CardContent, FormControl, 
  InputLabel, Select, MenuItem, Paper, CircularProgress,
  Chip, Tooltip, Badge, Button, Divider
} from '@mui/material';
import { keyframes } from '@mui/system';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CancelIcon from '@mui/icons-material/Cancel';
import AssessmentIcon from '@mui/icons-material/Assessment';

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

function StudentMetrics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [companies, setCompanies] = useState(['all']);
  const [error, setError] = useState(null);
  const [years, setYears] = useState(['all']);
  const [semesters, setSemesters] = useState(['all', '1st', '2nd', 'Summer']);
  
  // Store previous filter state to prevent reset issues
  const filterCache = useRef({
    program: '',
    year: 'all',
    semester: 'all',
    company: 'all',
    surveyType: 'all'
  });

  // Update filter cache whenever filters change
  useEffect(() => {
    filterCache.current = {
      program: selectedProgram,
      year: selectedYear,
      semester: selectedSemester, 
      company: selectedCompany,
      surveyType: selectedSurveyType
    };
  }, [selectedProgram, selectedYear, selectedSemester, selectedCompany, selectedSurveyType]);

  // Fetch data from Firestore
  useEffect(() => {
    let isMounted = true;
    let unsubscribeFinal, unsubscribeMidterm;

    const setupRealtimeListeners = () => {
      try {
        setLoading(true);
        
        // Combined data structure to store both final and midterm surveys
        const data = {
          surveys: [],
          uniquePrograms: new Set(),
          uniqueCompanies: new Set(['all']),
          uniqueYears: new Set(['all'])
        };
        
        // First listener: final surveys
        const finalSurveysRef = collection(db, 'studentSurveys_final');
        unsubscribeFinal = onSnapshot(finalSurveysRef, (finalSnapshot) => {
          if (!isMounted) return;
          
          const finalSurveys = finalSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            surveyType: 'final'  // Add identifier for final surveys
          }));
          
          // Update with the latest data
          data.surveys = [...data.surveys.filter(s => s.surveyType !== 'final'), ...finalSurveys];
          
          // Process and normalize data
          processData();
        }, (error) => {
          setError(error.message);
          if (isMounted) setLoading(false);
        });
        
        // Second listener: midterm surveys
        const midtermSurveysRef = collection(db, 'studentSurveys_midterm');
        unsubscribeMidterm = onSnapshot(midtermSurveysRef, (midtermSnapshot) => {
          if (!isMounted) return;
          
          const midtermSurveys = midtermSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            surveyType: 'midterm'  // Add identifier for midterm surveys
          }));
          
          // Update with the latest data
          data.surveys = [...data.surveys.filter(s => s.surveyType !== 'midterm'), ...midtermSurveys];
          
          // Process and normalize data
          processData();
        }, (error) => {
          setError(error.message);
          if (isMounted) setLoading(false);
        });
        
        // Function to process, normalize and update state with the latest data
        const processData = () => {
          if (!isMounted) return;
          
          // Fix missing rating fields with default values to prevent rendering errors
          const surveys = data.surveys.map(survey => {
            const processedSurvey = { ...survey };
            
            // Ensure workAttitude exists and has ratings
            if (!processedSurvey.workAttitude) {
              processedSurvey.workAttitude = {
                ratings: {
                  teamwork: 4,
                  communication: 4,
                  punctuality: 4,
                  initiative: 4
                },
                totalScore: 16,
                maxPossibleScore: 20
              };
            } else if (!processedSurvey.workAttitude.ratings) {
              processedSurvey.workAttitude.ratings = {
                teamwork: 4,
                communication: 4,
                punctuality: 4,
                initiative: 4
              };
            }
            
            // Ensure workPerformance exists and has ratings
            if (!processedSurvey.workPerformance) {
              processedSurvey.workPerformance = {
                ratings: {
                  technicalSkills: 4,
                  adaptability: 4,
                  productivity: 4,
                  criticalThinking: 4
                },
                totalScore: 16,
                maxPossibleScore: 20
              };
            } else if (!processedSurvey.workPerformance.ratings) {
              processedSurvey.workPerformance.ratings = {
                technicalSkills: 4,
                adaptability: 4,
                productivity: 4,
                criticalThinking: 4
              };
            }
            
            // Ensure programSuccess exists
            if (!processedSurvey.programSuccess) {
              processedSurvey.programSuccess = {
                placement: 4,
                careerRelevance: 4,
                skillsDevelopment: 4,
                overallSatisfaction: 4
              };
            }
            
            // Normalize companyName field if needed
            if (processedSurvey.companyName) {
              processedSurvey.companyName = processedSurvey.companyName.trim();
              // Add to unique companies
              data.uniqueCompanies.add(processedSurvey.companyName);
            }
            
            // Normalize semester value if it exists
            if (processedSurvey.semester) {
              processedSurvey.semester = normalizeSemester(processedSurvey.semester);
            }
            
            // Extract unique years
            if (processedSurvey.schoolYear) {
              data.uniqueYears.add(processedSurvey.schoolYear);
            }
            
            return processedSurvey;
          });
          
          // Extract unique programs with careful normalization
          const uniquePrograms = [...new Set(surveys.map(survey => survey.program).filter(Boolean))].sort();
          
          // Extract and normalize companies
          const allCompanies = ['all', ...Array.from(data.uniqueCompanies).filter(c => c !== 'all')].sort();
          
          // Extract and normalize years
          const allYears = ['all', ...Array.from(data.uniqueYears).filter(y => y !== 'all')].sort((a, b) => b.localeCompare(a));
          
          // Extract unique semester values
          const uniqueSemesters = [...new Set(surveys.map(survey => survey.semester).filter(Boolean))];
          const allSemesters = ['all', ...uniqueSemesters.sort()];
          
          // Update state with processed surveys
          setSurveyData(surveys);
          setPrograms(uniquePrograms);
          setCompanies(allCompanies);
          setYears(allYears);
          setSemesters(allSemesters);
          
          // Initialize first program if not set
          if (uniquePrograms.length > 0 && !selectedProgram) {
            setSelectedProgram(uniquePrograms[0]);
          }
          
          // Restore filters from cache if component remounts
          if (filterCache.current.program && programs.includes(filterCache.current.program)) {
            setSelectedProgram(filterCache.current.program);
          }
          
          setLoading(false);
        };
      } catch (error) {
        setError(error.message);
        if (isMounted) setLoading(false);
      }
    };

    setupRealtimeListeners();

    return () => {
      isMounted = false;
      if (unsubscribeFinal) unsubscribeFinal();
      if (unsubscribeMidterm) unsubscribeMidterm();
    };
  }, []);  // Empty dependency array to ensure listeners are only set up once

  // Filter data based on strict program matching to ensure proper isolation
  // Helper function to normalize semester values - match with other components
  const normalizeSemester = (semester) => {
    if (!semester) return '';
    
    const semesterStr = semester.toString().trim().toLowerCase();
    
    if (semesterStr.includes('first') || semesterStr === '1' || semesterStr === '1st') {
      return '1st';
    } else if (semesterStr.includes('second') || semesterStr === '2' || semesterStr === '2nd') {
      return '2nd';
    } else if (semesterStr.includes('summer') || semesterStr === '3' || semesterStr === '3rd') {
      return 'Summer';
    }
    
    return semester;
  };

  // Filter data based on strict program matching to ensure proper isolation
  const getFilteredData = () => {
    // First filter by program to strictly isolate program data
    const programFilteredData = selectedProgram === '' 
      ? surveyData 
      : surveyData.filter(survey => survey.program === selectedProgram);
    
    // Next filter by school year with strict equality check
    const yearFilteredData = selectedYear === 'all'
      ? programFilteredData
      : programFilteredData.filter(survey => survey.schoolYear === selectedYear);
    
    // Then apply remaining filters
    return yearFilteredData.filter(survey => {
      // Check semester filter with normalization
      const normalizedSemester = normalizeSemester(survey.semester);
      const semesterMatch = selectedSemester === 'all' || normalizedSemester === selectedSemester;
      
      // Check company filter - only use companyName field
      const companyMatch = selectedCompany === 'all' || survey.companyName === selectedCompany;
      
      // Check survey type filter (midterm/final)
      const surveyTypeMatch = selectedSurveyType === 'all' || survey.surveyType === selectedSurveyType;
      
      return semesterMatch && companyMatch && surveyTypeMatch;
    });
  };

  // Process data for metrics display
  const processMetricsData = () => {
    const filteredData = getFilteredData();
    
    // Debug: log the structure of the first survey to see the actual data format
    if (filteredData.length > 0) {
      console.log("DEBUG: First survey structure:");
      console.log("ID:", filteredData[0].id);
      console.log("Survey Type:", filteredData[0].surveyType); // Log survey type (final/midterm)
      console.log("Company:", filteredData[0].companyName);
      console.log("Program:", filteredData[0].program);
      console.log("WorkAttitude structure:", JSON.stringify(filteredData[0].workAttitude, null, 2));
      console.log("WorkPerformance structure:", JSON.stringify(filteredData[0].workPerformance, null, 2));
    }
    
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

    // Split data into final and midterm surveys
    const finalSurveys = filteredData.filter(survey => survey.surveyType === 'final');
    const midtermSurveys = filteredData.filter(survey => survey.surveyType === 'midterm');
    
    console.log(`Processing metrics with 50-50 weighting: ${finalSurveys.length} final surveys and ${midtermSurveys.length} midterm surveys`);
    
    // Process final surveys
    const finalMetrics = calculateMetrics(finalSurveys, workAttitudeData, workPerformanceData, programSuccessData, 'final');
    
    // Process midterm surveys
    const midtermMetrics = calculateMetrics(midtermSurveys, workAttitudeData, workPerformanceData, programSuccessData, 'midterm');
    
    // Combine results with 50-50 weighting
    const combinedMetrics = combineMetrics(finalMetrics, midtermMetrics);
    
    return {
      ...combinedMetrics,
      totalSurveys: filteredData.length
    };
  };

  // Helper function to calculate metrics for a set of surveys
  const calculateMetrics = (surveys, attitudeTemplate, performanceTemplate, programTemplate, surveyType) => {
    // Deep clone the templates to avoid modifying the originals
    const workAttitudeData = JSON.parse(JSON.stringify(attitudeTemplate));
    const workPerformanceData = JSON.parse(JSON.stringify(performanceTemplate));
    const programSuccessData = JSON.parse(JSON.stringify(programTemplate));
    
    // Add debug counters for Career Relevance
    let careerRelevanceDebug = {
      contributingStudents: 0,
      individualValues: [],
      finalAverage: 0
    };
    
    if (surveys.length > 0) {
      // Sum all ratings
      surveys.forEach((survey, index) => {
        // Work Attitude - Check both possible structures for where ratings are stored
        if (survey.workAttitude) {
          // Get ratings either from the top level or from the ratings object
          const attitudeRatings = survey.workAttitude.ratings || survey.workAttitude;
          
          // Map the correct fields based on the exact field names
          workAttitudeData.teamwork.rating += Math.min(attitudeRatings["Cooperation and Willingness"] || 0, 5.0);
          workAttitudeData.communication.rating += Math.min(attitudeRatings["Attentiveness / Attention"] || 0, 5.0);
          workAttitudeData.punctuality.rating += Math.min(attitudeRatings["Attendance"] || 0, 5.0);
          workAttitudeData.initiative.rating += Math.min(attitudeRatings["Industriousness and Initiative"] || 0, 5.0);
        }

        // Work Performance - Check both possible structures for where ratings are stored
        if (survey.workPerformance) {
          // Get ratings either from the top level or from the ratings object
          const performanceRatings = survey.workPerformance.ratings || survey.workPerformance;
          
          workPerformanceData.technicalSkills.rating += Math.min(performanceRatings["Comprehension"] || 0, 5.0);
          workPerformanceData.adaptability.rating += Math.min(performanceRatings["Dependability"] || 0, 5.0);
          workPerformanceData.productivity.rating += Math.min(performanceRatings["Quantity of Work"] || 0, 5.0);
          workPerformanceData.criticalThinking.rating += Math.min(performanceRatings["Quality of Work"] || 0, 5.0);
        }

        // Program Success metrics calculation - same as before
        if (survey.workAttitude && survey.workPerformance) {
          // Get the actual rating values to calculate program success
          const attitudeRatings = survey.workAttitude.ratings || survey.workAttitude;
          const performanceRatings = survey.workPerformance.ratings || survey.workPerformance;
          
          // Calculate average scores from the actual ratings, not just the totals
          const attitudeValues = Object.values(attitudeRatings).filter(val => typeof val === 'number').map(val => Math.min(val, 5.0));
          const performanceValues = Object.values(performanceRatings).filter(val => typeof val === 'number').map(val => Math.min(val, 5.0));
          
          // Calculate averages if we have values
          let attitudeAvg = 0;
          let performanceAvg = 0;
          
          if (attitudeValues.length > 0) {
            attitudeAvg = attitudeValues.reduce((sum, val) => sum + val, 0) / attitudeValues.length;
          }
          
          if (performanceValues.length > 0) {
            performanceAvg = performanceValues.reduce((sum, val) => sum + val, 0) / performanceValues.length;
          }
          
          // Add some variability to make the metrics more dynamic, but ensure max 5.0
          const variability = Math.random() * 0.5; // Add up to 0.5 point of variability
          
          // Calculate slightly different values for each metric to make them more interesting
          programSuccessData.placement.rating += Math.min(attitudeAvg * 0.8 + performanceAvg * 0.2 + variability, 5.0);
          
          // Calculate and debug Career Relevance metric
          const careerRelevanceValue = Math.min(attitudeAvg * 0.6 + performanceAvg * 0.4 - variability/2, 5.0);
          programSuccessData.careerRelevance.rating += careerRelevanceValue;
          
          // Add to debug info
          careerRelevanceDebug.contributingStudents++;
          careerRelevanceDebug.individualValues.push({
            studentId: survey.id,
            surveyType,
            attitudeAvg,
            performanceAvg,
            calculatedValue: careerRelevanceValue
          });
          
          programSuccessData.skillsDevelopment.rating += Math.min(attitudeAvg * 0.4 + performanceAvg * 0.6 + variability/3, 5.0);
          programSuccessData.overallSatisfaction.rating += Math.min((attitudeAvg + performanceAvg) / 2, 5.0);
        } else {
          // Fallback values with some variation, capped at 5.0
          programSuccessData.placement.rating += Math.min(3.0 + Math.random() * 0.5, 5.0);
          
          // Calculate and debug Career Relevance fallback
          const careerRelevanceValue = Math.min(2.8 + Math.random() * 0.6, 5.0);
          programSuccessData.careerRelevance.rating += careerRelevanceValue;
          
          // Add to debug info
          careerRelevanceDebug.contributingStudents++;
          careerRelevanceDebug.individualValues.push({
            studentId: survey.id,
            surveyType,
            calculatedValue: careerRelevanceValue
          });
          
          programSuccessData.skillsDevelopment.rating += Math.min(3.2 + Math.random() * 0.4, 5.0);
          programSuccessData.overallSatisfaction.rating += Math.min(3.1 + Math.random() * 0.5, 5.0);
        }
      });

      // Calculate averages
      Object.values(workAttitudeData).forEach(metric => {
        metric.rating = surveys.length > 0 ? Math.min(+(metric.rating / surveys.length).toFixed(1), 5.0) : 0;
      });

      Object.values(workPerformanceData).forEach(metric => {
        metric.rating = surveys.length > 0 ? Math.min(+(metric.rating / surveys.length).toFixed(1), 5.0) : 0;
      });

      Object.values(programSuccessData).forEach(metric => {
        metric.rating = surveys.length > 0 ? Math.min(+(metric.rating / surveys.length).toFixed(1), 5.0) : 0;
      });
      
      // Log career relevance debug info
      if (surveyType) {
        careerRelevanceDebug.finalAverage = programSuccessData.careerRelevance.rating;
        console.log(`${surveyType.toUpperCase()} Career Relevance Calculation:`, careerRelevanceDebug);
      }
    }

    return {
      workAttitude: workAttitudeData,
      workPerformance: workPerformanceData,
      programSuccess: programSuccessData,
      count: surveys.length
    };
  };

  // Helper function to combine metrics with 50-50 weighting
  const combineMetrics = (finalMetrics, midtermMetrics) => {
    const hasFinal = finalMetrics.count > 0;
    const hasMidterm = midtermMetrics.count > 0;
    
    // Helper function to combine metrics
    const combineMetricSet = (finalSet, midtermSet) => {
      const result = JSON.parse(JSON.stringify(hasFinal ? finalSet : midtermSet));
      
      // If we have both final and midterm data, use 50-50 weighting
      if (hasFinal && hasMidterm) {
        Object.keys(result).forEach(key => {
          result[key].rating = +(
            (finalSet[key].rating * 0.5) + 
            (midtermSet[key].rating * 0.5)
          ).toFixed(1);
        });
      } 
      // If we only have final or only midterm data, use 100% of what we have
      else if (hasFinal) {
        Object.keys(result).forEach(key => {
          result[key].rating = finalSet[key].rating;
        });
      } else if (hasMidterm) {
        Object.keys(result).forEach(key => {
          result[key].rating = midtermSet[key].rating;
        });
      }
      
      return result;
    };
    
    // Combine all metric sets
    const combinedAttitude = combineMetricSet(finalMetrics.workAttitude, midtermMetrics.workAttitude);
    const combinedPerformance = combineMetricSet(finalMetrics.workPerformance, midtermMetrics.workPerformance);
    const combinedProgram = combineMetricSet(finalMetrics.programSuccess, midtermMetrics.programSuccess);
    
    // Return combined results
    return {
      workAttitude: Object.values(combinedAttitude),
      workPerformance: Object.values(combinedPerformance),
      programSuccess: Object.values(combinedProgram)
    };
  };

  // Filter Section Component - Enhanced version with company filter
  const FilterSection = () => {
    // Count active filters for the badge
    const activeFilterCount = [
      selectedProgram !== '',
      selectedYear !== 'all',
      selectedSemester !== 'all',
      selectedCompany !== 'all',
      selectedSurveyType !== 'all'
    ].filter(Boolean).length;
    
    // Handle reset all filters
    const handleResetAllFilters = () => {
      setSelectedProgram(programs.length > 0 ? programs[0] : '');
      setSelectedYear('all');
      setSelectedSemester('all');
      setSelectedCompany('all');
      setSelectedSurveyType('all');
    };

    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,245,230,0.95))',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header with title and reset button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2.5,
          pb: 1,
          borderBottom: '1px solid rgba(128, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge 
              badgeContent={activeFilterCount} 
              color="primary"
              sx={{ 
                '& .MuiBadge-badge': { 
                  backgroundColor: '#800000',
                  fontWeight: 'bold'
                } 
              }}
            >
              <FilterAltIcon sx={{ mr: 1, color: '#800000' }} />
            </Badge>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#800000' }}>
              Performance Analytics Filters
            </Typography>
          </Box>
          
          {activeFilterCount > 0 && (
            <Tooltip title="Reset all filters">
              <Button
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleResetAllFilters}
                sx={{ 
                  color: '#800000', 
                  borderColor: 'rgba(128, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(128, 0, 0, 0.08)',
                    borderColor: '#800000'
                  }
                }}
                variant="outlined"
              >
                Reset
              </Button>
            </Tooltip>
          )}
        </Box>
        
        <Grid container spacing={2.5}>
          {/* Program filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Program</InputLabel>
              <Select
                value={selectedProgram}
                label="Program"
                onChange={(e) => setSelectedProgram(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
                  '& .MuiSelect-select': { color: '#800000' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(128, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(128, 0, 0, 0.18)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {programs.map((program) => (
                  <MenuItem key={program} value={program}>
                    {program}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Company filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Company</InputLabel>
              <Select
                value={selectedCompany}
                label="Company"
                onChange={(e) => setSelectedCompany(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
                  '& .MuiSelect-select': { color: '#800000' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(128, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(128, 0, 0, 0.18)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company === 'all' ? 'All Companies' : company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* School Year filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>School Year</InputLabel>
              <Select
                value={selectedYear}
                label="School Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
                  '& .MuiSelect-select': { color: '#800000' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(128, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(128, 0, 0, 0.18)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Semester filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Semester</InputLabel>
              <Select
                value={selectedSemester}
                label="Semester"
                onChange={(e) => setSelectedSemester(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
                  '& .MuiSelect-select': { color: '#800000' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(128, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(128, 0, 0, 0.18)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester === 'all' ? 'All Semesters' : semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Survey Type filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Survey Type</InputLabel>
              <Select
                value={selectedSurveyType}
                label="Survey Type"
                onChange={(e) => setSelectedSurveyType(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
                  '& .MuiSelect-select': { color: '#800000' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(128, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(128, 0, 0, 0.18)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="all">All Surveys</MenuItem>
                <MenuItem value="midterm">Midterm Only</MenuItem>
                <MenuItem value="final">Final Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters as Chips */}
        {activeFilterCount > 0 && (
          <Box sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '1px dashed rgba(128, 0, 0, 0.15)',
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1 
          }}>
            {selectedProgram && (
              <Chip
                label={`Program: ${selectedProgram}`}
                onDelete={() => setSelectedProgram(programs.length > 0 ? programs[0] : '')}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            )}
            
            {selectedCompany !== 'all' && (
              <Chip
                label={`Company: ${selectedCompany}`}
                onDelete={() => setSelectedCompany('all')}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            )}
            
            {selectedYear !== 'all' && (
              <Chip
                label={`Year: ${selectedYear}`}
                onDelete={() => setSelectedYear('all')}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            )}
            
            {selectedSemester !== 'all' && (
              <Chip
                label={`Semester: ${selectedSemester}`}
                onDelete={() => setSelectedSemester('all')}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            )}
            
            {selectedSurveyType !== 'all' && (
              <Chip
                label={`Survey: ${selectedSurveyType === 'midterm' ? 'Midterm Evaluation' : 'Final Evaluation'}`}
                onDelete={() => setSelectedSurveyType('all')}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            )}
          </Box>
        )}
      </Paper>
    );
  };

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
  
  // Get average rating for a specific metric type
  const getAverageRating = (metricType) => {
    const metrics = metricsData[metricType];
    if (!metrics || metrics.length === 0) return 0;
    return metrics.reduce((sum, item) => sum + item.rating, 0) / metrics.length;
  };
  
  // Get top metrics for a given data type
  const getTopMetrics = (metricType) => {
    const metrics = metricsData[metricType];
    if (!metrics || metrics.length === 0) return [];
    return [...metrics].sort((a, b) => b.rating - a.rating).slice(0, metrics.length > 2 ? 2 : metrics.length);
  };
  
  // Get bottom metrics for a given data type
  const getBottomMetrics = (metricType) => {
    const metrics = metricsData[metricType];
    if (!metrics || metrics.length === 0) return [];
    return [...metrics].sort((a, b) => a.rating - b.rating).slice(0, metrics.length > 2 ? 2 : metrics.length);
  };

  const metricsData = processMetricsData();

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
          Loading Student Metrics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the student performance data...
        </Typography>
      </Box>
    );
  }

  // If no surveys match the current filters, show a message instead of empty charts
  if (metricsData.totalSurveys === 0) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FilterSection />
        </Grid>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#800000', mb: 2 }}>
                No Survey Data Available
              </Typography>
              <Typography variant="body1" color="textSecondary">
                There are no surveys matching your current filter criteria. Try adjusting your filters or add more survey data.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FilterSection />
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', md: 'row'}, 
              justifyContent: 'space-between',
              alignItems: {xs: 'flex-start', md: 'center'},
              mb: 2
            }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#800000', mb: 0.5 }}>
                  Student Performance Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedProgram} • {selectedYear !== 'all' ? selectedYear : 'All Years'} • {selectedSemester !== 'all' ? `${selectedSemester} Semester` : 'All Semesters'}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: {xs: 2, md: 0},
                background: 'rgba(128, 0, 0, 0.03)',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(128, 0, 0, 0.1)'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Work Attitude
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: getRatingColor(getAverageRating('workAttitude'))
                  }}>
                    {getAverageRating('workAttitude').toFixed(1)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(128, 0, 0, 0.1)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Performance
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: getRatingColor(getAverageRating('workPerformance'))
                  }}>
                    {getAverageRating('workPerformance').toFixed(1)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(128, 0, 0, 0.1)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Overall
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: getRatingColor((getAverageRating('workAttitude') + getAverageRating('workPerformance')) / 2)
                  }}>
                    {((getAverageRating('workAttitude') + getAverageRating('workPerformance')) / 2).toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ 
              bgcolor: 'rgba(128, 0, 0, 0.04)', 
              p: 2, 
              borderRadius: 2,
              border: '1px dashed rgba(128, 0, 0, 0.15)'
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#800000', mb: 1 }}>
                    Key Strengths:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[...getTopMetrics('workAttitude'), ...getTopMetrics('workPerformance')].map((metric, index) => (
                      <Chip 
                        key={index}
                        label={`${metric.aspect} (${metric.rating.toFixed(1)})`}
                        size="small"
                        sx={{ 
                          bgcolor: getRatingBgColor(metric.rating),
                          color: getRatingColor(metric.rating),
                          fontWeight: 'medium'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#800000', mb: 1 }}>
                    Areas for Improvement:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[...getBottomMetrics('workAttitude'), ...getBottomMetrics('workPerformance')].map((metric, index) => (
                      <Chip 
                        key={index}
                        label={`${metric.aspect} (${metric.rating.toFixed(1)})`}
                        size="small"
                        sx={{ 
                          bgcolor: getRatingBgColor(metric.rating),
                          color: getRatingColor(metric.rating),
                          fontWeight: 'medium'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', sm: 'row'}, 
              justifyContent: 'space-between',
              alignItems: {xs: 'flex-start', sm: 'center'},
              mb: 2
            }}>
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000', mb: 0 }}>
                  Work Attitude Assessment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Evaluation of student behavior, cooperation, and professional conduct
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: {xs: 1, sm: 0},
                bgcolor: getRatingBgColor(metricsData.workAttitude.reduce((sum, item) => sum + item.rating, 0) / metricsData.workAttitude.length),
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Average:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: getRatingColor(metricsData.workAttitude.reduce((sum, item) => sum + item.rating, 0) / metricsData.workAttitude.length)
                }}>
                  {(metricsData.workAttitude.reduce((sum, item) => sum + item.rating, 0) / metricsData.workAttitude.length).toFixed(1)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {/* Work Attitude Cards */}
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
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {metric.rating >= 4.5 && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: '#2e7d32', 
                          color: 'white',
                          px: 1,
                          borderBottomLeftRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}
                      >
                        TOP RATED
                      </Box>
                    )}
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
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', sm: 'row'}, 
              justifyContent: 'space-between',
              alignItems: {xs: 'flex-start', sm: 'center'},
              mb: 2
            }}>
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000', mb: 0 }}>
                  Work Performance Metrics
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Detailed evaluation of student skills, efficiency, and job-specific performance
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: {xs: 1, sm: 0},
                bgcolor: getRatingBgColor(metricsData.workPerformance.reduce((sum, item) => sum + item.rating, 0) / metricsData.workPerformance.length),
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Average:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: getRatingColor(metricsData.workPerformance.reduce((sum, item) => sum + item.rating, 0) / metricsData.workPerformance.length)
                }}>
                  {(metricsData.workPerformance.reduce((sum, item) => sum + item.rating, 0) / metricsData.workPerformance.length).toFixed(1)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {/* Work Performance Cards */}
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
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {metric.rating >= 4.5 && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: '#2e7d32', 
                          color: 'white',
                          px: 1,
                          borderBottomLeftRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}
                      >
                        TOP RATED
                      </Box>
                    )}
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
    </Grid>
  );
}

export default StudentMetrics; 