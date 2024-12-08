import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton as MuiIconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import { db, auth } from '../firebase-config';
import { collection, deleteDoc, doc, query, onSnapshot, updateDoc } from 'firebase/firestore';
import StudentForm from './StudentForm';

class StudentManager {
  constructor() {
    this._students = [];
    this._filters = {
      program: 'All',
      semester: 'All',
      schoolYear: 'All',
      company: 'All'
    };
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
    }
  }

  resetFilters() {
    Object.keys(this._filters).forEach(key => {
      this._filters[key] = 'All';
    });
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
      const studentRef = doc(db, 'studentData', studentId);
      await deleteDoc(studentRef);
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  async updateStudent(studentId, updatedData) {
    try {
      // Ensure all required fields are present and valid
      const requiredFields = [
        'name', 'gender', 'program', 'semester', 'schoolYear',
        'partnerCompany', 'location', 'startDate', 'endDate',
        'concerns', 'solutions', 'recommendations', 'evaluation',
        'createdBy', 'updatedBy', 'createdAt', 'updatedAt'
      ];

      const missingFields = requiredFields.filter(field => !(field in updatedData));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Ensure string fields are not empty for required fields
      const requiredStringFields = [
        'name', 'gender', 'program', 'semester', 'schoolYear',
        'partnerCompany', 'location', 'startDate', 'endDate'
      ];

      requiredStringFields.forEach(field => {
        if (!updatedData[field] || updatedData[field].trim() === '') {
          throw new Error(`${field} cannot be empty`);
        }
      });

      const studentRef = doc(db, 'studentData', studentId);
      await updateDoc(studentRef, updatedData);
      
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }
}

function StudentList() {
  const studentManager = useRef(new StudentManager()).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [, forceUpdate] = useState();

  // Real-time data fetching
  useEffect(() => {
    const q = query(collection(db, 'studentData'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        studentManager.students = studentsList;
        setLoading(false);
        forceUpdate({}); // Force re-render when data changes
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentManager]);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    studentManager.setFilter(type, value);
    forceUpdate({}); // Force re-render when filters change
  };

  const resetFilters = () => {
    studentManager.resetFilters();
    forceUpdate({});
  };

  // Handle student deletion
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

  // Handle student update
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
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
        createdAt: editingStudent.createdAt,
        createdBy: editingStudent.createdBy,
        concerns: updatedData.concerns || '',
        solutions: updatedData.solutions || '',
        recommendations: updatedData.recommendations || '',
        evaluation: updatedData.evaluation || ''
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

  // Get filtered students
  const filteredStudents = studentManager.getFilteredStudents();
  const activeFiltersCount = studentManager.getActiveFiltersCount();

  // Handle edit dialog
  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  // Add snackbar close handler
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
          startIcon={<FilterListIcon />}
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
                startIcon={<ClearIcon />}
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
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={studentManager.filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  label="Company"
                >
                  {studentManager.companies.map(company => (
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

      {/* Edit Dialog */}
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

      {/* Add Snackbar at the bottom */}
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

      {/* Error state display */}
      {error && (
        <Paper
          sx={{
            p: 3,
            mt: 3,
            backgroundColor: '#FFEBEE',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: '#FFCDD2',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ErrorIcon sx={{ color: '#C62828' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#B71C1C', mb: 0.5 }}>
              Error Loading Students
            </Typography>
            <Typography variant="body2" sx={{ color: '#C62828' }}>
              {error}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Loading state */}
      {loading && (
        <Paper
          sx={{
            p: 3,
            mt: 3,
            backgroundColor: '#E3F2FD',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={24} sx={{ color: '#1976D2' }} />
          <Typography variant="h6" sx={{ color: '#1565C0' }}>
            Loading Students...
          </Typography>
        </Paper>
      )}

      {/* Add Delete Confirmation Dialog */}
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
