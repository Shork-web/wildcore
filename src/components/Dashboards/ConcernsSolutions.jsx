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
  TextField,
  InputAdornment,
  Stack,
  Pagination,
  Chip
} from '@mui/material';
import { 
  Warning, 
  CheckCircle, 
  Lightbulb, 
  Assessment,
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
  Clear,
  Search,
  Cancel
} from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import exportManager from '../../utils/ExportManager';

class ConcernsManager {
  constructor() {
    this._students = [];
    this._filters = {
      program: 'All',
      semester: 'All',
      schoolYear: 'All'
    };
    this._searchQuery = '';
  }

  // Getters
  get students() { return [...this._students]; }
  get filters() { return { ...this._filters }; }
  get searchQuery() { return this._searchQuery; }
  
  // Get unique values for filters
  get programs() { return ['All', ...new Set(this._students.map(student => student.program))]; }
  get semesters() { return ['All', 'First', 'Second', 'Summer']; }
  get schoolYears() { return ['All', ...new Set(this._students.map(student => student.schoolYear))]; }
  
  // Get active filters count
  get activeFiltersCount() {
    return Object.values(this._filters).filter(filter => filter !== 'All').length;
  }

  // Setters
  set students(data) {
    this._students = [...data];
  }

  set searchQuery(query) {
    this._searchQuery = query;
  }

  // Methods
  setFilter(type, value) {
    if (type in this._filters) {
      this._filters[type] = value;
    }
  }

  resetFilters() {
    Object.keys(this._filters).forEach(key => {
      this._filters[key] = 'All';
    });
    this._searchQuery = '';
  }

  getFilteredStudents() {
    return this._students.filter(student => {
      // Only include students with feedback data
      const hasFeedback = student.concerns || student.solutions || 
                         student.recommendations || student.evaluation;
      
      if (!hasFeedback) return false;
      
      // Apply filters
      if (this._filters.program !== 'All' && student.program !== this._filters.program) return false;
      if (this._filters.semester !== 'All' && student.semester !== this._filters.semester) return false;
      if (this._filters.schoolYear !== 'All' && student.schoolYear !== this._filters.schoolYear) return false;
      
      // Apply search filter
      if (this._searchQuery) {
        const query = this._searchQuery.toLowerCase().trim();
        const searchFields = [
          student.name,
          student.program,
          student.concerns,
          student.solutions,
          student.recommendations,
          student.evaluation
        ];
        return searchFields.some(field => 
          field && typeof field === 'string' && field.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }
}

function ConcernsSolutions() {
  const [concernsManager] = useState(() => new ConcernsManager());
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [, forceUpdate] = useState();
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const q = query(collection(db, 'studentData'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        concernsManager.students = studentsList;
        forceUpdate({});
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError(error.message);
      }
    );

    return () => unsubscribe();
  }, [concernsManager]);

  const handleFilterChange = (type, value) => {
    concernsManager.setFilter(type, value);
    setPage(1); // Reset to first page when filter changes
    forceUpdate({});
  };

  const resetFilters = () => {
    concernsManager.resetFilters();
    setSearchQuery('');
    setPage(1);
    forceUpdate({});
  };

  const handleRowClick = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    concernsManager.searchQuery = value;
    setPage(1); // Reset to first page when search changes
    forceUpdate({});
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
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

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  const allFilteredStudents = concernsManager.getFilteredStudents();
  
  // Apply pagination
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = allFilteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(allFilteredStudents.length / ITEMS_PER_PAGE);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
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
                      concernsManager.searchQuery = '';
                      setPage(1);
                      forceUpdate({});
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
            sx={{ 
              borderRadius: 2,
              position: 'relative'
            }}
          >
            Filters
            {concernsManager.activeFiltersCount > 0 && (
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
                {concernsManager.activeFiltersCount}
              </Box>
            )}
          </Button>

          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              try {
                // Get the current academic year or use a default
                const currentYear = new Date().getFullYear();
                const academicYear = `${currentYear-1}-${currentYear}`;
                
                // Get HEI information from the first student or use defaults
                const heiName = allFilteredStudents.length > 0 && allFilteredStudents[0].college 
                  ? allFilteredStudents[0].college 
                  : 'Cebu Institute of Technology - University';
                const heiAddress = 'N. Bacalso Avenue, Cebu City';
                
                exportManager.exportConcernsToExcel(
                  allFilteredStudents,
                  'concerns_solutions.xlsx',
                  heiName,
                  heiAddress,
                  academicYear
                );
              } catch (error) {
                console.error('Export error:', error);
                setError('Failed to export data: ' + error.message);
              }
            }}
            sx={{ 
              background: 'linear-gradient(45deg, #800000, #FFD700)',
              '&:hover': {
                background: 'linear-gradient(45deg, #600000, #DFB700)'
              }
            }}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>

      {/* Search and filter indicators */}
      {(searchQuery || concernsManager.activeFiltersCount > 0) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {searchQuery && (
            <Chip 
              label={`Search: "${searchQuery}"`}
              onDelete={() => {
                setSearchQuery('');
                concernsManager.searchQuery = '';
                setPage(1);
                forceUpdate({});
              }}
              color="primary"
              size="small"
            />
          )}
          {concernsManager.filters.program !== 'All' && (
            <Chip 
              label={`Program: ${concernsManager.filters.program}`}
              onDelete={() => {
                handleFilterChange('program', 'All');
              }}
              color="primary"
              size="small"
            />
          )}
          {concernsManager.filters.semester !== 'All' && (
            <Chip 
              label={`Semester: ${concernsManager.filters.semester}`}
              onDelete={() => {
                handleFilterChange('semester', 'All');
              }}
              color="primary"
              size="small"
            />
          )}
          {concernsManager.filters.schoolYear !== 'All' && (
            <Chip 
              label={`Year: ${concernsManager.filters.schoolYear}`}
              onDelete={() => {
                handleFilterChange('schoolYear', 'All');
              }}
              color="primary"
              size="small"
            />
          )}
          {(searchQuery || concernsManager.activeFiltersCount > 0) && (
            <Chip 
              label="Clear All"
              onClick={resetFilters}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      )}

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
            {concernsManager.activeFiltersCount > 0 && (
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
                  value={concernsManager.filters.program}
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                  label="Program"
                >
                  {concernsManager.programs.map(program => (
                    <MenuItem key={program} value={program}>{program}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={concernsManager.filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  label="Semester"
                >
                  {concernsManager.semesters.map(semester => (
                    <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>School Year</InputLabel>
                <Select
                  value={concernsManager.filters.schoolYear}
                  onChange={(e) => handleFilterChange('schoolYear', e.target.value)}
                  label="School Year"
                >
                  {concernsManager.schoolYears.map(year => (
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
          width: '100%',
          overflowX: 'auto'
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
            {paginatedStudents.map((student) => (
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
                  <TableCell>
                    {searchQuery ? highlightSearchText(student.name, searchQuery) : student.name}
                  </TableCell>
                  <TableCell>
                    {searchQuery ? highlightSearchText(student.program, searchQuery) : student.program}
                  </TableCell>
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
                            <Typography variant="body2" sx={{ pl: 4 }}>
                              {searchQuery ? highlightSearchText(student.concerns, searchQuery) : student.concerns}
                            </Typography>
                          </Box>
                        )}
                        {student.solutions && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="solutions" />
                              <Typography color="#388e3c" variant="subtitle1">Solutions</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>
                              {searchQuery ? highlightSearchText(student.solutions, searchQuery) : student.solutions}
                            </Typography>
                          </Box>
                        )}
                        {student.recommendations && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="recommendations" />
                              <Typography color="#1976d2" variant="subtitle1">Recommendations</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>
                              {searchQuery ? highlightSearchText(student.recommendations, searchQuery) : student.recommendations}
                            </Typography>
                          </Box>
                        )}
                        {student.evaluation && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <StatusIcon type="evaluation" />
                              <Typography color="#800000" variant="subtitle1">Evaluation</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>
                              {searchQuery ? highlightSearchText(student.evaluation, searchQuery) : student.evaluation}
                            </Typography>
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

      {allFilteredStudents.length === 0 ? (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          {searchQuery ? 
            `No concerns or solutions found matching "${searchQuery}".` : 
            'No concerns or solutions found for the selected filters.'}
        </Typography>
      ) : (
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
                `${allFilteredStudents.length} results found` : 
                `${allFilteredStudents.length} total entries`}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton 
              showLastButton
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
              {`Page ${page} of ${Math.max(1, totalPages)}`}
            </Typography>
          </Stack>
        </Box>
      )}
    </Container>
  );
}

export default ConcernsSolutions;
