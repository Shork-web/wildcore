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
  Pagination,
  Divider,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
  CheckCircle,
  Cancel,
  Apartment,
  Search
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
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
                
                // Calculate a score based on the priority level or available metrics
                let priorityScore = 0;
                if (docData.priorityLevel) {
                  switch(docData.priorityLevel) {
                    case 'High Priority': priorityScore = 10; break;
                    case 'Medium Priority': priorityScore = 7; break;
                    case 'Low Priority': priorityScore = 4; break;
                    case 'Not Recommended': priorityScore = 1; break;
                    default: priorityScore = 0;
                  }
                }
                
                // Check if the document has the new checklist data structure
                const hasNewDataStructure = docData.safetyProtocols !== undefined || 
                                           docData.relevantTasks !== undefined ||
                                           docData.priorityLevel !== undefined;
                
                return {
                  id: doc.id,
                  ...docData,
                  companyName: docData.companyName || 'Unknown Company',
                  companyAddress: docData.companyAddress || 'No Address',
                  departmentAssigned: docData.departmentAssigned || 'Not Specified',
                  supervisorInCharge: docData.supervisorInCharge || docData.industryMentor || 'Not Specified',
                  supervisorContact: docData.supervisorContact || 'No Contact Info',
                  supervisorEmail: docData.supervisorEmail || 'No Email',
                  meetingDate: docData.meetingDate || 'No Date',
                  
                  // Handle both data structures
                  priorityLevel: docData.priorityLevel || 'Not Specified',
                  
                  // Safety metrics
                  safetyProtocols: docData.safetyProtocols || false,
                  safetyOrientation: docData.safetyOrientation || false,
                  emergencyPlans: docData.emergencyPlans || false,
                  noSafetyConcerns: docData.noSafetyConcerns || false,
                  safetyComments: docData.safetyComments || 'No comments',
                  
                  // Learning Opportunities
                  relevantTasks: docData.relevantTasks || false,
                  supervisionEvident: docData.supervisionEvident || false,
                  industryExposure: docData.industryExposure || false,
                  knowledgeApplication: docData.knowledgeApplication || false,
                  
                  // Work Environment
                  professionalCulture: docData.professionalCulture || false,
                  openCommunication: docData.openCommunication || false,
                  encouragesInitiative: docData.encouragesInitiative || false,
                  noHarassment: docData.noHarassment || false,
                  
                  // Compliance
                  providedHours: docData.providedHours || false,
                  submittedForms: docData.submittedForms || false,
                  attendedOrientation: docData.attendedOrientation || false,
                  openToCollaboration: docData.openToCollaboration || false,
                  
                  // Interview Responses
                  workingDuration: docData.workingDuration || 'Not provided',
                  typicalTasks: docData.typicalTasks || docData.tasksAssigned || 'No Tasks Listed',
                  technicalSkills: docData.technicalSkills || 'Not evaluated',
                  communication: docData.communication || 'Not evaluated',
                  professionalism: docData.professionalism || 'Not evaluated',
                  adaptability: docData.adaptability || 'Not evaluated',
                  wellPrepared: docData.wellPrepared || 'Not specified',
                  curriculumImprovements: docData.curriculumImprovements || 'No suggestions',
                  futureEngagements: docData.futureEngagements || 'Not specified',
                  hiringProspects: docData.hiringProspects || 'Not specified',
                  programImprovements: docData.programImprovements || docData.recommendations || 'No recommendations',
                  
                  // Legacy fields for backward compatibility
                  students: docData.studentNames || docData.students || 'No Students Listed',
                  overallPerformance: hasNewDataStructure ? priorityScore : (docData.overallPerformance || 0),
                  tasks: docData.typicalTasks || docData.tasksAssigned || 'No Tasks Listed',
                  training: docData.safetyOrientation ? 'Safety orientation provided' : (docData.trainingProvided || 'No Training Information'),
                  recommendations: docData.programImprovements || docData.recommendations || 'No Recommendations',
                  industryMentor: docData.supervisorInCharge || docData.industryMentor || 'No Mentor Listed',
                  program: docData.program || 'No Program Listed',
                  
                  // Status and performance indicators
                  recommended: docData.priorityLevel ? 
                               docData.priorityLevel !== 'Not Recommended' : 
                               (docData.recommendToStudents === 'yes' ? true : false),
                  
                  totalScore: hasNewDataStructure ? priorityScore : (docData.overallPerformance || 0),
                  maxPossibleScore: 10, // Keep consistent max score of 10
                  
                  // Metadata
                  surveyType: docData.evaluationPeriod === 'MIDTERMS' ? 'midterm' : 'final',
                  schoolYear: schoolYear || "Unknown Year",
                  semester: semester || "Unknown",
                  
                  // Add a flag to indicate which data structure this is
                  isNewFormat: hasNewDataStructure
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

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    // Reset to first page whenever search changes
    setPage(1);
  };

  const getFilteredData = () => {
    const filtered = evaluationsData.filter(evaluation => {
      // Apply company filter
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      
      // Apply priority filter
      if (selectedPriority && evaluation.priorityLevel !== selectedPriority) return false;
      
      // Apply search filter - search across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          evaluation.companyName,
          evaluation.companyAddress,
          evaluation.departmentAssigned,
          evaluation.supervisorInCharge,
          evaluation.supervisorEmail,
          evaluation.program,
          evaluation.students,
          evaluation.typicalTasks,
          evaluation.programImprovements,
          evaluation.priorityLevel
        ];
        
        return searchableFields.some(field => 
          field && typeof field === 'string' && field.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

    return filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  };

  const getTotalFilteredCount = () => {
    return evaluationsData.filter(evaluation => {
      // Apply company filter
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      
      // Apply priority filter
      if (selectedPriority && evaluation.priorityLevel !== selectedPriority) return false;
      
      // Apply search filter - search across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          evaluation.companyName,
          evaluation.companyAddress,
          evaluation.departmentAssigned,
          evaluation.supervisorInCharge,
          evaluation.supervisorEmail,
          evaluation.program,
          evaluation.students,
          evaluation.typicalTasks,
          evaluation.programImprovements,
          evaluation.priorityLevel
        ];
        
        return searchableFields.some(field => 
          field && typeof field === 'string' && field.toLowerCase().includes(query)
        );
      }
      
      return true;
    }).length;
  };

  const handleRowClick = (evaluationId) => {
    // If clicking the same row that's already expanded, close it
    // Otherwise, close any expanded row and open the clicked one
    setExpandedEvaluation(expandedEvaluation === evaluationId ? null : evaluationId);
  };

  // Function to highlight search text in strings
  const highlightSearchText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    if (!searchTermLower) return text;
    
    try {
      const textStr = String(text);
      const index = textStr.toLowerCase().indexOf(searchTermLower);
      
      if (index === -1) return textStr;
      
      const before = textStr.substring(0, index);
      const match = textStr.substring(index, index + searchTermLower.length);
      const after = textStr.substring(index + searchTermLower.length);
      
      return (
        <>
          {before}
          <span style={{ backgroundColor: 'rgba(255, 215, 0, 0.4)', fontWeight: 'bold' }}>
            {match}
          </span>
          {after}
        </>
      );
    } catch (err) {
      console.error("Error highlighting text:", err);
      return text;
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search evaluations..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#800000',
                },
                '&:hover fieldset': {
                  borderColor: '#800000',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#800000',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#800000' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    size="small"
                    aria-label="clear search"
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "contained" : "outlined"}
            color="primary"
          >
            Filters
          </Button>
        </Box>
      </Box>

      {/* Search and filter indicators */}
      {(searchQuery || selectedCompany || selectedPriority) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {searchQuery && (
            <Chip 
              label={`Search: "${searchQuery}"`}
              onDelete={() => {
                setSearchQuery('');
                setPage(1);
              }}
              color="primary"
              size="small"
            />
          )}
          {selectedCompany && (
            <Chip 
              label={`Company: ${selectedCompany}`}
              onDelete={() => {
                setSelectedCompany('');
                setPage(1);
              }}
              color="primary"
              size="small"
            />
          )}
          {selectedPriority && (
            <Chip 
              label={`Priority: ${selectedPriority}`}
              onDelete={() => {
                setSelectedPriority('');
                setPage(1);
              }}
              color="primary"
              size="small"
            />
          )}
          {(searchQuery || selectedCompany || selectedPriority) && (
            <Chip 
              label="Clear All Filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCompany('');
                setSelectedPriority('');
                setPage(1);
              }}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      )}

      <Collapse in={showFilters}>
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  label="Priority Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="High Priority">High Priority</MenuItem>
                  <MenuItem value="Medium Priority">Medium Priority</MenuItem>
                  <MenuItem value="Low Priority">Low Priority</MenuItem>
                  <MenuItem value="Not Recommended">Not Recommended</MenuItem>
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
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Priority/Score</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Status</TableCell>
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
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Apartment sx={{ mr: 1, color: '#800000', fontSize: 20 }} />
                      {searchQuery ? 
                        highlightSearchText(evaluation.companyName, searchQuery) : 
                        evaluation.companyName}
                    </Box>
                  </TableCell>
                  <TableCell>{evaluation.meetingDate}</TableCell>
                  <TableCell>{searchQuery ? 
                    highlightSearchText(evaluation.program, searchQuery) : 
                    evaluation.program}</TableCell>
                  <TableCell>
                    {evaluation.isNewFormat ? (
                      <Chip 
                        label={evaluation.priorityLevel} 
                        size="small"
                        color={
                          evaluation.priorityLevel === 'High Priority' ? 'success' :
                          evaluation.priorityLevel === 'Medium Priority' ? 'primary' :
                          evaluation.priorityLevel === 'Low Priority' ? 'warning' :
                          'error'
                        }
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      `${evaluation.totalScore}/${evaluation.maxPossibleScore}`
                    )}
                  </TableCell>
                  <TableCell>
                    {evaluation.recommended ? (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Recommended" 
                        size="small" 
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip 
                        icon={<Cancel />} 
                        label="Not Recommended" 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedEvaluation === evaluation.id} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Company Information</Typography>
                            <Typography><strong>Name:</strong> {evaluation.companyName}</Typography>
                            <Typography><strong>Address:</strong> {evaluation.companyAddress}</Typography>
                            <Typography><strong>Department:</strong> {evaluation.departmentAssigned}</Typography>
                            <Typography><strong>Meeting Date:</strong> {evaluation.meetingDate}</Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Supervisor Details</Typography>
                            <Typography><strong>Supervisor:</strong> {evaluation.supervisorInCharge}</Typography>
                            <Typography><strong>Contact:</strong> {evaluation.supervisorContact}</Typography>
                            <Typography><strong>Email:</strong> {evaluation.supervisorEmail}</Typography>
                            <Typography><strong>Program:</strong> {evaluation.program}</Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Partnership Assessment</Typography>
                            <Typography><strong>Priority Level:</strong> {evaluation.priorityLevel}</Typography>
                            <Typography color={evaluation.recommended ? 'success.main' : 'error.main'}>
                              <strong>Recommendation Status:</strong> {evaluation.recommended ? 'Recommended' : 'Not Recommended'}
                            </Typography>
                          </Grid>
                          
                          {evaluation.isNewFormat && (
                            <>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Safety Assessment</Typography>
                                <Typography>
                                  <strong>Safety Protocols:</strong> {evaluation.safetyProtocols ? '✓' : '✗'}<br />
                                  <strong>Safety Orientation:</strong> {evaluation.safetyOrientation ? '✓' : '✗'}<br />
                                  <strong>Emergency Plans:</strong> {evaluation.emergencyPlans ? '✓' : '✗'}<br />
                                  <strong>No Safety Concerns:</strong> {evaluation.noSafetyConcerns ? '✓' : '✗'}<br />
                                  <strong>Comments:</strong> {evaluation.safetyComments}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Learning Opportunities</Typography>
                                <Typography>
                                  <strong>Relevant Tasks:</strong> {evaluation.relevantTasks ? '✓' : '✗'}<br />
                                  <strong>Evident Supervision:</strong> {evaluation.supervisionEvident ? '✓' : '✗'}<br />
                                  <strong>Industry Exposure:</strong> {evaluation.industryExposure ? '✓' : '✗'}<br />
                                  <strong>Knowledge Application:</strong> {evaluation.knowledgeApplication ? '✓' : '✗'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Work Environment</Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography>
                                      <strong>Professional Culture:</strong> {evaluation.professionalCulture ? '✓' : '✗'}<br />
                                      <strong>Open Communication:</strong> {evaluation.openCommunication ? '✓' : '✗'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography>
                                      <strong>Encourages Initiative:</strong> {evaluation.encouragesInitiative ? '✓' : '✗'}<br />
                                      <strong>No Harassment:</strong> {evaluation.noHarassment ? '✓' : '✗'}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>MOA Compliance</Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography>
                                      <strong>Provided Required Hours:</strong> {evaluation.providedHours ? '✓' : '✗'}<br />
                                      <strong>Submitted Forms:</strong> {evaluation.submittedForms ? '✓' : '✗'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography>
                                      <strong>Attended Orientation:</strong> {evaluation.attendedOrientation ? '✓' : '✗'}<br />
                                      <strong>Open to Collaboration:</strong> {evaluation.openToCollaboration ? '✓' : '✗'}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>Interview Responses</Typography>
                                
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Typography><strong>Working Duration:</strong> {evaluation.workingDuration}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography><strong>Typical Tasks:</strong> {evaluation.typicalTasks}</Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Performance Evaluation</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography><strong>Technical Skills:</strong> {evaluation.technicalSkills}</Typography>
                                    <Typography><strong>Communication:</strong> {evaluation.communication}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography><strong>Professionalism:</strong> {evaluation.professionalism}</Typography>
                                    <Typography><strong>Adaptability:</strong> {evaluation.adaptability}</Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12}>
                                    <Typography><strong>Student Preparation:</strong> {evaluation.wellPrepared}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography><strong>Curriculum Improvements:</strong> {evaluation.curriculumImprovements}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography><strong>Future Engagements:</strong> {evaluation.futureEngagements}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography><strong>Hiring Prospects:</strong> {evaluation.hiringProspects}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography><strong>Program Improvements:</strong> {evaluation.programImprovements}</Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </>
                          )}
                          
                          {/* Legacy format display, show if not new format */}
                          {!evaluation.isNewFormat && (
                            <>
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
                            </>
                          )}
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
            {searchQuery ? 
              `${totalFilteredCount} results for "${searchQuery}"` : 
              `${totalFilteredCount} total entries`}
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
            {`Page ${page} of ${Math.max(1, Math.ceil(totalFilteredCount / rowsPerPage))}`}
          </Typography>
        </Stack>
      </Box>

      {filteredData.length === 0 && (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          {searchQuery ? 
            `No evaluations found matching "${searchQuery}". Try a different search term.` : 
            'No evaluations found for the selected filters.'}
        </Typography>
      )}
    </Container>
  );
}

export default OJTAdviser; 