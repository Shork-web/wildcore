import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { 
  Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, 
  Select, MenuItem, Paper, CircularProgress, Chip, Button, Tooltip, Divider
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
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

function StudentAnalytics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  
  // Get user context instead of fetching separately
  const { currentUser } = useContext(AuthContext);

  // Fetch data from Firestore
  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeFinal = null;
    let unsubscribeMidterm = null;

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
          async (userDoc) => {
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
            
            // Clean up previous subscriptions
            if (unsubscribeFinal) unsubscribeFinal();
            if (unsubscribeMidterm) unsubscribeMidterm();

            // Set up real-time listeners for both collections
            try {
              let finalQuery, midtermQuery;

              if (userSection) {
                // If instructor has a specific section assigned
                finalQuery = query(
                  collection(db, 'studentSurveys_final'),
                  where('section', '==', userSection)
                );
                
                midtermQuery = query(
                  collection(db, 'studentSurveys_midterm'),
                  where('section', '==', userSection)
                );
              } else if (userRole === 'admin') {
                // Admin sees all surveys
                finalQuery = collection(db, 'studentSurveys_final');
                midtermQuery = collection(db, 'studentSurveys_midterm');
              } else {
                // For any other role with college access but no section
                finalQuery = query(
                  collection(db, 'studentSurveys_final'),
                  where('college', '==', userCollege)
                );
                
                midtermQuery = query(
                  collection(db, 'studentSurveys_midterm'),
                  where('college', '==', userCollege)
                );
              }
              
              // Track survey data from both collections
              let allSurveys = [];
              let finalSurveys = [];
              let midtermSurveys = [];
              
              // Listen to final surveys
              unsubscribeFinal = onSnapshot(finalQuery, 
                { includeMetadataChanges: true }, // Include metadata to ensure complete data loading
                (snapshot) => {
                  console.log(`Received update from final surveys: ${snapshot.docs.length} documents`);
                  
                  finalSurveys = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    surveyType: 'final'
                  }));
                  
                  // Combine with existing midterm surveys and process
                  allSurveys = [...finalSurveys, ...midtermSurveys];
                  processSurveyData(allSurveys);
                }, 
                (error) => {
                  console.error("Error listening to final surveys:", error);
                  setLoading(false);
                }
              );
              
              // Listen to midterm surveys
              unsubscribeMidterm = onSnapshot(midtermQuery, 
                { includeMetadataChanges: true }, // Include metadata to ensure complete data loading
                (snapshot) => {
                  console.log(`Received update from midterm surveys: ${snapshot.docs.length} documents`);
                  
                  midtermSurveys = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    surveyType: 'midterm'
                  }));
                  
                  // Combine with existing final surveys and process
                  allSurveys = [...finalSurveys, ...midtermSurveys];
                  processSurveyData(allSurveys);
                }, 
                (error) => {
                  console.error("Error listening to midterm surveys:", error);
                  setLoading(false);
                }
              );
            } catch (error) {
              console.error("Error setting up survey listeners:", error);
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

        return {
          ...survey,
          workAttitude,
          workPerformance
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
      if (unsubscribeFinal) unsubscribeFinal();
      if (unsubscribeMidterm) unsubscribeMidterm();
    };
  }, [currentUser]); // Only depend on currentUser, not profile.section

  // Extract unique filter options from actual data
  const filterOptions = {
    years: [...new Set(surveyData.map(survey => survey.schoolYear))].sort(),
    semesters: [...new Set(surveyData.map(survey => survey.semester))].sort(),
    programs: [...new Set(surveyData.map(survey => survey.program).filter(Boolean))].sort(),
    companies: [...new Set(surveyData.map(survey => survey.companyName || survey.partnerCompany).filter(Boolean))].sort(),
    sections: [...new Set(surveyData.map(survey => survey.section).filter(Boolean))].sort()
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
    
    // Apply semester filter
    const semesterFilteredData = selectedSemester === 'all'
      ? yearFilteredData
      : yearFilteredData.filter(survey => survey.semester === selectedSemester);
    
    // Apply company filter
    const companyFilteredData = selectedCompany === 'all'
      ? semesterFilteredData
      : semesterFilteredData.filter(survey => {
          const companyMatch = 
            survey.companyName === selectedCompany || 
            survey.partnerCompany === selectedCompany;
          return companyMatch;
        });
    
    // Apply section filter
    const sectionFilteredData = selectedSection === 'all'
      ? companyFilteredData
      : companyFilteredData.filter(survey => survey.section === selectedSection);
    
    // Finally, apply survey type filter (midterm/final)
    return selectedSurveyType === 'all'
      ? sectionFilteredData
      : sectionFilteredData.filter(survey => survey.surveyType === selectedSurveyType);
  };

  // Process data for metrics display
  const processMetricsData = () => {
    const filteredData = getFilteredData();
    console.log(`Processing metrics with ${filteredData.length} filtered surveys`);
    
    if (filteredData.length > 0) {
      // Debug info to help diagnose data issues
      console.log(`Survey types in filtered data: ${[...new Set(filteredData.map(s => s.surveyType))].join(', ')}`);
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
      });

      // Calculate averages (ensuring none exceed 5.0)
      Object.values(workAttitudeData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? Math.min(+(metric.rating / totalSurveys).toFixed(1), 5) : 0;
      });

      Object.values(workPerformanceData).forEach(metric => {
        metric.rating = totalSurveys > 0 ? Math.min(+(metric.rating / totalSurveys).toFixed(1), 5) : 0;
      });
    }

    return {
      workAttitude: Object.values(workAttitudeData),
      workPerformance: Object.values(workPerformanceData)
    };
  };

  // Filter Component
  const FilterSection = () => {
    // Count active filters for the badge
    const activeFilterCount = [
      selectedProgram !== 'all',
      selectedYear !== 'all',
      selectedSemester !== 'all',
      selectedSurveyType !== 'all',
      selectedCompany !== 'all',
      selectedSection !== 'all'
    ].filter(Boolean).length;
    
    // Handle reset all filters
    const handleResetAllFilters = () => {
      setSelectedProgram('all');
      setSelectedYear('all');
      setSelectedSemester('all');
      setSelectedSurveyType('all');
      setSelectedCompany('all');
      setSelectedSection('all');
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2.5
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#800000',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FilterAltIcon sx={{ mr: 1, color: '#800000' }} />
            Analytics Filters
          </Typography>
          
          {activeFilterCount > 0 && (
            <Box sx={{ ml: 'auto' }}>
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
            </Box>
          )}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* First row - 3 filters */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                School Year
              </InputLabel>
              <Select
                value={selectedYear}
                label="School Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="all">All Years</MenuItem>
                {filterOptions.years?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Semester
              </InputLabel>
              <Select
                value={selectedSemester}
                label="Semester"
                onChange={(e) => setSelectedSemester(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="all">All Semesters</MenuItem>
                {filterOptions.semesters?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Program
              </InputLabel>
              <Select
                value={selectedProgram}
                label="Program"
                onChange={(e) => setSelectedProgram(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="all">All Programs</MenuItem>
                {filterOptions.programs?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Second row - 3 filters taking 33% width each */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Survey Type
              </InputLabel>
              <Select
                value={selectedSurveyType}
                label="Survey Type"
                onChange={(e) => setSelectedSurveyType(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="midterm">Midterm Evaluation</MenuItem>
                <MenuItem value="final">Final Evaluation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Company
              </InputLabel>
              <Select
                value={selectedCompany}
                label="Company"
                onChange={(e) => setSelectedCompany(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="all">All Companies</MenuItem>
                {filterOptions.companies?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: '#800000', 
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Section
              </InputLabel>
              <Select
                value={selectedSection}
                label="Section"
                onChange={(e) => setSelectedSection(e.target.value)}
                sx={{
                  height: '45px',
                  bgcolor: 'white',
                  '& .MuiSelect-select': { 
                    color: '#800000', 
                    py: 1.5 
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000',
                  },
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
                <MenuItem value="all">All Sections</MenuItem>
                {filterOptions.sections?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
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
            {/* Use a standardized approach for all filter chips */}
            {[
              { 
                active: selectedProgram !== 'all', 
                label: 'Program', 
                value: selectedProgram, 
                onDelete: () => setSelectedProgram('all') 
              },
              { 
                active: selectedYear !== 'all', 
                label: 'Year', 
                value: selectedYear, 
                onDelete: () => setSelectedYear('all') 
              },
              { 
                active: selectedSemester !== 'all', 
                label: 'Semester', 
                value: selectedSemester, 
                onDelete: () => setSelectedSemester('all') 
              },
              { 
                active: selectedSurveyType !== 'all', 
                label: 'Survey', 
                value: selectedSurveyType === 'midterm' ? 'Midterm Evaluation' : 'Final Evaluation', 
                onDelete: () => setSelectedSurveyType('all') 
              },
              { 
                active: selectedCompany !== 'all', 
                label: 'Company', 
                value: selectedCompany, 
                onDelete: () => setSelectedCompany('all') 
              },
              { 
                active: selectedSection !== 'all', 
                label: 'Section', 
                value: selectedSection, 
                onDelete: () => setSelectedSection('all') 
              }
            ]
            .filter(chip => chip.active)
            .map((chip, index) => (
              <Chip
                key={index}
                label={`${chip.label}: ${chip.value}`}
                onDelete={chip.onDelete}
                deleteIcon={<CancelIcon fontSize="small" />}
                sx={{
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  border: '1px solid rgba(128, 0, 0, 0.2)',
                  height: '28px',
                  '& .MuiChip-label': {
                    px: 1.5
                  },
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(128, 0, 0, 0.7)',
                    '&:hover': {
                      color: '#800000'
                    }
                  }
                }}
              />
            ))}
          </Box>
        )}

        {/* Results summary */}
        <Box sx={{ mt: 3 }}>
          {getFilteredData().length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(128, 0, 0, 0.05)', 
              p: 1.5, 
              borderRadius: 1 
            }}>
              <AssessmentIcon sx={{ color: '#800000', mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ color: '#800000', fontWeight: 'medium' }}>
                Showing analytics for {getFilteredData().length} {getFilteredData().length === 1 ? 'survey' : 'surveys'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(211, 47, 47, 0.05)', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid rgba(211, 47, 47, 0.3)'
            }}>
              <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                No data found for the selected filters. Try adjusting your criteria.
              </Typography>
            </Box>
          )}
        </Box>
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
  console.log("Processed metrics data:", {
    workAttitudeItems: metricsData.workAttitude.length,
    workPerformanceItems: metricsData.workPerformance.length
  });

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
          Loading Student Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the student performance data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000', mb: 3 }}>
        Student Performance Analytics
      </Typography>
      
      <FilterSection />
      
      {/* Student Performance Dashboard Summary */}
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
                {selectedProgram !== 'all' ? selectedProgram : 'All Programs'} • {selectedYear !== 'all' ? selectedYear : 'All Years'} • {selectedSemester !== 'all' ? `${selectedSemester} Semester` : 'All Semesters'}
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

      {/* Work Attitude Assessment */}
      <Card elevation={3} sx={{ mb: 3 }}>
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
              bgcolor: getRatingBgColor(getAverageRating('workAttitude')),
              px: 2,
              py: 0.5,
              borderRadius: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Average:
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                color: getRatingColor(getAverageRating('workAttitude'))
              }}>
                {getAverageRating('workAttitude').toFixed(1)}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
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

      {/* Work Performance Metrics */}
      <Card elevation={3} sx={{ mb: 3 }}>
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
              bgcolor: getRatingBgColor(getAverageRating('workPerformance')),
              px: 2,
              py: 0.5,
              borderRadius: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Average:
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                color: getRatingColor(getAverageRating('workPerformance'))
              }}>
                {getAverageRating('workPerformance').toFixed(1)}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

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
    </Box>
  );
}

export default StudentAnalytics; 