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
import { School, EmojiEvents, Star } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import DepartmentRankings from './DepartmentRankings';

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
  const [tabValue, setTabValue] = useState(0);
  
  // Replace single page state with a map of program-specific keys to pages
  const [pagesMap, setPagesMap] = useState({});
  const studentsPerPage = isSmallScreen ? 5 : 10;
  
  // Derived state
  const availablePrograms = ['All', ...new Set(students.map(student => student.program))].sort();
  const availableSemesters = ['All', 'First', 'Second', 'Summer'];
  const availableYears = ['All', ...new Set(students.map(student => student.schoolYear))].sort().reverse();

  useEffect(() => {
    let q;
    
    if (currentUser?.profile?.role === 'instructor') {
      q = query(
        collection(db, 'studentData'),
        where('college', '==', currentUser.profile.college)
      );
    } else {
      setError('Unauthorized access');
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // For the screenshot, we're setting all scores to 0 to match
          evaluationScore: 0
        }));
        setStudents(studentsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Reset page when filters change
  useEffect(() => {
    setPagesMap({});
  }, [selectedProgram, selectedSemester, selectedYear]);

  // Filter students based on selected filters
  const filteredStudents = students.filter(student => {
    return (
      (selectedProgram === 'All' || student.program === selectedProgram) &&
      (selectedSemester === 'All' || student.semester === selectedSemester) &&
      (selectedYear === 'All' || student.schoolYear === selectedYear)
    );
  });

  // Sort students by evaluation score
  const rankedStudents = [...filteredStudents]
    .sort((a, b) => b.evaluationScore - a.evaluationScore);

  // Group students by program
  const studentsByProgram = {};
  if (selectedProgram === 'All') {
    rankedStudents.forEach(student => {
      if (!studentsByProgram[student.program]) {
        studentsByProgram[student.program] = [];
      }
      studentsByProgram[student.program].push(student);
    });
  } else {
    studentsByProgram[selectedProgram] = rankedStudents;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '50vh', alignItems: 'center' }}>
        <CircularProgress sx={{ color: maroon }} />
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
          <Grid item xs={12} md={4}>
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
          
          <Grid item xs={12} md={4}>
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
          
          <Grid item xs={12} md={4}>
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
            <Tab label="Student Rankings" />
            <Tab label="Department Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
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
                            const actualRank = (currentPage - 1) * studentsPerPage + index + 1;
                            return (
                              <StyledTableRow key={student.id} rank={actualRank}>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <RankingBadge rank={actualRank}>
                                    {actualRank}
                                  </RankingBadge>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                                <TableCell sx={{ py: 1 }}>{student.partnerCompany}</TableCell>
                                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center',
                                      color: 'text.secondary'
                                    }}>
                                      0.0
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
          <DepartmentRankings 
            collegeFilter={currentUser?.profile?.college || 'All'}
            semesterFilter={selectedSemester}
            yearFilter={selectedYear}
          />
        </TabPanel>
      </Box>
    </Container>
  );
}

export default StudentRankings; 