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
  Pagination,
  useTheme,
  useMediaQuery,
  Container,
  Tab,
  Tabs
} from '@mui/material';
import { styled } from '@mui/system';
import { School, EmojiEvents, Star, Business } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, getDocs } from 'firebase/firestore';
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
  
  const { currentUser } = useContext(AuthContext);
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
  const availableSemesters = ['All', 'First', 'Second', 'Summer'];
  const availableYears = ['All', ...new Set(students.map(student => student.schoolYear || ''))].filter(Boolean).sort().reverse();

  function getAvailablePrograms() {
    if (selectedCollege === 'All') {
      return ['All', ...new Set(students.map(student => student.program || ''))].filter(Boolean).sort();
    } else {
      return ['All', ...(collegePrograms[selectedCollege] || [])];
    }
  }

  useEffect(() => {
    async function fetchStudents() {
      if (currentUser?.profile?.role !== 'admin') {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'studentData'));
        const snapshot = await getDocs(q);
        
        const studentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          evaluationScore: calculateEvaluationScore(doc.data().evaluation || '')
        }));
        
        setStudents(studentsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(error.message);
        setLoading(false);
      }
    }

    fetchStudents();
  }, [currentUser]);

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
      'skilled', 'proficient', 'talented', 'impressive', 'dedicated'
    ];
    
    const normalizedText = evaluation.toLowerCase();
    let score = Math.min(evaluation.length / 100, 5); // Max 5 points for length
    
    // Add points for positive keywords
    positiveKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword)) {
        score += 1;
      }
    });
    
    return Math.min(score, 10); // Cap at 10
  };

  // Filter students based on selected filters
  const filteredStudents = students.filter(student => {
    return (
      (selectedCollege === 'All' || student.college === selectedCollege) &&
      (selectedProgram === 'All' || student.program === selectedProgram) &&
      (selectedSemester === 'All' || student.semester === selectedSemester) &&
      (selectedYear === 'All' || student.schoolYear === selectedYear)
    );
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
                          <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                          <TableCell sx={{ py: 1 }}>{student.program}</TableCell>
                          <TableCell sx={{ py: 1 }}>{student.partnerCompany}</TableCell>
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
                                  <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                                  <TableCell sx={{ py: 1 }}>{student.program}</TableCell>
                                  <TableCell sx={{ py: 1 }}>{student.partnerCompany}</TableCell>
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
                                <TableCell sx={{ py: 1 }}>{student.name}</TableCell>
                                {selectedCollege === 'All' && (
                                  <TableCell sx={{ py: 1 }}>{student.college}</TableCell>
                                )}
                                <TableCell sx={{ py: 1 }}>{student.partnerCompany}</TableCell>
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