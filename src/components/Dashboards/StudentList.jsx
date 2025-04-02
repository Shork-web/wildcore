import React, { useState, useEffect, useRef, useContext } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Box, Grid, FormControl, InputLabel, Select, MenuItem, Card, Collapse, Button, Dialog, DialogTitle,DialogContent, DialogActions, IconButton as MuiIconButton, Snackbar, Alert, Pagination, Stack, Chip, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { db, auth } from '../../firebase-config';
import { collection, deleteDoc, doc, query, onSnapshot, updateDoc, where } from 'firebase/firestore';
import StudentForm from './StudentForm';
import { AuthContext } from '../../context/AuthContext';
import exportManager from '../../utils/ExportManager';

class StudentManager {
  constructor(currentUser) {
    this._students = [];
    this._subscribers = new Set();
    this._filters = {
      program: 'All',
      semester: 'All',
      schoolYear: 'All',
      company: 'All'
    };
    this._error = null;
    this._currentUser = currentUser;
    this.initializeDataFetching();
  }

  // Getters
  get students() { return [...this._students]; }
  get filters() { return { ...this._filters }; }

  // Get unique values for filters
  get programs() { return ['All', ...new Set(this._students.map(student => student.program))]; }
  get semesters() { return ['All', 'First', 'Second', 'Summer']; }
  get schoolYears() { return ['All', ...new Set(this._students.map(student => student.schoolYear))]; }
  get companies() { return ['All', ...new Set(this._students.map(student => student.partnerCompany))]; }

  // Setters
  set students(students) { this._students = [...students]; }

  // Methods
  setFilter(type, value) {
    if (type in this._filters) {
      this._filters[type] = value;
      this._notifySubscribers();
    }
  }

  resetFilters() {
    Object.keys(this._filters).forEach(key => {
      this._filters[key] = 'All';
    });
    this._notifySubscribers();
  }

  getActiveFiltersCount() {
    return Object.values(this._filters).filter(filter => filter !== 'All').length;
  }

  getFilteredStudents() {
    return this._students.filter(student => {
      if (this._filters.program !== 'All' && student.program !== this._filters.program) return false;
      if (this._filters.semester !== 'All' && student.semester !== this._filters.semester) return false;
      if (this._filters.schoolYear !== 'All' && student.schoolYear !== this._filters.schoolYear) return false;
      if (this._filters.company !== 'All' && student.partnerCompany !== this._filters.company) return false;
      return true;
    });
  }

  async deleteStudent(studentId) {
    try {
      await deleteDoc(doc(db, 'studentData', studentId));
      // No need to manually update state as onSnapshot will handle it
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  async updateStudent(studentId, updatedData) {
    try {
      // Critical fields that cannot be empty
      const criticalFields = [
        'name', 'program', 'partnerCompany', 'location',
        'gender', 'semester'  // Removed middleInitial from critical fields
      ];

      criticalFields.forEach(field => {
        if (!updatedData[field] || updatedData[field].trim() === '') {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
        }
      });

      // Other required fields
      const requiredFields = [
        'schoolYear',  // Only schoolYear remains as required
        'concerns', 'solutions', 'recommendations', 'evaluation',
        'createdBy', 'updatedBy', 'createdAt', 'updatedAt'
      ];

      const missingFields = requiredFields.filter(field => !(field in updatedData));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare the final update data
      const finalUpdatedData = {
        ...updatedData,
        startDate: updatedData.startDate || '',  // Make startDate optional
        endDate: updatedData.endDate || '',      // Make endDate optional
        concerns: updatedData.concerns || '',
        solutions: updatedData.solutions || '',
        recommendations: updatedData.recommendations || '',
        evaluation: updatedData.evaluation || '',
        middleInitial: updatedData.middleInitial || '',  // Make middleInitial optional
        college: updatedData.college || this._currentUser?.profile?.college || '',
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid
      };

      const studentRef = doc(db, 'studentData', studentId);
      await updateDoc(studentRef, finalUpdatedData);
      
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Add subscription methods
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  _notifySubscribers() {
    this._subscribers.forEach(callback => callback());
  }

  // Data fetching method
  initializeDataFetching() {
    let q;
    
    if (this._currentUser?.profile?.role === 'instructor') {
      q = query(
        collection(db, 'studentData'),
        where('college', '==', this._currentUser.profile.college)
      );
    } else {
      q = query(collection(db, 'studentData'));
    }

    return onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this._students = studentsList;
        this._notifySubscribers();
      },
      (error) => {
        console.error("Error fetching students:", error);
        this._error = error.message;
        this._notifySubscribers();
      }
    );
  }
}

function StudentList() {
  const { currentUser } = useContext(AuthContext);
  const studentManager = useRef(new StudentManager(currentUser)).current;
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const userRole = currentUser?.profile?.role || 'student';
  const [searchQuery, setSearchQuery] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const unsubscribe = studentManager.subscribe(() => {
      const allStudents = studentManager.students;
      setStudents(allStudents);
      setFilteredStudents(allStudents);
    });

    return () => unsubscribe();
  }, [studentManager]);

  useEffect(() => {
    const uniqueCompanies = ['All', ...new Set(students
      .map(student => student.partnerCompany)
      .filter(Boolean)
      .sort())];
    setCompanies(uniqueCompanies);
  }, [students]);

  const handleFilterChange = (type, value) => {
    studentManager.setFilter(type, value);
    setFilteredStudents(studentManager.getFilteredStudents());
  };

  const resetFilters = () => {
    studentManager.resetFilters();
    setFilteredStudents(students);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      await studentManager.deleteStudent(studentToDelete.id);
      setSnackbarMessage('Student deleted successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Error deleting student: ' + error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleEdit = (student) => {
    // Create a new Student instance with the existing data
    const studentData = {
      name: student.name || '',
      middleInitial: student.middleInitial || '',
      gender: student.gender || '',
      program: student.program || '',
      semester: student.semester || '',
      schoolYear: student.schoolYear || '',
      partnerCompany: student.partnerCompany || '',
      location: student.location || '',
      startDate: student.startDate || '',
      endDate: student.endDate || '',
      concerns: student.concerns || '',
      solutions: student.solutions || '',
      recommendations: student.recommendations || '',
      evaluation: student.evaluation || '',
      college: student.college || currentUser?.profile?.college || '',
      createdAt: student.createdAt,
      createdBy: student.createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid
    };

    setEditingStudent({
      id: student.id,
      ...studentData
    });
    setIsDialogOpen(true);
  };

  const handleUpdateSuccess = async (updatedData) => {
    try {
      if (!editingStudent?.id) {
        throw new Error('No student selected for update');
      }

      if (!auth.currentUser) {
        throw new Error('User must be authenticated to update records');
      }

      const completeUpdateData = {
        ...updatedData,
        college: currentUser?.profile?.college || editingStudent.college,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
        createdAt: editingStudent.createdAt,
        createdBy: editingStudent.createdBy
      };

      await studentManager.updateStudent(editingStudent.id, completeUpdateData);
      setIsDialogOpen(false);
      setEditingStudent(null);
      setSnackbarMessage('Student updated successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating student:', error);
      setSnackbarMessage('Error updating student: ' + error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      throw error;
    }
  };

  const handleCloseDialog = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setStudentToDelete(null);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    const query = event.target.value.toLowerCase();
    
    const filtered = students.filter(student => 
      student.name?.toLowerCase().includes(query) ||
      student.program?.toLowerCase().includes(query) ||
      student.partnerCompany?.toLowerCase().includes(query) ||
      student.location?.toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
    setPage(1); // Reset to first page when searching
  };

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: { xs: 2, md: 1 }
        }}>
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
          
          {userRole === 'instructor' && (
            <Card 
              elevation={0}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'rgba(255, 245, 230, 0.7)',
                border: '1px solid rgba(128, 0, 0, 0.1)',
                borderRadius: 2,
                px: 2,
                py: 1,
                mt: { xs: 1, md: 0 },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: '#800000',
                mr: 2
              }}>
                <PersonIcon fontSize="small" />
                <Typography variant="body2" fontWeight="medium">
                  {currentUser?.profile?.firstName} {currentUser?.profile?.lastName}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: '#800000',
                mr: 2
              }}>
                <PeopleAltIcon fontSize="small" />
                <Typography variant="body2" fontWeight="medium">
                  {filteredStudents.length} Students
                </Typography>
              </Box>
              
              <Chip 
                label={currentUser?.profile?.college || 'Department'} 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(128, 0, 0, 0.1)',
                  color: '#800000',
                  fontWeight: 'medium',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Card>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mt: 3,
          gap: 2
        }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by name, program, company, or location..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{
              maxWidth: { xs: '100%', md: '500px' },
              '& .MuiOutlinedInput-root': {
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
                  <SearchIcon sx={{ color: '#800000' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'white',
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: { xs: '100%', md: 'auto' }, 
            justifyContent: { xs: 'space-between', md: 'flex-end' } 
          }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
              color="primary"
              sx={{ 
                borderRadius: 2,
                position: 'relative',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap'
              }}
            >
              Filters
              {studentManager.getActiveFiltersCount() > 0 && (
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
                  {studentManager.getActiveFiltersCount()}
                </Box>
              )}
            </Button>

            {userRole === 'admin' && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => exportManager.exportStudentsToExcel(
                  filteredStudents, 
                  userRole, 
                  'student_interns.xlsx', 
                  'Cebu Institute of Technology - University', // HEI name
                  'N. Bacalso Avenue, Cebu City', // HEI address
                  '2023-2024' // Academic year
                )}
                sx={{ 
                  background: 'linear-gradient(45deg, #800000, #FFD700)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #600000, #DFB700)'
                  },
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                Export to Excel
              </Button>
            )}
          </Box>
        </Box>
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
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              Filter Options
            </Typography>
            {studentManager.getActiveFiltersCount() > 0 && (
              <Button
                startIcon={<ClearIcon />}
                onClick={resetFilters}
                size="small"
                sx={{ color: '#800000' }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Program</InputLabel>
                <Select
                  value={studentManager.filters.program}
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                  label="Program"
                >
                  {studentManager.programs.map(program => (
                    <MenuItem key={program} value={program}>{program}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={studentManager.filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  label="Semester"
                >
                  {studentManager.semesters.map(semester => (
                    <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>School Year</InputLabel>
                <Select
                  value={studentManager.filters.schoolYear}
                  onChange={(e) => handleFilterChange('schoolYear', e.target.value)}
                  label="School Year"
                >
                  {studentManager.schoolYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                value={studentManager.filters.company}
                onChange={(event, newValue) => {
                  handleFilterChange('company', newValue || 'All');
                }}
                inputValue={companySearch}
                onInputChange={(event, newInputValue) => {
                  setCompanySearch(newInputValue);
                }}
                options={companies}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#800000',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#800000',
                        },
                      },
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-tag': {
                    backgroundColor: 'rgba(128, 0, 0, 0.08)',
                    color: '#800000',
                  }
                }}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                disableListWrap
                filterOptions={(options, { inputValue }) => {
                  const filterValue = inputValue.toLowerCase();
                  return options.filter(option => 
                    option.toLowerCase().includes(filterValue)
                  ).slice(0, 100); // Limit to first 100 matches for performance
                }}
                ListboxProps={{
                  style: {
                    maxHeight: '200px'
                  }
                }}
                componentsProps={{
                  paper: {
                    sx: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                    }
                  }
                }}
              />
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
          width: '100%',
          overflowX: 'auto',
          '& .MuiTable-root': {
            tableLayout: 'fixed',
            minWidth: 1000,
          },
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
        <Table 
          stickyHeader 
          sx={{ 
            minWidth: '100%',
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              px: 2,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                width: '15%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Name</TableCell>
              <TableCell sx={{ 
                width: '12%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Program</TableCell>
              <TableCell sx={{ 
                width: '6%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Gender</TableCell>
              <TableCell sx={{ 
                width: '15%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Company</TableCell>
              <TableCell sx={{ 
                width: '12%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Location</TableCell>
              <TableCell sx={{ 
                width: '10%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Start Date</TableCell>
              <TableCell sx={{ 
                width: '10%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>End Date</TableCell>
              <TableCell sx={{ 
                width: '10%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center'
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow 
                key={student.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(128, 0, 0, 0.04)',
                  },
                  height: '60px',
                }}
              >
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%'
                  }
                }}>
                  <Tooltip title={student.name} placement="top">
                    <span className="content">{student.name}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%'
                  }
                }}>
                  <Tooltip title={student.program} placement="top">
                    <span className="content">{student.program}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%'
                  }
                }}>
                  <Tooltip title={student.gender} placement="top">
                    <span className="content">{student.gender}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%'
                  }
                }}>
                  <Tooltip title={student.partnerCompany} placement="top">
                    <span className="content">{student.partnerCompany}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%'
                  }
                }}>
                  <Tooltip title={student.location} placement="top">
                    <span className="content">{student.location}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    fontSize: '0.875rem'
                  }
                }}>
                  <Tooltip 
                    title={student.startDate ? new Date(student.startDate).toLocaleDateString() : 'N/A'} 
                    placement="top"
                  >
                    <span className="content">
                      {student.startDate ? new Date(student.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  padding: '16px',
                  '& .content': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    fontSize: '0.875rem'
                  }
                }}>
                  <Tooltip 
                    title={student.endDate ? new Date(student.endDate).toLocaleDateString() : 'N/A'} 
                    placement="top"
                  >
                    <span className="content">
                      {student.endDate ? new Date(student.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{ 
                    padding: '16px',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(student)}
                        sx={{ 
                          color: '#800000',
                          '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.1)' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteClick(student)}
                        sx={{ 
                          color: '#800000',
                          '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.1)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
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
            {`${filteredStudents.length} total entries`}
          </Typography>
          <Pagination
            count={Math.ceil(filteredStudents.length / rowsPerPage)}
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
            {`Page ${page} of ${Math.ceil(filteredStudents.length / rowsPerPage)}`}
          </Typography>
        </Stack>
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Student Information
          <MuiIconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent>
          {editingStudent && (
            <StudentForm
              initialData={editingStudent}
              docId={editingStudent.id}
              addStudent={handleUpdateSuccess}
              disableSnackbar={true}
              isEditing={true}
              key={editingStudent.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {filteredStudents.length === 0 && (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          No students found for the selected filters.
        </Typography>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ 
            width: '100%',
            backgroundColor: snackbarSeverity === 'success' ? '#E8F5E9' : '#FFEBEE',
            '& .MuiAlert-icon': {
              color: snackbarSeverity === 'success' ? '#2E7D32' : '#C62828'
            },
            color: snackbarSeverity === 'success' ? '#1B5E20' : '#B71C1C',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#FFEBEE', 
          color: '#B71C1C',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon sx={{ color: '#C62828' }} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Are you sure you want to delete the student record for{' '}
            <strong>{studentToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              color: '#666',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained" 
            color="error"
            sx={{ 
              bgcolor: '#C62828',
              '&:hover': { bgcolor: '#B71C1C' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default StudentList;
