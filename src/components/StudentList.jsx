import React, { useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Collapse,
  Button
} from '@mui/material';
import { Edit, Delete, FilterList, Clear } from '@mui/icons-material';

function StudentList({ students, updateStudent, deleteStudent }) {
  const [programFilter, setProgramFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filters
  const programs = ['All', ...new Set(students.map(student => student.program))];
  const semesters = ['All', 'First', 'Second', 'Summer'];
  const schoolYears = ['All', ...new Set(students.map(student => student.schoolYear))];
  const companies = ['All', ...new Set(students.map(student => student.partnerCompany))];

  // Filter students based on selected filters
  const filteredStudents = students.filter(student => {
    if (programFilter !== 'All' && student.program !== programFilter) return false;
    if (semesterFilter !== 'All' && student.semester !== semesterFilter) return false;
    if (yearFilter !== 'All' && student.schoolYear !== yearFilter) return false;
    if (companyFilter !== 'All' && student.partnerCompany !== companyFilter) return false;
    return true;
  });

  const resetFilters = () => {
    setProgramFilter('All');
    setSemesterFilter('All');
    setYearFilter('All');
    setCompanyFilter('All');
  };

  const activeFiltersCount = [
    programFilter, 
    semesterFilter, 
    yearFilter, 
    companyFilter
  ].filter(filter => filter !== 'All').length;

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
          Student List
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  label="Company"
                >
                  {companies.map(company => (
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
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Gender</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Semester</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>School Year</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#800000' }}>Duration</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow 
                key={student.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(128, 0, 0, 0.04)',
                  }
                }}
              >
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.program}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.semester}</TableCell>
                <TableCell>{student.schoolYear}</TableCell>
                <TableCell>{student.partnerCompany}</TableCell>
                <TableCell>{student.location}</TableCell>
                <TableCell>
                  {`${new Date(student.startDate).toLocaleDateString()} - ${new Date(student.endDate).toLocaleDateString()}`}
                </TableCell>
                <TableCell align="right">
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => updateStudent(student)}
                        sx={{ 
                          color: '#800000',
                          '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.1)' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => deleteStudent(student.id)}
                        sx={{ 
                          color: '#800000',
                          '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.1)' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
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
          No students found for the selected filters.
        </Typography>
      )}
    </Container>
  );
}

export default StudentList;
