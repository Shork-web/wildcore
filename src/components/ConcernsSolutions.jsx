import React, { useState } from 'react';
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
  Button
} from '@mui/material';
import { 
  Warning, 
  CheckCircle, 
  Lightbulb, 
  Assessment,
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
  Clear
} from '@mui/icons-material';

function ConcernsSolutions({ students }) {
  const [programFilter, setProgramFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  const programs = ['All', ...new Set(students.map(student => student.program))];
  const semesters = ['All', 'First', 'Second', 'Summer'];
  const schoolYears = ['All', ...new Set(students.map(student => student.schoolYear))];

  const filteredStudents = students.filter(student => {
    if (programFilter !== 'All' && student.program !== programFilter) return false;
    if (semesterFilter !== 'All' && student.semester !== semesterFilter) return false;
    if (yearFilter !== 'All' && student.schoolYear !== yearFilter) return false;
    return student.concerns || student.solutions || student.recommendations || student.evaluation;
  });

  const resetFilters = () => {
    setProgramFilter('All');
    setSemesterFilter('All');
    setYearFilter('All');
  };

  const activeFiltersCount = [
    programFilter, 
    semesterFilter, 
    yearFilter
  ].filter(filter => filter !== 'All').length;

  const handleRowClick = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const StatusIcon = ({ type }) => {
    const icons = {
      concerns: <Warning sx={{ color: '#f57c00' }} />,
      solutions: <CheckCircle sx={{ color: '#388e3c' }} />,
      recommendations: <Lightbulb sx={{ color: '#1976d2' }} />,
      evaluation: <Assessment sx={{ color: '#800000' }} />
    };
    return icons[type] || null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #800000, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Concerns & Solutions
        </Typography>
        <Button
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "contained" : "outlined"}
          color="primary"
          sx={{ 
            borderRadius: 2,
            position: 'relative'
          }}
        >
          Filters
          {activeFiltersCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#FFD700',
                color: '#800000',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {activeFiltersCount}
            </Box>
          )}
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Card 
          sx={{ 
            mb: 3, 
            p: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              Filter Options
            </Typography>
            {activeFiltersCount > 0 && (
              <Button
                startIcon={<Clear />}
                onClick={resetFilters}
                size="small"
                sx={{ color: '#800000' }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Program</InputLabel>
                <Select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  label="Program"
                >
                  {programs.map(program => (
                    <MenuItem key={program} value={program}>{program}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  label="Semester"
                >
                  {semesters.map(semester => (
                    <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>School Year</InputLabel>
                <Select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  label="School Year"
                >
                  {schoolYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>
      </Collapse>

      {/* Table View */}
      <TableContainer 
        component={Paper}
        sx={{ 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '56px' }} /> {/* For expand button */}
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Year</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Semester</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <React.Fragment key={student.id}>
                <TableRow 
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.04)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleRowClick(student.id)}
                >
                  <TableCell>
                    <IconButton size="small">
                      {expandedStudent === student.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.program}</TableCell>
                  <TableCell>{student.schoolYear}</TableCell>
                  <TableCell>{student.semester}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedStudent === student.id} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        {student.concerns && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="concerns" />
                              <Typography color="#f57c00" variant="subtitle1">Concerns</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>{student.concerns}</Typography>
                          </Box>
                        )}
                        {student.solutions && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="solutions" />
                              <Typography color="#388e3c" variant="subtitle1">Solutions</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>{student.solutions}</Typography>
                          </Box>
                        )}
                        {student.recommendations && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="recommendations" />
                              <Typography color="#1976d2" variant="subtitle1">Recommendations</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>{student.recommendations}</Typography>
                          </Box>
                        )}
                        {student.evaluation && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="evaluation" />
                              <Typography color="#800000" variant="subtitle1">Evaluation</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>{student.evaluation}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredStudents.length === 0 && (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          No concerns or solutions found for the selected filters.
        </Typography>
      )}
    </Container>
  );
}

export default ConcernsSolutions;
