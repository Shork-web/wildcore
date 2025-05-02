import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Collapse,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Pagination from '@mui/material/Pagination';

const SurveyDataView = ({ students, evaluationData, searchQuery }) => {
  const [filteredEvaluationData, setFilteredEvaluationData] = useState([]);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  // Initialize filtered students
  useEffect(() => {
    setLoading(true);
    if (evaluationData && evaluationData.length > 0) {
      setFilteredEvaluationData(evaluationData);
    } else {
      setFilteredEvaluationData([]);
    }
    setLoading(false);
  }, [evaluationData]);

  // Handle search functionality
  useEffect(() => {
    if (!searchQuery) {
      if (evaluationData && evaluationData.length > 0) {
        setFilteredEvaluationData(evaluationData);
      }
      return;
    }

    // If search query exists, filter the data
    const query = searchQuery.toLowerCase();
    if (evaluationData && evaluationData.length > 0) {
      const filtered = evaluationData.filter(student => 
        (student.studentName || '').toLowerCase().includes(query) ||
        (student.program || '').toLowerCase().includes(query) ||
        (student.company || student.companyName || '').toLowerCase().includes(query) ||
        (student.section || '').toLowerCase().includes(query)
      );
      setFilteredEvaluationData(filtered);
    }
  }, [searchQuery, evaluationData]);

  // Toggle student card expansion with auto-close functionality
  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => {
      // Create a new state object
      const newState = {};
      
      // If the clicked student is already expanded, just toggle it off
      if (prev[studentId]) {
        return {
          ...newState,
          [studentId]: false
        };
      }
      
      // Otherwise, close all others and open this one
      return {
        ...newState,
        [studentId]: true
      };
    });
  };

  // Get rating color based on score
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#2e7d32'; // Green for Excellent
    if (rating >= 4.0) return '#1976d2'; // Blue for Good
    if (rating >= 3.0) return '#ed6c02'; // Orange for Satisfactory
    return '#d32f2f'; // Red for Needs Improvement
  };

  // Calculate work attitude metrics from survey data
  const calculateWorkAttitudeMetrics = (surveyData) => {
    if (!surveyData) return null;
    
    // Default metrics structure
    const metrics = {
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
    
    // If we have structured workAttitude data from student surveys
    if (surveyData.workAttitude && surveyData.workAttitude.ratings) {
      const ratings = surveyData.workAttitude.ratings;
      
      // Map specific survey rating fields to our metrics
      if (ratings["Cooperation and Willingness"]) {
        metrics.teamwork.rating = Number(ratings["Cooperation and Willingness"]);
      }
      
      if (ratings["Attentiveness / Attention"]) {
        metrics.communication.rating = Number(ratings["Attentiveness / Attention"]);
      }
      
      if (ratings["Attendance"]) {
        metrics.punctuality.rating = Number(ratings["Attendance"]);
      }
      
      if (ratings["Industriousness and Initiative"]) {
        metrics.initiative.rating = Number(ratings["Industriousness and Initiative"]);
      }
      
      // Add additional mappings if needed
      if (metrics.teamwork.rating === 0 && ratings["Adaptability and Sociability"]) {
        metrics.teamwork.rating = Number(ratings["Adaptability and Sociability"]);
      }
      
      if (metrics.initiative.rating === 0 && ratings["Enthusiasm / Eagerness to Learn"]) {
        metrics.initiative.rating = Number(ratings["Enthusiasm / Eagerness to Learn"]);
      }
      
      if (metrics.communication.rating === 0 && ratings["Personal Grooming and Pleasant Disposition"]) {
        metrics.communication.rating = Number(ratings["Personal Grooming and Pleasant Disposition"]);
      }
      
      if (metrics.punctuality.rating === 0 && ratings["Sense of Responsibility"]) {
        metrics.punctuality.rating = Number(ratings["Sense of Responsibility"]);
      }
    } else {
      // Fallback to old method for backward compatibility
      // Helper function to find numeric ratings
      const findRating = (data, keyPatterns) => {
        for (const key of Object.keys(data)) {
          for (const pattern of keyPatterns) {
            if (key.toLowerCase().includes(pattern) && !isNaN(data[key]) && data[key] > 0 && data[key] <= 5) {
              return Number(data[key]);
            }
          }
        }
        return 0;
      };
      
      // Extract ratings from survey data
      metrics.teamwork.rating = findRating(surveyData, ['teamwork', 'cooperation', 'team', 'willingness']);
      metrics.communication.rating = findRating(surveyData, ['communication', 'verbal', 'written', 'attentiveness']);
      metrics.punctuality.rating = findRating(surveyData, ['punctuality', 'attendance', 'time']);
      metrics.initiative.rating = findRating(surveyData, ['initiative', 'proactive', 'industriousness']);
    }
    
    return Object.values(metrics);
  };

  // Calculate work performance metrics from survey data
  const calculateWorkPerformanceMetrics = (surveyData) => {
    if (!surveyData) return null;
    
    // Default metrics structure
    const metrics = {
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
    
    // If we have structured workPerformance data from student surveys
    if (surveyData.workPerformance && surveyData.workPerformance.ratings) {
      const ratings = surveyData.workPerformance.ratings;
      
      // Map specific survey rating fields to our metrics
      if (ratings["Comprehension"]) {
        metrics.technicalSkills.rating = Number(ratings["Comprehension"]);
      }
      
      if (ratings["Dependability"]) {
        metrics.adaptability.rating = Number(ratings["Dependability"]);
      }
      
      if (ratings["Quality of Work"]) {
        metrics.productivity.rating = Number(ratings["Quality of Work"]);
      } else if (ratings["Quantity of Work"]) {
        metrics.productivity.rating = Number(ratings["Quantity of Work"]);
      }
      
      if (ratings["Safety Consciousness"]) {
        metrics.criticalThinking.rating = Number(ratings["Safety Consciousness"]);
      } else if (ratings["Waste of Consciousness"]) {
        metrics.criticalThinking.rating = Number(ratings["Waste of Consciousness"]);
      }
    } else {
      // Fallback to old method for backward compatibility
      // Helper function to find numeric ratings
      const findRating = (data, keyPatterns) => {
        for (const key of Object.keys(data)) {
          for (const pattern of keyPatterns) {
            if (key.toLowerCase().includes(pattern) && !isNaN(data[key]) && data[key] > 0 && data[key] <= 5) {
              return Number(data[key]);
            }
          }
        }
        return 0;
      };
      
      // Extract ratings from survey data
      metrics.technicalSkills.rating = findRating(surveyData, ['technical', 'skill', 'knowledge', 'comprehension']);
      metrics.adaptability.rating = findRating(surveyData, ['adaptability', 'adapt', 'flexible', 'sociability']);
      metrics.productivity.rating = findRating(surveyData, ['productivity', 'quality', 'quantity', 'work']);
      metrics.criticalThinking.rating = findRating(surveyData, ['critical', 'thinking', 'analytical', 'problem']);
    }
    
    return Object.values(metrics);
  };

  // Function to get survey data for a student (returns both midterm and final)
  const getSurveyData = (student) => {
    return {
      midtermMentorData: student.midtermEvaluationData,
      finalMentorData: student.finalEvaluationData,
      studentInfo: {
        name: student.studentName,
        program: student.program,
        section: student.section,
        email: student.email,
        internshipEmail: student.internshipEmail,
        company: student.company || student.companyName
      }
    };
  };

  // Render metrics as a table with only Aspect and Rating columns
  const renderMetricsTable = (title, metrics) => {
    if (!metrics || metrics.length === 0) return null;
    return (
      <Card sx={{ mb: 0.5, borderRadius: 1, boxShadow: '0 1px 1px rgba(0,0,0,0.03)', overflow: 'hidden', p: 0.5 }}>
        <Box sx={{ p: 0.5, pb: 0.2 }}>
          <Typography sx={{ color: '#800000', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1 }}>{title}</Typography>
        </Box>
        <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 1, mb: 0.5 }}>
          <Table size="small" sx={{ minWidth: 160 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(248, 248, 248, 0.9)' }}>
                <TableCell sx={{ fontWeight: 600, color: '#800000', fontSize: '0.75rem', py: 0.3, px: 0.7, lineHeight: 1 }}>Aspect</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#800000', fontSize: '0.75rem', textAlign: 'center', py: 0.3, px: 0.7, lineHeight: 1 }}>Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((metric, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 500, color: '#800000', fontSize: '0.75rem', py: 0.3, px: 0.7, lineHeight: 1 }}>{metric.aspect}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: getRatingColor(metric.rating), fontSize: '0.85rem', py: 0.3, px: 0.7, lineHeight: 1 }}>{metric.rating.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  };

  // Render survey data for a student
  const renderStudentSurveyData = (student) => {
    const surveyInfo = getSurveyData(student);
    const isExpanded = !!expandedStudents[student.studentId];

    // Midterm metrics
    const hasMidtermMentorData = !!surveyInfo.midtermMentorData;
    const midtermWorkAttitudeMetrics = hasMidtermMentorData ? calculateWorkAttitudeMetrics(surveyInfo.midtermMentorData) : null;
    const midtermWorkPerformanceMetrics = hasMidtermMentorData ? calculateWorkPerformanceMetrics(surveyInfo.midtermMentorData) : null;
    
    // Final metrics
    const hasFinalMentorData = !!surveyInfo.finalMentorData;
    const finalWorkAttitudeMetrics = hasFinalMentorData ? calculateWorkAttitudeMetrics(surveyInfo.finalMentorData) : null;
    const finalWorkPerformanceMetrics = hasFinalMentorData ? calculateWorkPerformanceMetrics(surveyInfo.finalMentorData) : null;

    if (!hasMidtermMentorData && !hasFinalMentorData) {
      return (
        <Card sx={{ mb: 1, borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ color: '#800000', fontWeight: 'medium', fontSize: '0.9rem' }}>
                  {student.studentName}
                </Typography>
                {student.section && (
                  <Chip 
                    label={student.section} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      bgcolor: 'rgba(128, 0, 0, 0.08)',
                      color: '#800000',
                      height: 18,
                      fontSize: '0.65rem'
                    }} 
                  />
                )}
              </Box>
              <Chip
                icon={<HourglassEmptyIcon sx={{ fontSize: '0.75rem' }} />}
                label="Pending"
                size="small"
                sx={{
                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                  color: '#d32f2f',
                  height: '20px',
                  fontSize: '0.65rem',
                  '& .MuiChip-icon': {
                    color: '#d32f2f'
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    // Only render the analytics/metrics section (no student info)
    return (
      <Box sx={{ background: 'rgba(250,250,250,0.7)' }}>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ p: 0.5, pt: 0.2, pb: 0.2, '&:last-child': { pb: 0.2 } }}>
            <Grid container spacing={1}>
              {/* Midterm Evaluation */}
              {hasMidtermMentorData && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#800000', fontWeight: 'bold', mb: 0.5, fontSize: '0.95rem' }}>
                    Midterm Evaluation
                  </Typography>
                  {midtermWorkAttitudeMetrics && midtermWorkAttitudeMetrics.length > 0 && (
                    renderMetricsTable(
                      "Work Attitude", 
                      midtermWorkAttitudeMetrics
                    )
                  )}
                  {midtermWorkPerformanceMetrics && midtermWorkPerformanceMetrics.length > 0 && (
                    renderMetricsTable(
                      "Work Performance", 
                      midtermWorkPerformanceMetrics
                    )
                  )}
                </Grid>
              )}
              
              {/* Final Evaluation */}
              {hasFinalMentorData && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#800000', fontWeight: 'bold', mb: 0.5, fontSize: '0.95rem' }}>
                    Final Evaluation
                  </Typography>
                  {finalWorkAttitudeMetrics && finalWorkAttitudeMetrics.length > 0 && (
                    renderMetricsTable(
                      "Work Attitude", 
                      finalWorkAttitudeMetrics
                    )
                  )}
                  {finalWorkPerformanceMetrics && finalWorkPerformanceMetrics.length > 0 && (
                    renderMetricsTable(
                      "Work Performance", 
                      finalWorkPerformanceMetrics
                    )
                  )}
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Collapse>
      </Box>
    );
  };

  // Render empty state when no data is available
  const renderEmptyState = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <ErrorOutlineIcon sx={{ fontSize: 60, color: '#800000', opacity: 0.5, mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'medium', mb: 1 }}>
          No Survey Data Available
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 450 }}>
          {searchQuery 
            ? `No results found for "${searchQuery}". Try different search terms or clear the search.` 
            : "There are currently no survey evaluations available. Evaluations will appear here once submitted."}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          background: '#fff',
          width: '100%',
          p: 0,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading evaluation data...</Typography>
          </Box>
        ) : filteredEvaluationData.length === 0 ? (
          renderEmptyState()
        ) : (
          <TableContainer
            sx={{
              maxHeight: 520,
              minHeight: 200,
              borderRadius: 4,
              background: 'transparent',
              '&::-webkit-scrollbar': {
                width: '10px',
                height: '10px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#800000',
                borderRadius: '4px',
                '&:hover': {
                  background: '#600000',
                },
              },
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(248, 248, 248, 0.9)' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.9rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.9rem' }}>Program</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.9rem' }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.9rem' }}>Company</TableCell>
                  <TableCell sx={{ width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvaluationData.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((student) => {
                  const isExpanded = !!expandedStudents[student.studentId];
                  
                  return (
                    <React.Fragment key={student.studentId}>
                      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => toggleStudentExpansion(student.studentId)}>
                        <TableCell sx={{ color: '#800000', fontWeight: 500 }}>{student.studentName}</TableCell>
                        <TableCell>{student.program}</TableCell>
                        <TableCell>
                          {student.section && (
                            <Chip 
                              label={student.section} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(128, 0, 0, 0.08)',
                                color: '#800000',
                                height: 18,
                                fontSize: '0.65rem'
                              }} 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {student.company && (
                            <Chip 
                              label={student.company} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(128, 0, 0, 0.04)',
                                color: '#800000',
                                height: 18,
                                fontSize: '0.65rem',
                                maxWidth: 120,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} 
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            sx={{ color: '#800000', p: 0.5 }}
                            onClick={e => { e.stopPropagation(); toggleStudentExpansion(student.studentId); }}
                          >
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                          {isExpanded && renderStudentSurveyData(student)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {!loading && filteredEvaluationData.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '100%', mx: 'auto', mt: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', ml: 1 }}>
            Showing {Math.min(rowsPerPage, filteredEvaluationData.length - (page - 1) * rowsPerPage)} of {filteredEvaluationData.length} total entries
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(filteredEvaluationData.length / rowsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#800000',
                  '&.Mui-selected': {
                    backgroundColor: '#800000',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#600000',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(128, 0, 0, 0.1)',
                  },
                },
              }}
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: 90, ml: 'auto', mr: 1 }}>
            <InputLabel id="rows-per-page-label">Rows</InputLabel>
            <Select
              labelId="rows-per-page-label"
              value={rowsPerPage}
              label="Rows"
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
};

export default SurveyDataView; 