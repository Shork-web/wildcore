import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton,
  Card,
  Button,
  CircularProgress,
  Stack,
  Pagination
} from '@mui/material';
import { 
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList
} from '@mui/icons-material';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config';
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

function OJTAdviser() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSurveyType, setSelectedSurveyType] = useState('midterm');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvaluation, setExpandedEvaluation] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 7;

  useEffect(() => {
    // Reset page when survey type changes
    setPage(1);
    setLoading(true);
    setError(null);
    
    // List of all possible collection names to try
    const possibleCollections = [
      selectedSurveyType === 'midterm' ? 'OJTadvisers_midterms' : 'OJTadvisers_finals',
      selectedSurveyType === 'midterm' ? 'OJTadvisers_midterm' : 'OJTadvisers_final',
      'OJTadvisers'
    ];
    
    console.log('Trying collections:', possibleCollections);
    
    // Try collections sequentially
    let currentIndex = 0;
    let unsubscribe = null;
    
    const tryNextCollection = () => {
      // If we've tried all collections without success
      if (currentIndex >= possibleCollections.length) {
        console.log('No data found in any collection');
        setEvaluationsData([]);
        setCompanies([]);
        setLoading(false);
        return null;
      }
      
      const collectionName = possibleCollections[currentIndex];
      console.log(`Trying collection ${currentIndex + 1}/${possibleCollections.length}: ${collectionName}`);
      
      const q = query(collection(db, collectionName));
      
      return onSnapshot(
        q,
        (querySnapshot) => {
          console.log(`Collection ${collectionName} data count:`, querySnapshot.docs.length);
          
          // Log raw data for debugging
          if (querySnapshot.docs.length > 0) {
            console.log(`Using collection: ${collectionName}`);
            console.log('Sample document:', querySnapshot.docs[0].id, querySnapshot.docs[0].data());
          }
          
          const data = querySnapshot.docs
            // Filter based on document type being "assessment" and matching evaluation period
            .filter(doc => {
              try {
                const docData = doc.data();
                
                // Check if the document is of type "assessment"
                const isAssessment = docData.type === "assessment";
                
                // Match the evaluation period with the selected survey type
                const matchesSelectedPeriod = selectedSurveyType === 'midterm' 
                  ? docData.evaluationPeriod === 'MIDTERMS'
                  : docData.evaluationPeriod === 'FINALS';
                
                return isAssessment && matchesSelectedPeriod;
                
              } catch (err) {
                console.error("Error filtering document:", err);
                return false;
              }
            })
            .map(doc => {
              try {
                const docData = doc.data();
                
                // Extract school year from submittedAt if not available directly
                let schoolYear = docData.schoolYear;
                let semester = docData.semester;
                
                if (docData.submittedAt) {
                  // Try to extract year and semester from submittedAt
                  try {
                    const submittedDate = docData.submittedAt.toDate ? 
                      docData.submittedAt.toDate() : 
                      new Date(docData.submittedAt);
                    
                    // Format as academic year (e.g., "2024-2025")
                    const year = submittedDate.getFullYear();
                    if (!schoolYear) {
                      schoolYear = `${year}-${year+1}`;
                    }
                    
                    // Determine semester based on month if not available
                    if (!semester) {
                      const month = submittedDate.getMonth();
                      // June-October: 1st semester, November-March: 2nd semester, April-May: Summer
                      if (month >= 5 && month <= 9) {
                        semester = '1st';
                      } else if (month >= 10 || month <= 2) {
                        semester = '2nd';
                      } else {
                        semester = 'Summer';
                      }
                    }
                  } catch (err) {
                    console.error("Error extracting data from submittedAt:", err);
                    if (!schoolYear) schoolYear = "Unknown Year";
                    if (!semester) semester = "Unknown";
                  }
                }
                
                return {
                  id: doc.id,
                  ...docData,
                  companyName: docData.companyName || 'Unknown Company',
                  meetingDate: docData.meetingDate || 'No Date',
                  students: docData.studentNames || docData.students || 'No Students Listed',
                  overallPerformance: docData.overallPerformance || 0,
                  tasks: docData.tasksAssigned || 'No Tasks Listed',
                  training: docData.trainingProvided || 'No Training Listed',
                  technicalSkills: docData.technicalSkills || 'No Skills Listed',
                  recommendations: docData.recommendations || 'No Recommendations',
                  industryMentor: docData.industryMentor || 'No Mentor Listed',
                  program: docData.program || 'No Program Listed',
                  recommended: docData.recommendToStudents === 'yes' ? true : false,
                  totalScore: docData.overallPerformance || 0, // Use overallPerformance as totalScore
                  maxPossibleScore: 10, // Assuming a max score of 10 based on your schema
                  surveyType: docData.evaluationPeriod === 'MIDTERMS' ? 'midterm' : 'final',
                  schoolYear: schoolYear || "Unknown Year",
                  semester: semester || "Unknown"
                };
              } catch (err) {
                console.error("Error mapping document:", err);
                return null;
              }
            })
            .filter(Boolean); // Remove any null entries from failed mapping

          console.log('Filtered data count:', data.length);
          
          if (data.length > 0) {
            // Found data in this collection!
            setEvaluationsData(data);
            setCompanies([...new Set(data.map(item => item.companyName).filter(Boolean))]);
            setLoading(false);
          } else {
            // Try the next collection
            currentIndex++;
            
            if (unsubscribe) {
              unsubscribe();
            }
            
            unsubscribe = tryNextCollection();
          }
        },
        (error) => {
          console.error(`Error fetching from ${collectionName}:`, error);
          
          // Try the next collection even if there's an error
          currentIndex++;
          
          if (unsubscribe) {
            unsubscribe();
          }
          
          if (currentIndex >= possibleCollections.length) {
            setError(`Failed to fetch data: ${error.message}`);
            setLoading(false);
          } else {
            unsubscribe = tryNextCollection();
          }
        }
      );
    };
    
    // Start trying collections
    unsubscribe = tryNextCollection();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedSurveyType]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const getFilteredData = () => {
    const filtered = evaluationsData.filter(evaluation => {
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      return true;
    });

    return filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  };

  const getTotalFilteredCount = () => {
    return evaluationsData.filter(evaluation => {
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      return true;
    }).length;
  };

  const handleRowClick = (evaluationId) => {
    setExpandedEvaluation(expandedEvaluation === evaluationId ? null : evaluationId);
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
          Loading OJT Partner Evaluations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Please wait while we process the OJT partner evaluation data...
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

  const filteredData = getFilteredData();
  const totalFilteredCount = getTotalFilteredCount();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#800000' }}>
          OJT Partner Evaluations ({selectedSurveyType === 'midterm' ? 'Midterm' : 'Final'})
        </Typography>
        <Button
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "contained" : "outlined"}
          color="primary"
        >
          Filters
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Evaluation Type</InputLabel>
                <Select
                  value={selectedSurveyType}
                  onChange={(e) => setSelectedSurveyType(e.target.value)}
                  label="Evaluation Type"
                >
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Company"
                >
                  <MenuItem value="">All</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>
      </Collapse>

      <TableContainer 
        component={Paper}
        sx={{ 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxHeight: '75vh',
          minHeight: '500px',
          overflow: 'auto',
          width: '100%',
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '56px' }} />
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Meeting Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((evaluation) => (
              <React.Fragment key={evaluation.id}>
                <TableRow 
                  sx={{ '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.04)' }, cursor: 'pointer' }}
                  onClick={() => handleRowClick(evaluation.id)}
                >
                  <TableCell>
                    <IconButton size="small">
                      {expandedEvaluation === evaluation.id ? 
                        <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{evaluation.companyName}</TableCell>
                  <TableCell>{evaluation.meetingDate}</TableCell>
                  <TableCell>{evaluation.program}</TableCell>
                  <TableCell>{evaluation.totalScore}/{evaluation.maxPossibleScore}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedEvaluation === evaluation.id} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Students</Typography>
                            <Typography>{evaluation.students}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Tasks Assigned</Typography>
                            <Typography>{evaluation.tasks}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Training Provided</Typography>
                            <Typography>{evaluation.training}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Technical Skills</Typography>
                            <Typography>{evaluation.technicalSkills}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Recommendations</Typography>
                            <Typography>{evaluation.recommendations}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">Industry Mentor</Typography>
                            <Typography>{evaluation.industryMentor}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary">
                              Recommendation Status
                            </Typography>
                            <Typography color={evaluation.recommended ? 'success.main' : 'error.main'}>
                              {evaluation.recommended ? 'Recommended' : 'Not Recommended'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
      }}>
        <Stack spacing={2} alignItems="center" direction="row">
          <Typography variant="body2" color="text.secondary">
            {`${totalFilteredCount} total entries`}
          </Typography>
          <Pagination
            count={Math.ceil(totalFilteredCount / rowsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#800000',
                '&.Mui-selected': {
                  backgroundColor: '#800000',
                  color: 'white',
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
          <Typography variant="body2" color="text.secondary">
            {`Page ${page} of ${Math.ceil(totalFilteredCount / rowsPerPage)}`}
          </Typography>
        </Stack>
      </Box>

      {filteredData.length === 0 && (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          No evaluations found for the selected filters.
        </Typography>
      )}
    </Container>
  );
}

export default OJTAdviser; 