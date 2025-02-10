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

function OJTAdviser() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters] = useState(['1st', '2nd', 'Summer']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvaluation, setExpandedEvaluation] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 7;

  useEffect(() => {
    const q = query(collection(db, 'OJTadvisers'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const data = querySnapshot.docs
          .filter(doc => doc.data().status === 'submitted' && doc.data().surveyType === 'company')
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            companyName: doc.data().companyName,
            meetingDate: doc.data().meetingDate,
            students: doc.data().studentNames,
            overallPerformance: doc.data().overallPerformance,
            tasks: doc.data().tasksAssigned,
            training: doc.data().trainingProvided,
            technicalSkills: doc.data().technicalSkills,
            recommendations: doc.data().recommendations,
            industryMentor: doc.data().industryMentor,
            program: doc.data().program,
            recommended: doc.data().recommendToStudents,
            totalScore: doc.data().totalScore,
            maxPossibleScore: doc.data().maxPossibleScore
          }));

        setEvaluationsData(data);
        setCompanies([...new Set(data.map(item => item.companyName))]);
        setYears([...new Set(data.map(item => item.schoolYear))]);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching evaluations:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const getFilteredData = () => {
    const filtered = evaluationsData.filter(evaluation => {
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      if (selectedYear && evaluation.schoolYear !== selectedYear) return false;
      if (selectedSemester && evaluation.semester !== selectedSemester) return false;
      return true;
    });

    return filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  };

  const getTotalFilteredCount = () => {
    return evaluationsData.filter(evaluation => {
      if (selectedCompany && evaluation.companyName !== selectedCompany) return false;
      if (selectedYear && evaluation.schoolYear !== selectedYear) return false;
      if (selectedSemester && evaluation.semester !== selectedSemester) return false;
      return true;
    }).length;
  };

  const handleRowClick = (evaluationId) => {
    setExpandedEvaluation(expandedEvaluation === evaluationId ? null : evaluationId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
          OJT Adviser Evaluations
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
                <InputLabel>School Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="School Year"
                >
                  <MenuItem value="">All</MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  label="Semester"
                >
                  <MenuItem value="">All</MenuItem>
                  {semesters.map((sem) => (
                    <MenuItem key={sem} value={sem}>{sem}</MenuItem>
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