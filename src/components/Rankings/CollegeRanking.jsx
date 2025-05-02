/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Grid,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/system';
import { Business, EmojiEvents, School } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { keyframes } from '@mui/system';

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

const maroon = '#800000';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  marginBottom: theme.spacing(3),
  '&:hover': {
    boxShadow: '0 4px 8px rgba(128, 0, 0, 0.1)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme, rank }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: rank === 1 
      ? 'rgba(255, 215, 0, 0.05)' 
      : rank === 2 
        ? 'rgba(192, 192, 192, 0.05)' 
        : rank === 3 
          ? 'rgba(205, 127, 50, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)',
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: rank === 1 
      ? 'rgba(255, 215, 0, 0.1)' 
      : rank === 2 
        ? 'rgba(192, 192, 192, 0.1)' 
        : rank === 3 
          ? 'rgba(205, 127, 50, 0.1)' 
          : 'rgba(0, 0, 0, 0.04)',
  },
}));

const RankBadge = styled(Box)(({ theme, rank }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  fontWeight: 'bold',
  fontSize: '0.75rem',
  margin: '0 auto',
  ...(rank === 1 && {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    border: '1px solid #FFD700',
  }),
  ...(rank === 2 && {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    color: '#A0A0A0',
    border: '1px solid #C0C0C0',
  }),
  ...(rank === 3 && {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    color: '#CD7F32',
    border: '1px solid #CD7F32',
  }),
  ...(rank > 3 && {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: theme.palette.text.secondary,
    border: '1px solid rgba(0, 0, 0, 0.12)',
  }),
}));

const ProgressBar = styled(LinearProgress)(({ theme, value, rank }) => ({
  height: 8,
  borderRadius: 4,
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  '.MuiLinearProgress-bar': {
    backgroundColor: rank === 1 
      ? '#FFD700' 
      : rank === 2 
        ? '#C0C0C0' 
        : rank === 3 
          ? '#CD7F32' 
          : maroon,
  }
}));

function CollegeRanking({ collegeFilter = 'All', semesterFilter, yearFilter, surveyTypeFilter = 'all' }) {
  // Always set collegeFilter to 'All' to show all colleges regardless of what was passed
  collegeFilter = 'All';
  
  const [loading, setLoading] = useState(true);
  const [collegeStats, setCollegeStats] = useState([]);
  const [error, setError] = useState(null);

  // Helper function to normalize semester values - same as in StudentRankings
  const normalizeSemester = (semester) => {
    if (!semester) return '';
    
    const semesterStr = semester.toString().trim().toLowerCase();
    
    if (semesterStr.includes('first') || semesterStr === '1' || semesterStr === '1st') {
      return 'First';
    } else if (semesterStr.includes('second') || semesterStr === '2' || semesterStr === '2nd') {
      return 'Second';
    } else if (semesterStr.includes('summer') || semesterStr === '3' || semesterStr === '3rd') {
      return 'Summer';
    }
    
    // If no match, return the original value with first letter capitalized
    return semester.charAt(0).toUpperCase() + semester.slice(1);
  };

  // Helper function to normalize year values
  const normalizeYear = (year) => {
    if (!year) return '';
    
    // Convert to string
    const yearStr = year.toString().trim();
    
    // Handle academic year formats like "2022-2023" or "2022/2023"
    if (yearStr.includes('-') || yearStr.includes('/')) {
      // For filtering, we'll consider it a match if any part matches
      return yearStr;
    }
    
    return yearStr;
  };

  useEffect(() => {
    let finalSurveyUnsubscribe;
    let midtermSurveyUnsubscribe;

    function fetchCollegeStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Set up real-time listeners for both collections
        console.log("Setting up real-time listeners for college rankings");
        
        // Create a listener for final survey collection without any filters
        const finalSurveysRef = collection(db, 'studentSurveys_final');
        finalSurveyUnsubscribe = onSnapshot(finalSurveysRef, (finalSnapshot) => {
          console.log(`Received update from final surveys: ${finalSnapshot.docs.length} documents`);
          
          // Process final surveys
        const finalSurveys = finalSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          surveyType: 'final'
        }));
        
          // Create a listener for midterm survey collection without any filters
          const midtermSurveysRef = collection(db, 'studentSurveys_midterm');
          midtermSurveyUnsubscribe = onSnapshot(midtermSurveysRef, (midtermSnapshot) => {
            console.log(`Received update from midterm surveys: ${midtermSnapshot.docs.length} documents`);
            
            // Process midterm surveys
        const midtermSurveys = midtermSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          surveyType: 'midterm'
        }));
        
            // Initialize a map to track unique students with their scores
            const studentMap = new Map();
            
            // Process final surveys first
            finalSurveys.forEach(survey => {
              const studentId = survey.studentId || survey.student_id || survey.id;
              if (!studentId) return;
              
              // Calculate score for this survey
              let score = 0;
              if (survey.totalScore !== undefined && survey.maxPossibleScore) {
                score = (survey.totalScore / survey.maxPossibleScore) * 10;
              } else if (survey.workAttitude && survey.workPerformance) {
                const attitudeScore = survey.workAttitude.totalScore || 0;
                const attitudeMax = survey.workAttitude.maxPossibleScore || 40;
                
                const performanceScore = survey.workPerformance.totalScore || 0;
                const performanceMax = survey.workPerformance.maxPossibleScore || 60;
                
                const totalMax = attitudeMax + performanceMax;
                const totalScore = attitudeScore + performanceScore;
                
                score = totalMax > 0 ? (totalScore / totalMax) * 10 : 0;
              }
              
              // Get program, college, semester, and year information
              const student = {
                id: studentId,
                name: survey.studentName || 'Unknown',
                program: survey.program || 'Unknown Program',
                college: survey.college || 'Unknown College',
                section: survey.section || 'Unspecified',
                semester: normalizeSemester(survey.semester),
                schoolYear: survey.schoolYear || '',
                partnerCompany: survey.partnerCompany || survey.companyName || survey.company
              };
              
              // Initialize student in map if not exists
              if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                  student: student,
                  finalSurveys: [],
                  midtermSurveys: [],
                  finalAvgScore: 0,
                  midtermAvgScore: 0,
                  combinedScore: 0
                });
              } else {
                // Update student info with any additional data
                const existingData = studentMap.get(studentId);
                existingData.student = {
                  ...existingData.student,
                  ...student
                };
              }
              
              // Add score to student data
              studentMap.get(studentId).finalSurveys.push({
                score: score,
                survey: survey
              });
            });
            
            // Process midterm surveys
            midtermSurveys.forEach(survey => {
              const studentId = survey.studentId || survey.student_id || survey.id;
              if (!studentId) return;
              
              // Calculate score for this survey
          let score = 0;
          if (survey.totalScore !== undefined && survey.maxPossibleScore) {
            score = (survey.totalScore / survey.maxPossibleScore) * 10;
              } else if (survey.workAttitude && survey.workPerformance) {
            const attitudeScore = survey.workAttitude.totalScore || 0;
            const attitudeMax = survey.workAttitude.maxPossibleScore || 40;
            
            const performanceScore = survey.workPerformance.totalScore || 0;
            const performanceMax = survey.workPerformance.maxPossibleScore || 60;
            
            const totalMax = attitudeMax + performanceMax;
            const totalScore = attitudeScore + performanceScore;
            
            score = totalMax > 0 ? (totalScore / totalMax) * 10 : 0;
          }
          
              // Get program, college, semester, and year information
              const student = {
                id: studentId,
                name: survey.studentName || 'Unknown',
                program: survey.program || 'Unknown Program',
                college: survey.college || 'Unknown College',
                section: survey.section || 'Unspecified',
                semester: normalizeSemester(survey.semester),
                schoolYear: survey.schoolYear || '',
                partnerCompany: survey.partnerCompany || survey.companyName || survey.company
              };
              
              // Initialize student in map if not exists
              if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                  student: student,
                  finalSurveys: [],
                  midtermSurveys: [],
                  finalAvgScore: 0,
                  midtermAvgScore: 0,
                  combinedScore: 0
              });
            } else {
                // Update student info with any additional data
                const existingData = studentMap.get(studentId);
                existingData.student = {
                  ...existingData.student,
                  ...student
                };
              }
              
              // Add score to student data
              studentMap.get(studentId).midtermSurveys.push({
                score: score,
                survey: survey
              });
            });
            
            // Calculate average scores and apply 50-50 weighting
            studentMap.forEach((data, studentId) => {
              // Calculate final average score
              if (data.finalSurveys.length > 0) {
                const totalFinalScore = data.finalSurveys.reduce((sum, item) => sum + item.score, 0);
                data.finalAvgScore = totalFinalScore / data.finalSurveys.length;
              }
              
              // Calculate midterm average score
              if (data.midtermSurveys.length > 0) {
                const totalMidtermScore = data.midtermSurveys.reduce((sum, item) => sum + item.score, 0);
                data.midtermAvgScore = totalMidtermScore / data.midtermSurveys.length;
              }
              
              // Apply 50-50 weighting if both types are available
              if (data.finalSurveys.length > 0 && data.midtermSurveys.length > 0) {
                // 50% weight to each type
                data.combinedScore = (data.finalAvgScore * 0.5) + (data.midtermAvgScore * 0.5);
              }
              // Otherwise use available data (100% weight to what we have)
              else if (data.finalSurveys.length > 0) {
                data.combinedScore = data.finalAvgScore;
              }
              else if (data.midtermSurveys.length > 0) {
                data.combinedScore = data.midtermAvgScore;
              }
              // If no surveys, use evaluation score (should be rare for college rankings)
              else {
                data.combinedScore = 0;
              }
              
              // Set final properties for this student
              data.student.evaluationScore = Math.round(data.combinedScore * 10) / 10;
              data.student.hasFinalData = data.finalSurveys.length > 0;
              data.student.hasMidtermData = data.midtermSurveys.length > 0;
              data.student.surveyScores = {
                final: data.finalSurveys.length > 0 ? Math.round(data.finalAvgScore * 10) / 10 : null,
                midterm: data.midtermSurveys.length > 0 ? Math.round(data.midtermAvgScore * 10) / 10 : null,
                all: Math.round(data.combinedScore * 10) / 10
              };
            });
            
            // Filter students based on selected filters BUT IGNORE COLLEGE FILTER
            let filteredStudents = Array.from(studentMap.values()).map(data => data.student);
            
            // Apply survey type filter if specified
            if (surveyTypeFilter !== 'all') {
              filteredStudents = filteredStudents.filter(student => 
                surveyTypeFilter === 'final' ? student.hasFinalData : student.hasMidtermData
              );
            }
            
            // Don't apply college filter - show all colleges
            
            // Apply semester filter if specified
            if (semesterFilter && semesterFilter !== 'All') {
              const normalizedSemester = normalizeSemester(semesterFilter);
              filteredStudents = filteredStudents.filter(student => 
                normalizeSemester(student.semester) === normalizedSemester
              );
            }
            
            // Apply year filter if specified
            if (yearFilter && yearFilter !== 'All') {
              const normalizedYear = normalizeYear(yearFilter);
              filteredStudents = filteredStudents.filter(student => 
                normalizeYear(student.schoolYear) === normalizedYear
              );
            }
            
            // Group data by college
            const colleges = {};
            
            filteredStudents.forEach(student => {
              const collegeId = student.college;
              if (!collegeId) return;
              
              // Get or create college entry
              if (!colleges[collegeId]) {
                colleges[collegeId] = {
                  id: collegeId,
                  name: collegeId,
                  college: collegeId,
                  students: [],
                  totalScore: 0,
                  averageScore: 0,
                  highestScore: 0,
                  studentCount: 0,
                  programs: {}
                };
              }
              
              // Add student to college
              colleges[collegeId].students.push(student);
              
              // Get or create program entry
              const programId = student.program;
              if (!programId) return;
              
              if (!colleges[collegeId].programs[programId]) {
                colleges[collegeId].programs[programId] = {
                  id: programId,
                  name: programId,
                  college: collegeId,
                  students: [],
                  totalScore: 0,
                  averageScore: 0,
                  studentCount: 0
                };
              }
              
              // Add student to program
              colleges[collegeId].programs[programId].students.push(student);
            });
            
            // Calculate stats for each college and program
        Object.values(colleges).forEach(college => {
              // Calculate college stats
              college.studentCount = college.students.length;
              
              let totalScore = 0;
          let highestScore = 0;
          
              college.students.forEach(student => {
                const score = surveyTypeFilter !== 'all' && student.surveyScores?.[surveyTypeFilter] !== null
                  ? student.surveyScores[surveyTypeFilter]
                  : student.evaluationScore;
                
                totalScore += score;
                if (score > highestScore) {
                  highestScore = score;
                }
              });
              
              college.totalScore = totalScore;
          college.highestScore = Math.round(highestScore * 10) / 10;
              college.averageScore = college.studentCount > 0
                ? Math.round((totalScore / college.studentCount) * 10) / 10
                : 0;
          
              // Calculate program stats
          Object.values(college.programs).forEach(program => {
                program.studentCount = program.students.length;
            
            let programTotalScore = 0;
                program.students.forEach(student => {
                  const score = surveyTypeFilter !== 'all' && student.surveyScores?.[surveyTypeFilter] !== null
                    ? student.surveyScores[surveyTypeFilter]
                    : student.evaluationScore;
                  
                  programTotalScore += score;
            });
            
            program.totalScore = programTotalScore;
                program.averageScore = program.studentCount > 0
                  ? Math.round((programTotalScore / program.studentCount) * 10) / 10
                  : 0;
          });
        });
        
        // Convert to array and sort by average score
        const collegeArray = Object.values(colleges);
        collegeArray.sort((a, b) => b.averageScore - a.averageScore);
        
        console.log("Processed college stats:", collegeArray);
        
        setCollegeStats(collegeArray);
        setLoading(false);
          });
        });
      } catch (error) {
        console.error("Error fetching college stats:", error);
        setError("Failed to load rankings. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchCollegeStats();
    
    return () => {
      if (finalSurveyUnsubscribe) {
        finalSurveyUnsubscribe();
      }
      if (midtermSurveyUnsubscribe) {
        midtermSurveyUnsubscribe();
      }
    };
  }, [collegeFilter, semesterFilter, yearFilter, surveyTypeFilter]);
  
  // Function to calculate a numeric score from evaluation text
  const calculateEvaluationScore = (evaluation) => {
    if (!evaluation) return 0;
    
    const positiveKeywords = [
      'excellent', 'outstanding', 'exceptional', 'great', 'good', 
      'skilled', 'proficient', 'talented', 'impressive', 'dedicated',
      'reliable', 'innovative', 'efficient', 'thorough', 'professional'
    ];
    
    const normalizedText = evaluation.toLowerCase();
    
    // Base score from evaluation length (max 4 points)
    let score = Math.min(evaluation.length / 100, 4);
    
    // Score from positive keywords (max 4 points)
    const keywordScore = positiveKeywords.reduce((acc, keyword) => {
      return acc + (normalizedText.includes(keyword) ? 0.4 : 0);
    }, 0);
    
    // Add keyword score
    score += Math.min(keywordScore, 4);
    
    // Add 2 points if evaluation is comprehensive (contains multiple sentences)
    const sentences = evaluation.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
      score += 2;
    }
    
    return Math.min(score, 10); // Cap at 10
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
              color: maroon,
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
          Loading College Rankings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the college performance data...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 2, color: 'error.main' }}>
        <Typography variant="body1">
          Error loading college rankings: {error}
        </Typography>
      </Box>
    );
  }
  
  if (collegeStats.length === 0) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No college data available.
          {semesterFilter !== 'All' && ` Semester: ${semesterFilter}`}
          {yearFilter !== 'All' && ` Year: ${yearFilter}`}
        </Typography>
      </Box>
    );
  }

  // Find the max average score for relative progress bars
  const maxAverageScore = Math.max(...collegeStats.map(college => college.averageScore));

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Business sx={{ mr: 1, color: maroon }} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: maroon,
          }}
        >
          College Performance Rankings
        </Typography>
        {surveyTypeFilter !== 'all' && (
          <Chip 
            label={`${surveyTypeFilter === 'midterm' ? 'Midterm' : 'Final'} Evaluation`}
            size="small"
            sx={{ 
              ml: 2,
              bgcolor: 'rgba(128, 0, 0, 0.08)',
              color: '#800000',
              fontWeight: 'medium',
              border: '1px solid rgba(128, 0, 0, 0.2)'
            }}
          />
        )}
      </Box>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: 2, 
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box component="span" sx={{ 
          display: 'inline-block', 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          bgcolor: 'info.main', 
          mr: 1 
        }} />
        Showing all colleges for accurate comparison. Use filters above to narrow results by semester or school year.
      </Typography>
      
      <StyledCard>
        <CardContent>
          <TableContainer sx={{ borderRadius: 0, boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(128, 0, 0, 0.03)' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%', py: 1 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%', py: 1 }}>College</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%', py: 1 }}>College</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', py: 1, textAlign: 'center' }}>Students</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '32%', py: 1 }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collegeStats.map((college, index) => (
                  <StyledTableRow key={college.name} rank={index + 1}>
                    <TableCell sx={{ py: 1, textAlign: 'center' }}>
                      <RankBadge rank={index + 1}>
                        {index + 1}
                      </RankBadge>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <School fontSize="small" sx={{ mr: 1, color: maroon, opacity: 0.7 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {college.name}
                        </Typography>
                      </Box>
                    </TableCell>
                      <TableCell sx={{ py: 1 }}>{college.college}</TableCell>
                    <TableCell sx={{ py: 1, textAlign: 'center' }}>
                      <Chip 
                        label={college.studentCount} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(128, 0, 0, 0.08)',
                          color: maroon,
                          fontWeight: 'medium',
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Average: {college.averageScore.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Highest: {college.highestScore.toFixed(1)}
                          </Typography>
                        </Box>
                        <ProgressBar 
                          variant="determinate" 
                          value={(college.averageScore / maxAverageScore) * 100} 
                          rank={index + 1}
                        />
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </StyledCard>
      
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" color={maroon} sx={{ mb: 1.5 }}>
                <EmojiEvents fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Top 3 Colleges
              </Typography>
              
              {collegeStats.slice(0, 3).map((college, index) => (
                <Box key={college.name} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <RankBadge rank={index + 1} sx={{ mr: 1.5 }}>
                    {index + 1}
                  </RankBadge>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {college.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {college.college}
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: index === 0 
                      ? '#FFD700' 
                      : index === 1 
                        ? '#C0C0C0' 
                        : '#CD7F32',
                    fontWeight: 'bold'
                  }}>
                    {college.averageScore.toFixed(1)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" color={maroon} sx={{ mb: 1.5 }}>
                <School fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Most Active Colleges
              </Typography>
              
              {[...collegeStats].sort((a, b) => b.studentCount - a.studentCount).slice(0, 3).map((college, index) => (
                <Box key={college.name} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Chip 
                    label={college.studentCount} 
                    size="small" 
                    sx={{ 
                      mr: 1.5,
                      minWidth: 30,
                      bgcolor: 'rgba(128, 0, 0, 0.08)',
                      color: maroon,
                      fontWeight: 'medium',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {college.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {college.college}
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: maroon,
                    fontWeight: 'medium'
                  }}>
                    {college.averageScore.toFixed(1)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Student List by Section */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <School sx={{ mr: 1, color: maroon }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: maroon,
            }}
          >
            Top Students by Section
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box component="span" sx={{ 
            display: 'inline-block', 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: 'info.main', 
            mr: 1 
          }} />
          Showing top students from each college with their section information
        </Typography>
        
        {collegeStats.map((college) => {
          // Get students from this college and sort by score
          const sortedStudents = [...college.students]
            .sort((a, b) => b.evaluationScore - a.evaluationScore)
            .slice(0, 10); // Show top 10 students per college
          
          if (sortedStudents.length === 0) return null;
          
          return (
            <StyledCard key={`students-${college.id}`} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <School fontSize="small" sx={{ mr: 1, color: maroon, opacity: 0.7 }} />
                  <Typography variant="subtitle1" fontWeight="medium" color={maroon}>
                    {college.name} - Top Students
                  </Typography>
                  <Chip 
                    label={`${college.studentCount} students total`} 
                    size="small" 
                    sx={{ 
                      ml: 2,
                      bgcolor: 'rgba(128, 0, 0, 0.08)',
                      color: maroon,
                      fontWeight: 'medium',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
                
                <TableContainer sx={{ borderRadius: 0, boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(128, 0, 0, 0.03)' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '8%', py: 1 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '30%', py: 1 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '22%', py: 1 }}>Section</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '30%', py: 1 }}>Program</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1, textAlign: 'center' }}>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedStudents.map((student, index) => (
                        <StyledTableRow key={student.id} rank={index + 1}>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <RankBadge rank={index + 1}>
                              {index + 1}
                            </RankBadge>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip 
                              label={student.section} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(128, 0, 0, 0.08)',
                                color: maroon,
                                fontWeight: 'medium',
                                fontSize: '0.7rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>{student.program}</TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <Typography sx={{ 
                              color: maroon,
                              fontWeight: 'medium'
                            }}>
                              {(surveyTypeFilter === 'final' && student.surveyScores?.final !== null
                                ? student.surveyScores.final
                                : surveyTypeFilter === 'midterm' && student.surveyScores?.midterm !== null
                                  ? student.surveyScores.midterm 
                                  : student.evaluationScore || 0).toFixed(1)}
                            </Typography>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          );
        })}
      </Box>
    </Box>
  );
}

export default CollegeRanking; 