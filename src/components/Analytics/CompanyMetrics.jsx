import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, Box, Typography, Card, CardContent, FormControl, 
  InputLabel, Select, MenuItem, Paper, CircularProgress, 
  Chip, Tooltip, Badge, Button, Divider
} from '@mui/material';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase-config';
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

function CompanyMetrics() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState(['1st', '2nd', 'Summer']);
  const [programs, setPrograms] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to normalize semester values
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
  
  // Store previous filter state to prevent reset issues
  const filterCache = useRef({
    company: '',
    year: '',
    semester: '',
    surveyType: 'all',
    program: 'all'
  });

  // Update filter cache whenever filters change
  useEffect(() => {
    filterCache.current = {
      company: selectedCompany,
      year: selectedYear,
      semester: selectedSemester,
      surveyType: selectedSurveyType,
      program: selectedProgram
    };
  }, [selectedCompany, selectedYear, selectedSemester, selectedSurveyType, selectedProgram]);
  
  // Apply filters whenever they change
  useEffect(() => {
    if (!evaluationsData || evaluationsData.length === 0) return;
    
    // Filter data is now handled in the getFilteredData function
    // No need to store filtered data separately
    
  }, [selectedCompany, selectedYear, selectedSemester, selectedSurveyType, selectedProgram, evaluationsData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let isMounted = true;
    let unsubscribeFinal = null;
    let unsubscribeMidterm = null;

    const setupRealtimeListeners = () => {
      try {
        setLoading(true);
        
        // Combined data structure to store both final and midterm surveys
        const data = {
          evaluations: [],
          uniqueCompanies: new Set(),
          uniqueYears: new Set(),
          uniquePrograms: new Set(['all']),
          uniqueSemesters: new Set()
        };
        
        // First listener: final evaluations
        const finalEvaluationsRef = collection(db, 'companyEvaluations_final');
        const finalQuery = query(finalEvaluationsRef, where('status', '==', 'submitted'));
        
        unsubscribeFinal = onSnapshot(finalQuery, (snapshot) => {
          if (!isMounted) return;
        
          const finalEvaluations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            surveyType: 'final'  // Add identifier for final evaluations
          }));
          
          // Update with the latest data
          data.evaluations = [...data.evaluations.filter(e => e.surveyType !== 'final'), ...finalEvaluations];
          
          // Process and normalize data
          processData();
        }, (error) => {
          setError(error.message);
          if (isMounted) setLoading(false);
        });

        // Second listener: midterm evaluations
        const midtermEvaluationsRef = collection(db, 'companyEvaluations_midterm');
        const midtermQuery = query(midtermEvaluationsRef, where('status', '==', 'submitted'));
        
        unsubscribeMidterm = onSnapshot(midtermQuery, (snapshot) => {
          if (!isMounted) return;
        
          const midtermEvaluations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            surveyType: 'midterm'  // Add identifier for midterm evaluations
          }));
          
          // Update with the latest data
          data.evaluations = [...data.evaluations.filter(e => e.surveyType !== 'midterm'), ...midtermEvaluations];
          
          // Process and normalize data
          processData();
        }, (error) => {
          setError(error.message);
          if (isMounted) setLoading(false);
        });

        // Function to process, normalize and update state with the latest data
        const processData = () => {
          if (!isMounted) return;
          
          // Process all evaluations
          const processedEvaluations = data.evaluations.map((evaluation, index) => {
            const processedEvaluation = { ...evaluation };
            
            // Transform evaluation data to the expected format based on the new DB structure
            
            // Helper function to safely get rating value or use default
            const getRating = (ratings, key, defaultValue = 3.0) => {
              if (!ratings) return defaultValue;
              const value = ratings[key];
              return typeof value === 'number' ? Math.min(value, 5.0) : defaultValue;
            };
            
            // Get all available workEnvironment ratings keys
            const workEnvRatings = evaluation.workEnvironment?.ratings || {};
            
            // Create an array with common work environment aspects
            processedEvaluation.workEnvironmentData = [
              {
                aspect: 'Safe Environment',
                rating: getRating(workEnvRatings, "The company provides a safe working environment"),
                category: 'Safety',
                description: 'Assessment of workplace safety measures and overall security'
              },
              {
                aspect: 'Resource Efficiency',
                rating: getRating(workEnvRatings, "The company emphasizes waste reduction and efficient use of resources"),
                category: 'Management',
                description: 'Efficiency in resource utilization and sustainability practices'
              },
              {
                aspect: 'Task Assignment',
                rating: getRating(workEnvRatings, "The tasks assigned match my skill level and allow for personal growth"),
                category: 'Development',
                description: 'Appropriate skill-level matching for tasks and opportunities for growth'
              },
              {
                aspect: 'Clear Expectations',
                rating: getRating(workEnvRatings, "The workload is reasonable, and expectations are clear"),
                category: 'Management',
                description: 'Clarity of expectations and reasonableness of assigned workload'
              },
              {
                aspect: 'Collaboration',
                rating: getRating(workEnvRatings, "The company encourages cooperation and a willingness to collaborate with others"),
                category: 'Teamwork',
                description: 'Promotion of teamwork and cooperative attitude among employees'
              },
              {
                aspect: 'Focus Environment',
                rating: getRating(workEnvRatings, "The company ensures attentiveness and provides focus in the work environment"),
                category: 'Environment',
                description: 'Creation of workplace conditions that support concentration and attention'
              },
              {
                aspect: 'Learning Culture',
                rating: getRating(workEnvRatings, "The company fosters an atmosphere of enthusiasm and eagerness to learn"),
                category: 'Culture',
                description: 'Fostering enthusiasm and creating a learning-oriented environment'
              },
              {
                aspect: 'Initiative Support',
                rating: getRating(workEnvRatings, "The company promotes industriousness and initiative"),
                category: 'Development',
                description: 'Support for employee proactiveness and self-directed improvement'
              }
            ];
            
            // If we don't have any environment ratings, add some generic ones based on workEnvironment.totalScore
            if (Object.keys(workEnvRatings).length === 0 && evaluation.workEnvironment?.totalScore) {
              const avgScore = (evaluation.workEnvironment.totalScore / evaluation.workEnvironment.maxPossibleScore) * 5.0;
              processedEvaluation.workEnvironmentData = [
                {
                  aspect: 'Work Environment',
                  rating: avgScore,
                  category: 'Overall',
                  description: 'Overall quality of the work environment'
                },
                {
                  aspect: 'Task Quality',
                  rating: avgScore,
                  category: 'Management',
                  description: 'Quality of tasks and assignments'
                },
                {
                  aspect: 'Team Environment',
                  rating: avgScore,
                  category: 'Teamwork',
                  description: 'Collaborative and supportive team environment'
                },
                {
                  aspect: 'Growth Opportunities',
                  rating: avgScore,
                  category: 'Development',
                  description: 'Opportunities for professional development and growth'
                }
              ];
            }
            
            // Get all available support/guidance ratings keys
            const supportRatings = evaluation.supportGuidance?.ratings || {};
            
            processedEvaluation.performanceData = [
              {
                aspect: 'Supervision',
                rating: getRating(supportRatings, "The company offers clear instructions and guidance to help employees succeed"),
                category: 'Support',
                description: 'Evaluation of leadership effectiveness, guidance quality, and managerial support provided'
              },
              {
                aspect: 'Feedback',
                rating: getRating(supportRatings, "The company is responsive and provides timely feedback on work performance"),
                category: 'Development',
                description: 'Assessment of constructive criticism frequency, clarity, and actionable insights provided'
              },
              {
                aspect: 'Training',
                rating: getRating(supportRatings, "The company provides sufficient training and resources for the tasks assigned"),
                category: 'Development',
                description: 'Analysis of professional development opportunities, skill enhancement programs, and training effectiveness'
              },
              {
                aspect: 'Problem Solving',
                rating: getRating(supportRatings, "The company provides adequate support for problem-solving and challenges"),
                category: 'Support',
                description: 'Level of support provided when facing challenges or complex problems'
              },
              {
                aspect: 'Work-Life Balance',
                rating: getRating(supportRatings, "The company supports work-life balance and recognizes the importance of well-being"),
                category: 'Support',
                description: 'Evaluation of policies that support employee well-being and balance between work and personal life'
              }
            ];
            
            // If we don't have any support ratings, add generic ones based on supportGuidance.totalScore
            if (Object.keys(supportRatings).length === 0 && evaluation.supportGuidance?.totalScore) {
              const avgScore = (evaluation.supportGuidance.totalScore / evaluation.supportGuidance.maxPossibleScore) * 5.0;
              processedEvaluation.performanceData = [
                {
                  aspect: 'Management Support',
                  rating: avgScore,
                  category: 'Support',
                  description: 'Overall quality of management guidance and support'
                },
                {
                  aspect: 'Professional Development',
                  rating: avgScore,
                  category: 'Development',
                  description: 'Quality of training and development opportunities'
                },
                {
                  aspect: 'Employee Wellbeing',
                  rating: avgScore,
                  category: 'Support',
                  description: 'Focus on employee health and work-life balance'
                },
                {
                  aspect: 'Performance Feedback',
                  rating: avgScore,
                  category: 'Development',
                  description: 'Quality and frequency of performance feedback'
                }
              ];
            }
            
            // Get all available overall experience ratings keys
            const experienceRatings = evaluation.overallExperience?.ratings || {};
            
            // Add company culture metrics based on overallExperience
            processedEvaluation.cultureData = [
              {
                aspect: 'Recognition',
                rating: getRating(experienceRatings, "I feel valued and appreciated as a member of the company"),
                category: 'Culture',
                description: 'Feeling of being valued and recognized for contributions within the company'
              },
              {
                aspect: 'Skill Development',
                rating: getRating(experienceRatings, "My experience with the company has helped me improve my professional skills"),
                category: 'Growth',
                description: 'Opportunities for developing professional skills and career advancement'
              },
              {
                aspect: 'Work Culture',
                rating: getRating(experienceRatings, "The company promotes a positive and respectful work culture"),
                category: 'Environment',
                description: 'Assessment of workplace atmosphere, respect, and positive interactions'
              },
              {
                aspect: 'Recommendation',
                rating: getRating(experienceRatings, "I would recommend this company to other students for work experience or internships"),
                category: 'Satisfaction',
                description: 'Likelihood of recommending the company to other students for internships'
              }
            ];
            
            // If we don't have any experience ratings, add generic ones based on overallExperience.totalScore
            if (Object.keys(experienceRatings).length === 0 && evaluation.overallExperience?.totalScore) {
              const avgScore = (evaluation.overallExperience.totalScore / evaluation.overallExperience.maxPossibleScore) * 5.0;
              processedEvaluation.cultureData = [
                {
                  aspect: 'Employee Value',
                  rating: avgScore,
                  category: 'Culture',
                  description: 'How valued employees feel within the company'
                },
                {
                  aspect: 'Professional Growth',
                  rating: avgScore,
                  category: 'Growth',
                  description: 'Opportunities for skills development and advancement'
                },
                {
                  aspect: 'Company Culture',
                  rating: avgScore,
                  category: 'Environment',
                  description: 'Overall quality of workplace culture and atmosphere'
                },
                {
                  aspect: 'Satisfaction Level',
                  rating: avgScore,
                  category: 'Satisfaction',
                  description: 'General level of satisfaction with the company'
                }
              ];
            }
            
            processedEvaluation.trendData = [{
              month: evaluation.submittedAt?.toDate ? 
                new Date(evaluation.submittedAt.toDate()).toLocaleString('default', { month: 'long' }) :
                'Unknown',
              satisfaction: evaluation.totalScore && evaluation.maxPossibleScore ? 
                Math.min((evaluation.totalScore / evaluation.maxPossibleScore) * 5.0, 5.0) : 3.0,
              engagement: evaluation.workEnvironment?.totalScore && evaluation.workEnvironment?.maxPossibleScore ? 
                Math.min((evaluation.workEnvironment.totalScore / evaluation.workEnvironment.maxPossibleScore) * 5.0, 5.0) : 3.0
            }];
            
            // Extract metadata
            if (processedEvaluation.companyName) {
              processedEvaluation.companyName = processedEvaluation.companyName.trim();
              data.uniqueCompanies.add(processedEvaluation.companyName);
            }
            
            if (processedEvaluation.schoolYear) {
              data.uniqueYears.add(processedEvaluation.schoolYear);
            }
            
            if (processedEvaluation.program) {
              data.uniquePrograms.add(processedEvaluation.program);
            }
            
            // Normalize semester value if it exists
            if (processedEvaluation.semester) {
              processedEvaluation.semester = normalizeSemester(processedEvaluation.semester);
              data.uniqueSemesters.add(processedEvaluation.semester);
            }
            
            return processedEvaluation;
          });
          
          // Extract unique values for filters
          const companiesList = Array.from(data.uniqueCompanies).map(name => ({ id: name, name }));
          const yearsList = Array.from(data.uniqueYears).sort((a, b) => b.localeCompare(a)); // Sort years descending
          const programsList = ['all', ...Array.from(data.uniquePrograms).filter(p => p !== 'all').sort()];
          const semestersList = Array.from(data.uniqueSemesters).sort();
          
          // Update state with processed evaluations
          setEvaluationsData(processedEvaluations);
          setCompanies(companiesList);
          setYears(yearsList);
          setPrograms(programsList);
          
          // Update semesters list if we have values
          if (semestersList.length > 0) {
            setSemesters(semestersList);
          }
          
          // Set initial filter values if not already set
          if (companiesList.length > 0 && !selectedCompany) {
            setSelectedCompany(companiesList[0].id);
          }
          
          if (yearsList.length > 0 && !selectedYear) {
            setSelectedYear(yearsList[0]);
          }
          
          if (semestersList.length > 0 && !selectedSemester) {
            setSelectedSemester(semestersList[0]);
          }
          
          // Restore filters from cache if component remounts
          if (filterCache.current.company && companiesList.some(c => c.id === filterCache.current.company)) {
            setSelectedCompany(filterCache.current.company);
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
      if (unsubscribeFinal) {
        unsubscribeFinal();
      }
      if (unsubscribeMidterm) {
        unsubscribeMidterm();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Get filtered data based on the selections
  const getFilteredData = (dataType) => {
    // First filter by company
    const companyFilteredData = evaluationsData.filter(evaluation => 
      evaluation.companyName === selectedCompany
    );
    
    // Next filter by school year
    const yearFilteredData = companyFilteredData.filter(evaluation => 
      evaluation.schoolYear === selectedYear
    );
    
    // Apply remaining filters
    const filteredData = yearFilteredData.filter(evaluation => {
      // Check semester filter
      const semesterMatch = evaluation.semester === selectedSemester;
      
      // Check survey type filter
      const surveyTypeMatch = selectedSurveyType === 'all' || evaluation.surveyType === selectedSurveyType;
      
      // Check program filter
      const programMatch = selectedProgram === 'all' || evaluation.program === selectedProgram;
      
      return semesterMatch && surveyTypeMatch && programMatch;
    });
    
    // Combine results with appropriate weighting
    if (filteredData.length === 0) return [];
    
    // If we have multiple evaluations for the same filters,
    // compute an average of each metric
    if (dataType) {
      // Get all the data of the specified type
      const allData = filteredData.map(evaluation => evaluation[dataType] || []).flat();
      
      // If no data found, return empty array
      if (allData.length === 0) return [];
      
      // Group data by aspect
      const groupedData = {};
      allData.forEach(item => {
        if (!groupedData[item.aspect]) {
          groupedData[item.aspect] = {
            count: 0,
            sum: 0,
            item: { ...item }
          };
        }
        groupedData[item.aspect].count++;
        groupedData[item.aspect].sum += item.rating;
      });
      
      // Calculate averages
      return Object.values(groupedData).map(group => ({
        ...group.item,
        rating: group.sum / group.count
      }));
    }
    
    return filteredData;
  };

  // Update the FilterSection component based on StudentMetrics.jsx
  const FilterSection = () => {
    // Count active filters for the badge
    const activeFilterCount = [
      selectedCompany !== '',
      selectedYear !== '',
      selectedSemester !== '',
      selectedSurveyType !== 'all',
      selectedProgram !== 'all'
    ].filter(Boolean).length;
    
    // Handle reset all filters
    const handleResetAllFilters = () => {
      setSelectedCompany(companies.length > 0 ? companies[0].id : '');
      setSelectedYear(years.length > 0 ? years[0] : '');
      setSelectedSemester('1st');
      setSelectedSurveyType('all');
      setSelectedProgram('all');
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
              Company Analytics Filters
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
          {/* Company filter */}
          <Grid item xs={12} sm={6} md={3} lg={2.4}>
            <FormControl fullWidth size="small" variant="outlined" id="company-form-control">
              <InputLabel htmlFor="company-select" sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Company</InputLabel>
              <Select
                value={selectedCompany}
                label="Company"
                id="company-select"
                name="company"
                autoComplete="off"
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
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* School Year filter */}
          <Grid item xs={12} sm={6} md={3} lg={2.4}>
            <FormControl fullWidth size="small" variant="outlined" id="year-form-control">
              <InputLabel htmlFor="year-select" sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>School Year</InputLabel>
              <Select
                value={selectedYear}
                label="School Year"
                id="year-select"
                name="year"
                autoComplete="off"
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
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Semester filter */}
          <Grid item xs={12} sm={6} md={3} lg={2.4}>
            <FormControl fullWidth size="small" variant="outlined" id="semester-form-control">
              <InputLabel htmlFor="semester-select" sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Semester</InputLabel>
              <Select
                value={selectedSemester}
                label="Semester"
                id="semester-select"
                name="semester"
                autoComplete="off"
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
                {semesters.map((sem) => (
                  <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Survey Type filter */}
          <Grid item xs={12} sm={6} md={3} lg={2.4}>
            <FormControl fullWidth size="small" variant="outlined" id="survey-type-form-control">
              <InputLabel htmlFor="survey-type-select" sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Evaluation Type</InputLabel>
              <Select
                value={selectedSurveyType}
                label="Evaluation Type"
                id="survey-type-select"
                name="surveyType"
                autoComplete="off"
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
                <MenuItem value="all">All Evaluations</MenuItem>
                <MenuItem value="midterm">Midterm Evaluation</MenuItem>
                <MenuItem value="final">Final Evaluation</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Program filter */}
          <Grid item xs={12} sm={6} md={3} lg={2.4}>
            <FormControl fullWidth size="small" variant="outlined" id="program-form-control">
              <InputLabel htmlFor="program-select" sx={{ color: 'rgba(128, 0, 0, 0.8)' }}>Program</InputLabel>
              <Select
                value={selectedProgram}
                label="Program"
                id="program-select"
                name="program"
                autoComplete="off"
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
                  <MenuItem key={program} value={program}>{program}</MenuItem>
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
            {selectedCompany && (
              <Chip
                label={`Company: ${companies.find(c => c.id === selectedCompany)?.name || selectedCompany}`}
                onDelete={() => setSelectedCompany(companies.length > 0 ? companies[0].id : '')}
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
            
            {selectedYear && (
              <Chip
                label={`Year: ${selectedYear}`}
                onDelete={() => setSelectedYear(years.length > 0 ? years[0] : '')}
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
            
            {selectedSemester && (
              <Chip
                label={`Semester: ${selectedSemester}`}
                onDelete={() => setSelectedSemester('1st')}
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
                label={`Evaluation: ${selectedSurveyType === 'midterm' ? 'Midterm Evaluation' : 'Final Evaluation'}`}
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
            
            {selectedProgram !== 'all' && (
              <Chip
                label={`Program: ${selectedProgram}`}
                onDelete={() => setSelectedProgram('all')}
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

        {/* Results summary and error messages */}
        <Box sx={{ mt: 2 }}>
          {selectedCompany && selectedYear && selectedSemester && getFilteredData().length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(128, 0, 0, 0.05)', 
              p: 1, 
              borderRadius: 1 
            }}>
              <AssessmentIcon sx={{ color: '#800000', mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ color: '#800000', fontWeight: 'medium' }}>
                Showing company metrics for {selectedSurveyType === 'all' ? 'all evaluations' : 
                  selectedSurveyType === 'midterm' ? 'midterm evaluations' : 'final evaluations'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(211, 47, 47, 0.05)', 
              p: 1.5, 
              borderRadius: 1,
              border: '1px dashed rgba(211, 47, 47, 0.3)'
            }}>
              <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                No data found for the selected filters. Try adjusting your criteria.
              </Typography>
            </Box>
          )}
        </Box>

        {selectedSurveyType === 'all' && 
          getFilteredData().filter(e => e.surveyType === 'final').length > 0 && 
          getFilteredData().filter(e => e.surveyType === 'midterm').length > 0 && (
          <Box sx={{ mt: 2 }}>
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

  // Get average rating for a given data type
  const getAverageRating = (dataType) => {
    const data = getFilteredData(dataType);
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.rating, 0) / data.length;
  };

  // Get top metrics for a given data type
  const getTopMetrics = () => {
    const workEnvData = getFilteredData('workEnvironmentData');
    const performanceData = getFilteredData('performanceData');
    const cultureData = getFilteredData('cultureData');
    
    // Combine all data and sort by rating
    const combinedData = [...workEnvData, ...performanceData, ...cultureData];
    return combinedData.sort((a, b) => b.rating - a.rating).slice(0, 4);
  };

  // Get bottom metrics for a given data type
  const getBottomMetrics = () => {
    const workEnvData = getFilteredData('workEnvironmentData');
    const performanceData = getFilteredData('performanceData');
    const cultureData = getFilteredData('cultureData');
    
    // Combine all data and sort by rating
    const combinedData = [...workEnvData, ...performanceData, ...cultureData];
    return combinedData.sort((a, b) => a.rating - b.rating).slice(0, 4);
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
            aria-label="Loading outer ring"
            sx={{
              color: '#FFD700',
              position: 'absolute',
              animation: `${rotateOuter} 3s linear infinite`,
            }}
          />
          <CircularProgress
            size={60}
            thickness={3}
            aria-label="Loading inner ring"
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
        <FilterSection />
      </Grid>

      {getFilteredData('workEnvironmentData').length === 0 && (
        <Grid item xs={12}>
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#800000' }}>
              No data available. Please select a different combination of filters.
            </Typography>
          </Box>
        </Grid>
      )}
      
      {getFilteredData('workEnvironmentData').length > 0 && (
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
                    {companies.find(c => c.id === selectedCompany)?.name || 'Company'} Performance Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedYear} • {selectedSemester} Semester • {selectedProgram !== 'all' ? `${selectedProgram} Program` : 'All Programs'}
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
                      Environment
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: getRatingColor(getAverageRating('workEnvironmentData'))
                    }}>
                      {getAverageRating('workEnvironmentData').toFixed(1)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(128, 0, 0, 0.1)' }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Support
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: getRatingColor(getAverageRating('performanceData'))
                    }}>
                      {getAverageRating('performanceData').toFixed(1)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(128, 0, 0, 0.1)' }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Culture
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: getRatingColor(getAverageRating('cultureData'))
                    }}>
                      {getAverageRating('cultureData').toFixed(1)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(128, 0, 0, 0.1)' }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Overall
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: getRatingColor((getAverageRating('workEnvironmentData') + getAverageRating('performanceData') + getAverageRating('cultureData')) / 3)
                    }}>
                      {((getAverageRating('workEnvironmentData') + getAverageRating('performanceData') + getAverageRating('cultureData')) / 3).toFixed(1)}
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
                      {getTopMetrics().map((metric, index) => (
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
                      {getBottomMetrics().map((metric, index) => (
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
      )}
      
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
                  Work Environment Assessment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Evaluation of workplace atmosphere, culture, and employee engagement
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: {xs: 1, sm: 0},
                bgcolor: getRatingBgColor(getAverageRating('workEnvironmentData')),
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Average:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: getRatingColor(getAverageRating('workEnvironmentData'))
                }}>
                  {getAverageRating('workEnvironmentData').toFixed(1)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
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
                  Performance Analysis
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Detailed evaluation of work performance and efficiency metrics
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: {xs: 1, sm: 0},
                bgcolor: getRatingBgColor(getAverageRating('performanceData')),
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Average:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: getRatingColor(getAverageRating('performanceData'))
                }}>
                  {getAverageRating('performanceData').toFixed(1)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
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
                  Company Culture Assessment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Evaluation of corporate culture, recognition, and overall employee experience
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: {xs: 1, sm: 0},
                bgcolor: getRatingBgColor(getAverageRating('cultureData')),
                px: 2,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Average:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: getRatingColor(getAverageRating('cultureData'))
                }}>
                  {getAverageRating('cultureData').toFixed(1)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {/* Company Culture Cards */}
              {getFilteredData('cultureData').map((metric) => (
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

export default CompanyMetrics; 