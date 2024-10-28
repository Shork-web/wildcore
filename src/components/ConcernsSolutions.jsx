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
  IconButton
} from '@mui/material';
import { 
  Warning, 
  CheckCircle, 
  Lightbulb, 
  Assessment,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';

function ConcernsSolutions({ students }) {
  const [programFilter, setProgramFilter] = React.useState('All');
  const [semesterFilter, setSemesterFilter] = React.useState('All');
  const [expandedStudent, setExpandedStudent] = useState(null);

  const filteredStudents = students.filter(student => {
    if (programFilter !== 'All' && student.program !== programFilter) return false;
    if (semesterFilter !== 'All' && student.semester !== semesterFilter) return false;
    return student.concerns || student.solutions || student.recommendations || student.evaluation;
  });

  const programs = ['All', ...new Set(students.map(student => student.program))];
  const semesters = ['All', 'First', 'Second', 'Summer'];

  const StatusIcon = ({ type }) => {
    const icons = {
      concerns: <Warning sx={{ color: '#f57c00' }} />,
      solutions: <CheckCircle sx={{ color: '#388e3c' }} />,
      recommendations: <Lightbulb sx={{ color: '#1976d2' }} />,
      evaluation: <Assessment sx={{ color: '#800000' }} />
    };
    return icons[type] || null;
  };

  const handleRowClick = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        align="center" 
        sx={{
          mb: 4,
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #800000, #FFD700)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Concerns & Solutions
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
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
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
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
      </Grid>

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
