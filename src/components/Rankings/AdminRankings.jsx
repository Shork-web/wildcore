import React, { useState, useEffect, useContext } from 'react';
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
  Chip,
  Grid,
  Pagination,
  useTheme,
  useMediaQuery,
  Container,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/system';
import { School, EmojiEvents, Star, Business } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, getDocs, collectionGroup } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { collegePrograms } from '../../utils/collegePrograms';

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

function AdminRankings() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { currentUser, userRole } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [tabValue, setTabValue] = useState(0);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const studentsPerPage = isSmallScreen ? 5 : 10;
  
  // Available colleges from collegePrograms
  const availableColleges = ['All', ...Object.keys(collegePrograms)];
  
  // Derived state
  const availablePrograms = getAvailablePrograms();
  const availableSemesters = getAvailableSemesters();
  const availableYears = getAvailableYears();

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

  function getAvailablePrograms() {
    if (selectedCollege === 'All') {
      return ['All', ...new Set(students.map(student => student.program || ''))].filter(Boolean).sort();
    } else {
      return ['All', ...(collegePrograms[selectedCollege] || [])];
    }
  }
  
  function getAvailableSemesters() {
    // Extract all semesters from the student data, then add standard options
    const dataOptions = [...new Set(students.map(student => student.semester || ''))].filter(Boolean);
    const standardOptions = ['First', 'Second', 'Summer'];
    
    // Combine, deduplicate and sort options
    return ['All', ...new Set([...dataOptions, ...standardOptions])].sort();
  }
  
  function getAvailableYears() {
    return ['All', ...new Set(students.map(student => student.schoolYear || ''))].filter(Boolean).sort().reverse();
  }

  useEffect(() => {
    async function fetchStudents() {
      if (!currentUser || userRole !== 'admin') {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch from studentSurveys first, as that has public read access
        console.log("Fetching from studentSurveys collection");
        const surveysQuery = query(collection(db, 'studentSurveys'));
        const surveysSnapshot = await getDocs(surveysQuery);
        
        // Try to fetch company data from the nested collection structure
        console.log("Fetching from companies/tests/students collection");
        const companyStudentsQuery = query(collectionGroup(db, 'students'));
        let companyStudentsMap = {};
        
        // Also fetch the companies collection directly to get company names
        let companiesMap = {};
        try {
          console.log("Fetching companies collection");
          const companiesQuery = query(collection(db, 'companies'));
          const companiesSnapshot = await getDocs(companiesQuery);
          console.log(`Found ${companiesSnapshot.docs.length} companies`);
          
          // Create a map of company IDs to company names
          companiesMap = companiesSnapshot.docs.reduce((map, doc) => {
            const data = doc.data();
            // Use the company name from the data, or the ID as fallback
            map[doc.id] = {
              id: doc.id,
              name: data.name || data.companyName || doc.id,
              ...data
            };
            return map;
          }, {});
          
          console.log("Created map of companies:", Object.keys(companiesMap).length);
        } catch (companiesError) {
          console.error("Error fetching companies collection:", companiesError);
          // Continue even if this fails
        }
        
        try {
          const companyStudentsSnapshot = await getDocs(companyStudentsQuery);
          console.log(`Found ${companyStudentsSnapshot.docs.length} students in companies collection`);
          
          // Create a map of student IDs to company info
          companyStudentsMap = companyStudentsSnapshot.docs.reduce((map, doc) => {
            // Extract the path components to get company info
            const pathSegments = doc.ref.path.split('/');
            const companyId = pathSegments[1]; // The ID of the company
            
            // Try to extract company name from the data if available
            const data = doc.data();
            
            // Look up company name from companiesMap if available, otherwise use what we can find
            const companyInfo = companiesMap[companyId] || {};
            const companyName = companyInfo.name || data.companyName || companyId;
            
            map[doc.id] = {
              companyId,
              companyName,
              ...data
            };
            return map;
          }, {});
          
          console.log("Created map of company students:", Object.keys(companyStudentsMap).length);
        } catch (companyError) {
          console.error("Error fetching from companies collection:", companyError);
          // Continue with other sources even if this fails
        }
        
        if (!surveysSnapshot.empty) {
          console.log(`Found ${surveysSnapshot.docs.length} student surveys`);
          
          // Process student surveys data
          const surveyData = surveysSnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Calculate score from survey data
            let score = 0;
            
            // Use the totalScore if available (normalized to a 10-point scale)
            if (data.totalScore !== undefined && data.maxPossibleScore) {
              score = (data.totalScore / data.maxPossibleScore) * 10;
            } 
            // Otherwise try to calculate from workAttitude and workPerformance
            else if (data.workAttitude && data.workPerformance) {
              const attitudeScore = data.workAttitude.totalScore || 0;
              const attitudeMax = data.workAttitude.maxPossibleScore || 40;
              
              const performanceScore = data.workPerformance.totalScore || 0;
              const performanceMax = data.workPerformance.maxPossibleScore || 60;
              
              // Calculate combined score (normalized to 10)
              const totalMax = attitudeMax + performanceMax;
              const totalScore = attitudeScore + performanceScore;
              
              score = totalMax > 0 ? (totalScore / totalMax) * 10 : 0;
            }
            
            // Check if we have company data for this student
            const companyData = companyStudentsMap[doc.id] || {};
            
            // Look for any company ID reference in the data
            const companyIdFromData = data.companyId || data.company_id || '';
            
            // If we have a company ID but no company data, try to look it up in the companies map
            let resolvedCompanyName = companyData.companyName;
            if (!resolvedCompanyName && companyIdFromData && companiesMap[companyIdFromData]) {
              resolvedCompanyName = companiesMap[companyIdFromData].name;
            }
            
            // Handle different field names from different collections
            return {
              id: doc.id,
              ...data,
              // Normalize field names to ensure consistency
              name: data.studentName || data.name || 'Unknown Student',
              partnerCompany: resolvedCompanyName || 
                              data.partnerCompany || 
                              data.companyName || 
                              data.company || 
                              (companyIdFromData ? `Company ${companyIdFromData}` : 'Unknown Company'),
              companyId: companyData.companyId || companyIdFromData || '',
              college: data.college || 'Unknown College',
              program: data.program || 'Unknown Program',
              // Normalize semester data
              semester: normalizeSemester(data.semester),
              schoolYear: data.schoolYear || '',
              evaluationScore: Math.round(score * 10) / 10,
              source: 'surveys',
              hasCompanyData: !!(companyData.companyId || (companyIdFromData && companiesMap[companyIdFromData]))
            };
          });
          
          // Set the data from surveys
          setStudents(surveyData);
          setLoading(false);
        } else {
          console.log("No surveys found, trying studentData collection");
          
          // Fallback to studentData if no surveys found
          const q = query(collection(db, 'studentData'));
          const snapshot = await getDocs(q);
          
          const studentsList = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Check if we have company data for this student
            const companyData = companyStudentsMap[doc.id] || {};
            
            // Look for any company ID reference in the data
            const companyIdFromData = data.companyId || data.company_id || '';
            
            // If we have a company ID but no company data, try to look it up in the companies map
            let resolvedCompanyName = companyData.companyName;
            if (!resolvedCompanyName && companyIdFromData && companiesMap[companyIdFromData]) {
              resolvedCompanyName = companiesMap[companyIdFromData].name;
            }
            
            return {
              id: doc.id,
              ...data,
              // Normalize field names to ensure consistency
              name: data.name || data.studentName || 'Unknown Student',
              partnerCompany: resolvedCompanyName || 
                              data.partnerCompany || 
                              data.companyName || 
                              data.company || 
                              (companyIdFromData ? `Company ${companyIdFromData}` : 'Unknown Company'),
              companyId: companyData.companyId || companyIdFromData || '',
              college: data.college || 'Unknown College',
              program: data.program || 'Unknown Program',
              // Normalize semester data
              semester: normalizeSemester(data.semester),
              schoolYear: data.schoolYear || '',
              evaluationScore: calculateEvaluationScore(data.evaluation || ''),
              source: 'studentData',
              hasCompanyData: !!(companyData.companyId || (companyIdFromData && companiesMap[companyIdFromData]))
            };
          });
          
          console.log(`Found ${studentsList.length} student records`);
          setStudents(studentsList);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        
        // Try the fallback approach if first attempt fails
        try {
          console.log("First approach failed, trying fallback to studentData");
          
          // Create a new companiesMap for the fallback
          let fallbackCompaniesMap = {};
          
          // Try to fetch companies data in the fallback approach
          try {
            console.log("Fetching companies collection for fallback");
            const companiesQuery = query(collection(db, 'companies'));
            const companiesSnapshot = await getDocs(companiesQuery);
            
            // Create a map of company IDs to company names
            fallbackCompaniesMap = companiesSnapshot.docs.reduce((map, doc) => {
              const data = doc.data();
              map[doc.id] = {
                id: doc.id,
                name: data.name || data.companyName || doc.id,
                ...data
              };
              return map;
            }, {});
            
            console.log("Created fallback map of companies:", Object.keys(fallbackCompaniesMap).length);
          } catch (companiesError) {
            console.error("Error fetching companies for fallback:", companiesError);
            // Continue even if this fails
          }
          
          const q = query(collection(db, 'studentData'));
          const snapshot = await getDocs(q);
          
          const studentsList = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Look for any company ID reference in the data
            const companyIdFromData = data.companyId || data.company_id || '';
            
            // Try to look up company name from companies map if we have a company ID
            let resolvedCompanyName = null;
            if (companyIdFromData && fallbackCompaniesMap[companyIdFromData]) {
              resolvedCompanyName = fallbackCompaniesMap[companyIdFromData].name;
            }
            
            return {
              id: doc.id,
              ...data,
              // Normalize field names to ensure consistency
              name: data.name || data.studentName || 'Unknown Student',
              partnerCompany: resolvedCompanyName || 
                              data.partnerCompany || 
                              data.companyName || 
                              data.company || 
                              (companyIdFromData ? `Company ${companyIdFromData}` : 'Unknown Company'),
              companyId: companyIdFromData || '',
              college: data.college || 'Unknown College',
              program: data.program || 'Unknown Program',
              // Normalize semester data
              semester: normalizeSemester(data.semester),
              schoolYear: data.schoolYear || '',
              evaluationScore: calculateEvaluationScore(data.evaluation || ''),
              source: 'studentData',
              hasCompanyData: !!(companyIdFromData && fallbackCompaniesMap[companyIdFromData])
            };
          });
          
          console.log(`Found ${studentsList.length} student records from fallback`);
          setStudents(studentsList);
          setLoading(false);
        } catch (fallbackError) {
          console.error("Error with fallback approach:", fallbackError);
          setError(`Error loading data: ${error.message}. Fallback also failed.`);
          setLoading(false);
        }
      }
    }

    fetchStudents();
  }, [currentUser, userRole]);

  useEffect(() => {
    // After students are loaded, log all semester values for debugging
    if (students.length > 0 && !loading) {
      const allSemesters = [...new Set(students.map(s => s.semester))].filter(Boolean);
      console.log("All available semester values:", allSemesters);
    }
  }, [students, loading]);

  // Reset page and program when college changes
  useEffect(() => {
    setPage(1);
    setSelectedProgram('All');
  }, [selectedCollege]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedProgram, selectedSemester, selectedYear]);

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

  // Filter students based on selected filters
  const filteredStudents = students.filter(student => {
    const collegeMatches = selectedCollege === 'All' || student.college === selectedCollege;
    const programMatches = selectedProgram === 'All' || student.program === selectedProgram;
    
    // Get normalized versions for comparison
    const normalizedStudentSemester = normalizeSemester(student.semester);
    const normalizedSelectedSemester = normalizeSemester(selectedSemester);
    
    // Multiple ways to match semesters
    const semesterMatches = 
      selectedSemester === 'All' || 
      normalizedStudentSemester === normalizedSelectedSemester ||
      (student.semester && student.semester === selectedSemester) ||
      (student.semester && student.semester.toLowerCase().includes(selectedSemester.toLowerCase()));
    
    const yearMatches = selectedYear === 'All' || student.schoolYear === selectedYear;
    
    if (selectedSemester !== 'All' && !semesterMatches && student.semester) {
      console.log(`Non-matching semester: Student "${student.semester}" vs Selected "${selectedSemester}"`);
    }
    
    return collegeMatches && programMatches && semesterMatches && yearMatches;
  });

  // Sort students by evaluation score
  const rankedStudents = [...filteredStudents]
    .sort((a, b) => b.evaluationScore - a.evaluationScore);

  // Group students by college
  const studentsByCollege = {};
  rankedStudents.forEach(student => {
    if (!student.college) return;
    if (!studentsByCollege[student.college]) {
      studentsByCollege[student.college] = [];
    }
    studentsByCollege[student.college].push(student);
  });

  // Group students by program
  const studentsByProgram = {};
  rankedStudents.forEach(student => {
    if (!student.program) return;
    if (!studentsByProgram[student.program]) {
      studentsByProgram[student.program] = [];
    }
    studentsByProgram[student.program].push(student);
  });

  // Get top students across all colleges and programs
  const topStudents = [...rankedStudents].slice(0, 20);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Loading university-wide rankings...
        </Typography>
        <LinearProgress sx={{ mt: 1, backgroundColor: 'rgba(128, 0, 0, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: maroon } }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, color: 'error.main' }}>
        <Typography variant="body1">
          Error loading rankings: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ p: 2 }}>
      <Box>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <EmojiEvents sx={{ mr: 1, color: maroon }} /> 
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold',
              color: maroon,
            }}
          >
            University-Wide Student Rankings
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
          Showing all students for accurate comparison. Use filters above to narrow results by college, program, semester, or school year.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>College</InputLabel>
              <Select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                label="College"
              >
                {availableColleges.map((college) => (
                  <MenuItem key={college} value={college}>
                    {college === 'All' ? 'All Colleges' : college}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StyledFormControl fullWidth variant="outlined" size="small">
              <InputLabel>Program</InputLabel>
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                label="Program"
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
            <Tab label="Top Students" />
            {selectedCollege === 'All' && <Tab label="By College" />}
            <Tab label="By Program" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2, color: maroon, fontWeight: 'medium' }}>
            Top Performing Students
          </Typography>
          
          {topStudents.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="h6" color="text.secondary">
                No students match the selected filters
              </Typography>
            </Box>
          ) : (
            <StyledCard>
              <CardContent sx={{ p: isSmallScreen ? 1 : 2 }}>
                <TableContainer sx={{ borderRadius: 0, boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(128, 0, 0, 0.03)' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '8%', py: 1 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '25%', py: 1 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%', py: 1 }}>Program</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '37%', py: 1 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1, textAlign: 'center' }}>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topStudents.map((student, index) => (
                        <StyledTableRow key={student.id} rank={index + 1}>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <RankingBadge rank={index + 1}>
                              {index + 1}
                            </RankingBadge>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                                display: 'block'
                              }}
                              title={student.name || 'Unknown Student'}
                            >
                              {student.name || 'Unknown Student'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>{student.program}</TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {student.hasCompanyData && (
                                <Business 
                                  fontSize="small" 
                                  sx={{ 
                                    mr: 0.5, 
                                    color: maroon,
                                    opacity: 0.7,
                                    fontSize: '0.8rem'
                                  }}
                                />
                              )}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: student.hasCompanyData ? '180px' : '200px',
                                  display: 'block',
                                  color: student.hasCompanyData ? maroon : 'text.secondary',
                                  fontWeight: student.hasCompanyData ? 'medium' : 'normal'
                                }}
                                title={student.partnerCompany || 'Unknown Company'}
                              >
                                {student.partnerCompany || 'Unknown Company'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Box sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center',
                                color: student.evaluationScore >= 8 
                                  ? '#FFD700' 
                                  : student.evaluationScore >= 6 
                                    ? '#1976d2' 
                                    : 'text.secondary'
                              }}>
                                {student.evaluationScore.toFixed(1)}
                                <Star fontSize="small" sx={{ ml: 0.25, fontSize: '1rem' }} />
                              </Box>
                            </Box>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          )}
        </TabPanel>
        
        {selectedCollege === 'All' && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 2, color: maroon, fontWeight: 'medium' }}>
              Rankings by College
            </Typography>
            
            {Object.keys(studentsByCollege).length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="h6" color="text.secondary">
                  No students match the selected filters
                </Typography>
              </Box>
            ) : (
              Object.entries(studentsByCollege).map(([college, collegeStudents]) => {
                // Paginate the students for this college
                const totalPages = Math.ceil(collegeStudents.length / studentsPerPage);
                const displayedStudents = collegeStudents.slice(
                  (page - 1) * studentsPerPage, 
                  page * studentsPerPage
                );
                
                return (
                  <StyledCard key={college} sx={{ mb: 3 }}>
                    <CardContent sx={{ p: isSmallScreen ? 1 : 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Business sx={{ mr: 1, color: maroon }} />
                        <Typography variant="h6" fontWeight="medium" sx={{ color: maroon }}>
                          {college}
                        </Typography>
                        <Chip 
                          label={`${collegeStudents.length} student${collegeStudents.length !== 1 ? 's' : ''}`} 
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
                              <TableCell sx={{ fontWeight: 'bold', width: '25%', py: 1 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', width: '20%', py: 1 }}>Program</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', width: '37%', py: 1 }}>Company</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1, textAlign: 'center' }}>Score</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {displayedStudents.map((student, index) => {
                              const actualRank = (page - 1) * studentsPerPage + index + 1;
                              return (
                                <StyledTableRow key={student.id} rank={actualRank}>
                                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                    <RankingBadge rank={actualRank}>
                                      {actualRank}
                                    </RankingBadge>
                                  </TableCell>
                                  <TableCell sx={{ py: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium" 
                                      sx={{ 
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '200px',
                                        display: 'block'
                                      }}
                                      title={student.name || 'Unknown Student'}
                                    >
                                      {student.name || 'Unknown Student'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: 1 }}>{student.program}</TableCell>
                                  <TableCell sx={{ py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {student.hasCompanyData && (
                                        <Business 
                                          fontSize="small" 
                                          sx={{ 
                                            mr: 0.5, 
                                            color: maroon,
                                            opacity: 0.7,
                                            fontSize: '0.8rem'
                                          }}
                                        />
                                      )}
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          maxWidth: student.hasCompanyData ? '180px' : '200px',
                                          display: 'block',
                                          color: student.hasCompanyData ? maroon : 'text.secondary',
                                          fontWeight: student.hasCompanyData ? 'medium' : 'normal'
                                        }}
                                        title={student.partnerCompany || 'Unknown Company'}
                                      >
                                        {student.partnerCompany || 'Unknown Company'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Box sx={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center',
                                        color: student.evaluationScore >= 8 
                                          ? '#FFD700' 
                                          : student.evaluationScore >= 6 
                                            ? '#1976d2' 
                                            : 'text.secondary'
                                      }}>
                                        {student.evaluationScore.toFixed(1)}
                                        <Star fontSize="small" sx={{ ml: 0.25, fontSize: '1rem' }} />
                                      </Box>
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
                            page={page} 
                            onChange={handlePageChange}
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
        )}
        
        <TabPanel value={tabValue} index={selectedCollege === 'All' ? 2 : 1}>
          <Typography variant="h6" sx={{ mb: 2, color: maroon, fontWeight: 'medium' }}>
            Rankings by Program
          </Typography>
          
          {Object.keys(studentsByProgram).length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="h6" color="text.secondary">
                No students match the selected filters
              </Typography>
            </Box>
          ) : (
            Object.entries(studentsByProgram).map(([program, programStudents]) => {
              // Paginate the students for this program
              const totalPages = Math.ceil(programStudents.length / studentsPerPage);
              const displayedStudents = programStudents.slice(
                (page - 1) * studentsPerPage, 
                page * studentsPerPage
              );
              
              return (
                <StyledCard key={program} sx={{ mb: 3 }}>
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
                            <TableCell sx={{ fontWeight: 'bold', width: '8%', py: 1 }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '25%', py: 1 }}>Name</TableCell>
                            {selectedCollege === 'All' && (
                              <TableCell sx={{ fontWeight: 'bold', width: '20%', py: 1 }}>College</TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold', width: selectedCollege === 'All' ? '37%' : '57%', py: 1 }}>Company</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 1, textAlign: 'center' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedStudents.map((student, index) => {
                            const actualRank = (page - 1) * studentsPerPage + index + 1;
                            return (
                              <StyledTableRow key={student.id} rank={actualRank}>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <RankingBadge rank={actualRank}>
                                    {actualRank}
                                  </RankingBadge>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="medium" 
                                    sx={{ 
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '200px',
                                      display: 'block'
                                    }}
                                    title={student.name || 'Unknown Student'}
                                  >
                                    {student.name || 'Unknown Student'}
                                  </Typography>
                                </TableCell>
                                {selectedCollege === 'All' && (
                                  <TableCell sx={{ py: 1 }}>{student.college}</TableCell>
                                )}
                                <TableCell sx={{ py: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {student.hasCompanyData && (
                                      <Business 
                                        fontSize="small" 
                                        sx={{ 
                                          mr: 0.5, 
                                          color: maroon,
                                          opacity: 0.7,
                                          fontSize: '0.8rem'
                                        }}
                                      />
                                    )}
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: student.hasCompanyData ? '180px' : '200px',
                                        display: 'block',
                                        color: student.hasCompanyData ? maroon : 'text.secondary',
                                        fontWeight: student.hasCompanyData ? 'medium' : 'normal'
                                      }}
                                      title={student.partnerCompany || 'Unknown Company'}
                                    >
                                      {student.partnerCompany || 'Unknown Company'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center',
                                      color: student.evaluationScore >= 8 
                                        ? '#FFD700' 
                                        : student.evaluationScore >= 6 
                                          ? '#1976d2' 
                                          : 'text.secondary'
                                    }}>
                                      {student.evaluationScore.toFixed(1)}
                                      <Star fontSize="small" sx={{ ml: 0.25, fontSize: '1rem' }} />
                                    </Box>
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
                          page={page} 
                          onChange={handlePageChange}
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
      </Box>
    </Container>
  );
}

export default AdminRankings; 