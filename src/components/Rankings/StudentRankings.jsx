import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Chip,
  Grid,
  Divider,
  Pagination,
  useTheme,
  useMediaQuery,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { styled } from '@mui/system';
import { School, EmojiEvents, Star, FilterAlt } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import CollegeRanking from './CollegeRanking';
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

const RankingBadge = styled(Box)(({ theme, rank }) => ({
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

// Custom styled formcontrol that matches the screenshot
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'white',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: maroon,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: maroon,
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: maroon,
  }
}));

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rankings-tabpanel-${index}`}
      aria-labelledby={`rankings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Calculate evaluation score from text
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

// Helper function to safely set score values, ensuring they're valid numbers
const safeScore = (value) => {
  if (value === undefined || value === null) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
};

// Helper function to find student matches by more reliable identifiers rather than IDs
const findStudentMatch = (survey, studentList) => {
  // Try to match by name (most reliable)
  if (survey.studentName || survey.name) {
    const surveyName = (survey.studentName || survey.name || '').toLowerCase().trim();
    if (surveyName) {
      const nameMatch = studentList.find(s => 
        s.name && s.name.toLowerCase().trim() === surveyName
      );
      if (nameMatch) return { student: nameMatch, matchType: "name" };
    }
  }
  
  // Try to match by section and other fields
  if (survey.section) {
    // First try section + program
    if (survey.program) {
      const sectionProgramMatch = studentList.find(s => 
        s.section === survey.section && 
        s.program === survey.program
      );
      if (sectionProgramMatch) return { student: sectionProgramMatch, matchType: "section-program" };
    }
    
    // Try section + other identifiers
    const sectionMatch = studentList.find(s => 
      s.section === survey.section &&
      ((survey.studentNumber && s.studentNumber === survey.studentNumber) ||
       (survey.email && s.email === survey.email))
    );
    if (sectionMatch) return { student: sectionMatch, matchType: "section-other" };
  }
  
  // Try studentNumber or email match alone
  if (survey.studentNumber) {
    const studentNumberMatch = studentList.find(s => s.studentNumber === survey.studentNumber);
    if (studentNumberMatch) return { student: studentNumberMatch, matchType: "student-number" };
  }
  
  if (survey.email) {
    const emailMatch = studentList.find(s => s.email === survey.email);
    if (emailMatch) return { student: emailMatch, matchType: "email" };
  }
  
  // As a last resort, try partial name match (if survey and student have names)
  if (survey.studentName || survey.name) {
    const surveyName = (survey.studentName || survey.name || '').toLowerCase().trim();
    if (surveyName && surveyName.length > 3) { // Only try for names longer than 3 chars
      const partialNameMatch = studentList.find(s => 
        s.name && s.name.toLowerCase().includes(surveyName)
      );
      if (partialNameMatch) return { student: partialNameMatch, matchType: "partial-name" };
    }
  }
  
  // No match found
  return { student: null, matchType: "none" };
};

// Fetch and calculate student scores
const fetchStudentScores = async (students) => {
  try {
    // Initially set students with just their baseline evaluation scores
    const studentsWithScores = students.map(student => {
      // Get baseline evaluation score for initial display
      const evaluationScore = calculateEvaluationScore(student.evaluation || '');
      
      return {
        ...student,
        surveyScores: {
          final: null,
          midterm: null,
          all: evaluationScore
        },
        evaluationScore: Math.round(evaluationScore * 10) / 10
      };
    });
    
    return studentsWithScores;
  } catch (error) {
    return students;
  }
};

function StudentRankings() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { currentUser } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSurveyType, setSelectedSurveyType] = useState('all'); // New survey type filter
  const [selectedCompany, setSelectedCompany] = useState('All'); // New company filter
  const [tabValue, setTabValue] = useState(0);
  
  // Replace single page state with a map of program-specific keys to pages
  const [pagesMap, setPagesMap] = useState({});
  const studentsPerPage = isSmallScreen ? 5 : 10;
  
  // Derived state
  const availablePrograms = ['All', ...new Set(students.map(student => student.program))].sort();
  const availableSemesters = ['All', 'First', 'Second', 'Summer'];
  const availableYears = ['All', ...new Set(students.map(student => student.schoolYear))].sort().reverse();
  const availableCompanies = ['All', ...new Set(students.map(student => student.partnerCompany))].filter(Boolean).sort();

  // Helper function to normalize semester values
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

  useEffect(() => {
    let userUnsubscribe;
    let studentUnsubscribe;
    let finalSurveyUnsubscribe;
    let midtermSurveyUnsubscribe;

    // First get the user's current college and section
    if (currentUser?.uid) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      userUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLoading(true);
          
          // Determine if we need to filter by section based on user role
          let studentQuery;
          
          if (userData.role === 'instructor' || userData.role === 'coordinator') {
            // Instructors and coordinators should only see their section
            studentQuery = query(
              collection(db, 'studentData'),
              where('college', '==', userData.college),
              where('section', '==', userData.section || 'default') // Add section filter
            );
          } else {
            // Admins or other roles can see all students in their college
            studentQuery = query(
              collection(db, 'studentData'),
              where('college', '==', userData.college)
            );
          }
          
          // Get basic student data first
          studentUnsubscribe = onSnapshot(studentQuery, async (studentSnapshot) => {
            // Process student data
            const initialStudentsList = studentSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Normalize semester data
                semester: normalizeSemester(doc.data().semester),
                // Initialize with basic values
                evaluationScore: 0,
                surveyScores: {
                  final: null,
                  midterm: null,
                  all: 0,
                  combined: 0 // Make sure 'combined' is explicitly initialized
                },
                hasFinalData: false,
                hasMidtermData: false
            }));
            
            // Update student state immediately with basic data
            setStudents(initialStudentsList);
            
            // Set up listeners for survey data
            // Clean up previous listeners if they exist
            if (finalSurveyUnsubscribe) finalSurveyUnsubscribe();
            if (midtermSurveyUnsubscribe) midtermSurveyUnsubscribe();
            
            // Create a listener for final survey collection
            const finalSurveysRef = collection(db, 'studentSurveys_final');
            finalSurveyUnsubscribe = onSnapshot(finalSurveysRef, (finalSnapshot) => {
              // Create a listener for midterm survey collection
              const midtermSurveysRef = collection(db, 'studentSurveys_midterm');
              midtermSurveyUnsubscribe = onSnapshot(midtermSurveysRef, (midtermSnapshot) => {
                // Map to store all student data with scores from both surveys
                const studentMap = new Map();
                
                // Process final surveys
                finalSnapshot.docs.forEach(doc => {
                  const survey = doc.data();
                  
                  // Find a match using our improved helper function that doesn't rely on IDs
                  const { student: studentToUse, matchType } = findStudentMatch(survey, initialStudentsList);
                  
                  if (!studentToUse) {
                    return;
                  }
                  
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
                  
                  // Initialize or update student data in the map using student's actual ID
                  const studentMapKey = studentToUse.id;
                  
                  if (!studentMap.has(studentMapKey)) {
                    studentMap.set(studentMapKey, {
                      student: studentToUse,
                      finalSurveys: [],
                      midtermSurveys: [],
                      finalAvgScore: 0,
                      midtermAvgScore: 0,
                      combinedScore: 0
                    });
                  }
                  
                  const studentData = studentMap.get(studentMapKey);
                  studentData.finalSurveys.push({
                    score: score,
                    survey: survey
                  });
                });
                
                // Process midterm surveys
                midtermSnapshot.docs.forEach(doc => {
                  const survey = doc.data();
                  
                  // Find a match using our improved helper function that doesn't rely on IDs
                  const { student: studentToUse, matchType } = findStudentMatch(survey, initialStudentsList);
                  
                  if (!studentToUse) {
                    return;
                  }
                  
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
                  
                  // Initialize or update student data in the map using student's actual ID
                  const studentMapKey = studentToUse.id;
                  
                  if (!studentMap.has(studentMapKey)) {
                    studentMap.set(studentMapKey, {
                      student: studentToUse,
                      finalSurveys: [],
                      midtermSurveys: [],
                      finalAvgScore: 0,
                      midtermAvgScore: 0,
                      combinedScore: 0
                    });
                  }
                  
                  const studentData = studentMap.get(studentMapKey);
                  studentData.midtermSurveys.push({
                    score: score,
                    survey: survey
                  });
                });
                
                // Calculate average scores and apply 50-50 weighting (same as AdminRankings)
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
                  else {
                    // If no survey data, use the evaluation score
                    data.combinedScore = calculateEvaluationScore(data.student.evaluation || '');
                  }
                });
                
                // Update student data with calculated scores
                const updatedStudents = initialStudentsList.map(student => {
                  const studentData = studentMap.get(student.id);
                  
                  if (!studentData) {
                    // If no survey data, calculate score from evaluation
                    const evalScore = calculateEvaluationScore(student.evaluation || '');
                    
                    // Round to one decimal place
                    const roundedScore = Math.round(evalScore * 10) / 10;
                    
                    return {
                      ...student,
                      evaluationScore: roundedScore,
                      surveyScores: {
                        final: null,
                        midterm: null,
                        all: roundedScore,
                        combined: roundedScore
                      },
                      hasFinalData: false,
                      hasMidtermData: false
                    };
                  }
                  
                  // Set final properties for this student
                  const hasFinalData = studentData.finalSurveys.length > 0;
                  const hasMidtermData = studentData.midtermSurveys.length > 0;
                  
                  // Safely set scores, ensuring they're valid numbers
                  const finalScore = hasFinalData ? safeScore(studentData.finalAvgScore) : null;
                  const midtermScore = hasMidtermData ? safeScore(studentData.midtermAvgScore) : null;
                  const combinedScore = safeScore(studentData.combinedScore);
                  
                  return {
                    ...student,
                    evaluationScore: combinedScore,
                    surveyScores: {
                      final: finalScore,
                      midterm: midtermScore,
                      all: combinedScore,
                      combined: combinedScore
                    },
                    hasFinalData: hasFinalData,
                    hasMidtermData: hasMidtermData
                  };
                });
                
                setStudents(updatedStudents);
                setLoading(false);
              });
            });
          }, (error) => {
            setError(error.message);
            setLoading(false);
          });
        } else {
          setError('User data not found');
          setLoading(false);
        }
      }, (error) => {
        setError(error.message);
        setLoading(false);
      });
    } else {
      setError('Unauthorized access');
      setLoading(false);
    }

    // Clean up all listeners
    return () => {
      userUnsubscribe?.();
      studentUnsubscribe?.();
      finalSurveyUnsubscribe?.();
      midtermSurveyUnsubscribe?.();
    };
  }, [currentUser]);

  // Reset page when filters change
  useEffect(() => {
    setPagesMap({});
  }, [selectedProgram, selectedSemester, selectedYear, selectedSurveyType, selectedCompany]);

  // Calculate the ranking of students and sort them by score
  const rankStudents = useMemo(() => {
    if (!students.length) return [];
    
    // Filter students based on the current filters
    let filteredStudents = [...students].filter(student => {
      // Program filter
      const programMatch = selectedProgram === 'All' || student.program === selectedProgram;
    
      // Semester filter
      const normalizedStudentSemester = normalizeSemester(student.semester);
      const normalizedSelectedSemester = normalizeSemester(selectedSemester);
      const semesterMatch = 
        selectedSemester === 'All' || 
        normalizedStudentSemester === normalizedSelectedSemester ||
        (student.semester && student.semester === selectedSemester) ||
        (student.semester && student.semester.toLowerCase().includes(selectedSemester.toLowerCase()));
    
      // Year filter
      const yearMatch = selectedYear === 'All' || student.schoolYear === selectedYear;
    
      // Survey type filter - improved handling for null values
      const surveyTypeMatch = selectedSurveyType === 'all' || 
        (student.surveyScores && 
         ((selectedSurveyType === 'final' && student.hasFinalData) || 
          (selectedSurveyType === 'midterm' && student.hasMidtermData)));
    
      // Company filter
      const companyMatch = selectedCompany === 'All' || student.partnerCompany === selectedCompany;
      
      // Return if student matches all filters
      return programMatch && yearMatch && semesterMatch && surveyTypeMatch && companyMatch;
    });

    // Sort students by the appropriate score based on the selected survey type
    filteredStudents.sort((a, b) => {
      // Get score A (handle null values appropriately)
      let scoreA = 0;
      if (selectedSurveyType !== 'all' && a.surveyScores?.[selectedSurveyType] !== null && a.surveyScores?.[selectedSurveyType] !== undefined) {
        scoreA = a.surveyScores[selectedSurveyType];
      } else {
        scoreA = a.evaluationScore || 0;
      }
      
      // Get score B (handle null values appropriately)
      let scoreB = 0;
      if (selectedSurveyType !== 'all' && b.surveyScores?.[selectedSurveyType] !== null && b.surveyScores?.[selectedSurveyType] !== undefined) {
        scoreB = b.surveyScores[selectedSurveyType];
      } else {
        scoreB = b.evaluationScore || 0;
      }
      
      // Sort descending (highest score first)
      return scoreB - scoreA;
    });

    // Add rank property
    return filteredStudents.map((student, index) => ({
      ...student,
      rank: index + 1
    }));
  }, [students, selectedProgram, selectedSemester, selectedYear, selectedSurveyType, selectedCompany]);

  // Group students by program
  const studentsByProgram = {};
  if (selectedProgram === 'All') {
    rankStudents.forEach(student => {
      if (!studentsByProgram[student.program]) {
        studentsByProgram[student.program] = [];
      }
      studentsByProgram[student.program].push(student);
    });
  } else {
    studentsByProgram[selectedProgram] = rankStudents;
  }

  // Update handlePageChange to use unique program identifiers
  const handlePageChange = (programKey, newPage) => {
    setPagesMap(prev => ({
      ...prev,
      [programKey]: newPage
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset program selection to "All" when switching to department tab
    if (newValue === 1) {
      setSelectedProgram('All');
    }
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
          Loading Student Rankings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the student performance data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main', textAlign: 'center' }}>
        <Typography variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ p: 2 }}>
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>Program</InputLabel>
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                label="Program"
                disabled={tabValue === 1} // Disable when on department tab
              >
                {availablePrograms.map((program) => (
                  <MenuItem key={program} value={program}>
                    {program}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                label="Semester"
              >
                {availableSemesters.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>School Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="School Year"
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>Survey Type</InputLabel>
              <Select
                value={selectedSurveyType}
                onChange={(e) => setSelectedSurveyType(e.target.value)}
                label="Survey Type"
                startAdornment={<FilterAlt sx={{ color: 'rgba(128, 0, 0, 0.54)', mr: 1, ml: -0.5 }} fontSize="small" />}
              >
                <MenuItem value="all">All Surveys</MenuItem>
                <MenuItem value="midterm">Midterm Evaluation</MenuItem>
                <MenuItem value="final">Final Evaluation</MenuItem>
              </Select>
            </StyledFormControl>
          </Grid>
          
          {availableCompanies.length > 2 && (
            <Grid item xs={12} md={3}>
              <StyledFormControl fullWidth variant="outlined" size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Company"
                >
                  {availableCompanies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Grid>
          )}
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: 'text.secondary' },
              '& .Mui-selected': { color: `${maroon} !important` },
              '& .MuiTabs-indicator': { backgroundColor: maroon }
            }}
          >
            <Tab label="Student Rankings" />
            <Tab label="College Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1, color: maroon }} /> 
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  color: maroon,
                }}
              >
                Student Rankings by Program
              </Typography>
            </Box>
            
            {selectedSurveyType !== 'all' && (
              <Chip 
                label={`Showing ${selectedSurveyType === 'midterm' ? 'Midterm' : 'Final'} Evaluation Scores`}
                sx={{ 
                  bgcolor: 'rgba(128, 0, 0, 0.08)',
                  color: '#800000',
                  fontWeight: 'medium',
                  border: '1px solid rgba(128, 0, 0, 0.2)'
                }}
              />
            )}
          </Box>
          
          <Divider sx={{ mb: 3, borderColor: 'rgba(128, 0, 0, 0.1)' }} />
          
          {Object.keys(studentsByProgram).length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="h6" color="text.secondary">
                No students match the selected filters
              </Typography>
            </Box>
          ) : (
            Object.entries(studentsByProgram).map(([program, programStudents], programIndex) => {
              // Create a unique key for this specific program section by combining program name and index
              const programKey = `${program}-${programIndex}`;
              
              // Get current page for this specific program, default to 1
              const currentPage = pagesMap[programKey] || 1;
              
              // Paginate the students for this program
              const totalPages = Math.ceil(programStudents.length / studentsPerPage);
              const displayedStudents = programStudents.slice(
                (currentPage - 1) * studentsPerPage, 
                currentPage * studentsPerPage
              );
              
              return (
                <StyledCard key={programKey} sx={{ mb: 3 }}>
                  <CardContent sx={{ p: isSmallScreen ? 1 : 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <School sx={{ mr: 1, color: maroon }} />
                      <Typography variant="h6" fontWeight="medium" sx={{ color: maroon }}>
                        {program}
                      </Typography>
                      <Chip 
                        label={`${programStudents.length} student${programStudents.length !== 1 ? 's' : ''}`} 
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
                            <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1 }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '30%', py: 1 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '50%', py: 1 }}>Company</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1, textAlign: 'center' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedStudents.map((student, index) => {
                            // Get appropriate score based on survey type
                            let displayScore = null;
                            let scoreColor = 'transparent';
                            
                            // Get score based on the selected survey type and available data
                            if (selectedSurveyType === 'all') {
                              displayScore = safeScore(student.surveyScores?.all || student.evaluationScore);
                            } else if (selectedSurveyType === 'midterm' && student.hasMidtermData) {
                              displayScore = safeScore(student.surveyScores?.midterm);
                            } else if (selectedSurveyType === 'final' && student.hasFinalData) {
                              displayScore = safeScore(student.surveyScores?.final);
                            } else {
                              // Fallback to evaluation score if no survey data available for the selected type
                              displayScore = safeScore(student.evaluationScore);
                            }
                            
                            // Ensure we always have a score value to display
                            if (displayScore === null || displayScore === undefined) {
                              displayScore = safeScore(student.evaluationScore || 0);
                            }
                            
                            // Determine color based on score
                            if (displayScore !== null) {
                              if (displayScore >= 8) {
                                scoreColor = 'gold';
                              } else if (displayScore >= 6) {
                                scoreColor = '#ADD8E6';
                              }
                            }
                            
                            return (
                              <StyledTableRow key={student.id} rank={student.rank}>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <RankingBadge rank={student.rank}>
                                    {student.rank}
                                  </RankingBadge>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                                <TableCell sx={{ py: 1 }}>{student.partnerCompany}</TableCell>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <Box
                                    sx={{
                                      display: 'inline-flex', 
                                      alignItems: 'center',
                                      backgroundColor: scoreColor,
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                    }}
                                  >
                                    <Typography>
                                      {displayScore !== null ? displayScore.toFixed(1) : "0.0"}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </StyledTableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination 
                          count={totalPages} 
                          page={currentPage} 
                          onChange={(event, newPage) => handlePageChange(programKey, newPage)}
                          size={isSmallScreen ? 'small' : 'medium'}
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: maroon,
                            },
                            '& .Mui-selected': {
                              backgroundColor: 'rgba(128, 0, 0, 0.1) !important',
                            },
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </StyledCard>
              );
            })
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CollegeRanking
            collegeFilter={currentUser?.profile?.college || 'All'}
            semesterFilter={selectedSemester}
            yearFilter={selectedYear}
            surveyTypeFilter={selectedSurveyType} // Pass survey type filter
          />
        </TabPanel>
      </Box>
    </Container>
  );
}

export default StudentRankings; 