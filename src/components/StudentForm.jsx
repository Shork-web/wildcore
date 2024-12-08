import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/system';
import { db, auth } from '../firebase-config';
import { collection, addDoc } from 'firebase/firestore';

const maroon = '#800000';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
  minHeight: 'calc(100vh - 120px)', // Adjust for better fit
  display: 'flex',
  flexDirection: 'column',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: maroon,
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiInputBase-root': {
    height: '40px',
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 10px) scale(0.75)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)',
  },
}));

class Student {
  constructor(data = {}) {
    this._data = {
      name: data.name || '',
      gender: data.gender || '',
      program: data.program || '',
      semester: data.semester || '',
      schoolYear: data.schoolYear || '2024-2025',
      partnerCompany: data.partnerCompany || '',
      location: data.location || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      concerns: data.concerns || '',
      solutions: data.solutions || '',
      recommendations: data.recommendations || '',
      evaluation: data.evaluation || '',
      createdAt: data.createdAt || null,
      createdBy: data.createdBy || null,
      updatedAt: data.updatedAt || null,
      updatedBy: data.updatedBy || null,
    };
  }

  // Getters
  get name() { return this._data.name; }
  get gender() { return this._data.gender; }
  get program() { return this._data.program; }
  get semester() { return this._data.semester; }
  get schoolYear() { return this._data.schoolYear; }
  get partnerCompany() { return this._data.partnerCompany; }
  get location() { return this._data.location; }
  get startDate() { return this._data.startDate; }
  get endDate() { return this._data.endDate; }
  get concerns() { return this._data.concerns; }
  get solutions() { return this._data.solutions; }
  get recommendations() { return this._data.recommendations; }
  get evaluation() { return this._data.evaluation; }

  // Setters
  set name(value) { this._data.name = value; }
  set gender(value) { this._data.gender = value; }
  set program(value) { this._data.program = value; }
  set semester(value) { this._data.semester = value; }
  set schoolYear(value) { this._data.schoolYear = value; }
  set partnerCompany(value) { this._data.partnerCompany = value; }
  set location(value) { this._data.location = value; }
  set startDate(value) { this._data.startDate = value; }
  set endDate(value) { this._data.endDate = value; }
  set concerns(value) { this._data.concerns = value; }
  set solutions(value) { this._data.solutions = value; }
  set recommendations(value) { this._data.recommendations = value; }
  set evaluation(value) { this._data.evaluation = value; }

  // Methods
  toJSON() {
    return { ...this._data };
  }

  validate() {
    const requiredFields = [
      'name', 'gender', 'program', 'semester', 'schoolYear',
      'partnerCompany', 'location', 'startDate', 'endDate'
    ];
    
    // Check if fields are empty after trimming
    for (const field of requiredFields) {
      if (!this._data[field] || this._data[field].trim() === '') {
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }

    // Only validate non-empty values
    if (this._data.name.trim()) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s.\-'(),]+$/;
      if (!nameRegex.test(this._data.name)) {
        throw new Error('Name contains invalid characters');
      }
    }

    if (this._data.partnerCompany.trim()) {
      const companyRegex = /^[a-zA-Z0-9À-ÿ\s.\-&'(),/+]+$/;
      if (!companyRegex.test(this._data.partnerCompany)) {
        throw new Error('Company name contains invalid characters');
      }
    }

    if (this._data.location.trim()) {
      const locationRegex = /^[a-zA-Z0-9À-ÿ\s.\-,'()#+]+$/;
      if (!locationRegex.test(this._data.location)) {
        throw new Error('Location contains invalid characters');
      }
    }

    return true;
  }

  update(field, value) {
    if (field in this._data) {
      switch (field) {
        case 'name':
        case 'partnerCompany':
        case 'location':
          // Allow spaces without requiring other characters
          this._data[field] = value;
          break;
        case 'concerns':
        case 'solutions':
        case 'recommendations':
        case 'evaluation':
          // Allow all characters for text areas
          this._data[field] = value;
          break;
        default:
          this._data[field] = value;
      }
    }
  }

  getAllData() {
    return { ...this._data };
  }
}

function StudentForm({ addStudent, initialData, docId, disableSnackbar }) {
  const [student, setStudent] = useState(new Student(initialData));
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = initialData && Object.keys(initialData).length > 0;

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const formattedData = {
        ...initialData,
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
      };
      setStudent(new Student(formattedData));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    try {
      const newStudent = new Student(student.toJSON());
      newStudent.update(name, value);
      
      // Only validate non-empty values
      if (value.trim() && ['name', 'partnerCompany', 'location'].includes(name)) {
        switch (name) {
          case 'name':
            if (!/^[a-zA-ZÀ-ÿ\s.\-'(),]*$/.test(value)) {
              setSnackbarMessage('Please enter a valid name');
              setSnackbarSeverity('warning');
              setOpenSnackbar(true);
              return;
            }
            break;
          case 'partnerCompany':
            if (!/^[a-zA-Z0-9À-ÿ\s.\-&'(),/+]*$/.test(value)) {
              setSnackbarMessage('Please enter a valid company name');
              setSnackbarSeverity('warning');
              setOpenSnackbar(true);
              return;
            }
            break;
          case 'location':
            if (!/^[a-zA-Z0-9À-ÿ\s.\-,'()#+]*$/.test(value)) {
              setSnackbarMessage('Please enter a valid location');
              setSnackbarSeverity('warning');
              setOpenSnackbar(true);
              return;
            }
            break;
          default:
            break;
        }
      }
      
      setStudent(newStudent);
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      student.validate();
      const currentData = student.getAllData();

      if (isEditing && docId) {
        const updateData = {
          name: currentData.name,
          gender: currentData.gender,
          program: currentData.program,
          semester: currentData.semester,
          schoolYear: currentData.schoolYear,
          partnerCompany: currentData.partnerCompany,
          location: currentData.location,
          startDate: currentData.startDate,
          endDate: currentData.endDate,
          concerns: currentData.concerns || '',
          solutions: currentData.solutions || '',
          recommendations: currentData.recommendations || '',
          evaluation: currentData.evaluation || '',
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid,
          createdAt: currentData.createdAt,
          createdBy: currentData.createdBy
        };

        if (addStudent) {
          await addStudent(updateData);
        }
      } else {
        const newStudentData = {
          name: currentData.name,
          gender: currentData.gender,
          program: currentData.program,
          semester: currentData.semester,
          schoolYear: currentData.schoolYear,
          partnerCompany: currentData.partnerCompany,
          location: currentData.location,
          startDate: currentData.startDate,
          endDate: currentData.endDate,
          concerns: currentData.concerns || '',
          solutions: currentData.solutions || '',
          recommendations: currentData.recommendations || '',
          evaluation: currentData.evaluation || '',
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid,
        };
        
        const docRef = await addDoc(collection(db, 'studentData'), newStudentData);
        setStudent(new Student());
        
        if (addStudent) {
          await addStudent({ ...newStudentData, id: docRef.id });
        }
      }

      if (!disableSnackbar) {
        setSnackbarMessage(isEditing ? 'Student updated successfully' : 'Student added successfully');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error saving student data:', error);
      if (!disableSnackbar) {
        setSnackbarMessage('Error: ' + error.message);
        setOpenSnackbar(true);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Define available programs
  const programs = [
    'BSIT',
    'BSCS',
    'BSIS',
    'BSEMC',
    'BSCpE',
    'BSCE',
    'BSEE',
    'BSME',
    'BSA',
    'BSBA',
    'BSN',
    'BSMT',
    'BSPT',
    'BSPharma',
    'BSRT'
  ];

  return (
    <StyledCard elevation={0}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h5" align="center" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 3 }}>
          Student Internship Program Form
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SectionTitle>Personal Information</SectionTitle>
              <TextField
                fullWidth
                required
                label="Student Name"
                name="name"
                value={student.name}
                onChange={handleChange}
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                  },
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, 10px) scale(0.75)',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                }}
              />
              <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={student.gender}
                  onChange={handleChange}
                  label="Gender"
                  sx={{
                    height: '40px',
                  }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionTitle>Academic Information</SectionTitle>
              <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                <InputLabel>Program</InputLabel>
                <Select
                  name="program"
                  value={student.program}
                  onChange={handleChange}
                  label="Program"
                >
                  {programs.map((program) => (
                    <MenuItem key={program} value={program}>
                      {program}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={student.semester}
                      onChange={handleChange}
                      label="Semester"
                    >
                      <MenuItem value="First">First</MenuItem>
                      <MenuItem value="Second">Second</MenuItem>
                      <MenuItem value="Summer">Summer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                    <InputLabel>School Year</InputLabel>
                    <Select
                      name="schoolYear"
                      value={student.schoolYear}
                      onChange={handleChange}
                      label="School Year"
                    >
                      {['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029'].map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionTitle>Internship Information</SectionTitle>
              <CompactTextField
                fullWidth
                label="Partner Company"
                name="partnerCompany"
                value={student.partnerCompany}
                onChange={handleChange}
                required
                size="small"
              />
              <CompactTextField
                fullWidth
                label="Location"
                name="location"
                value={student.location}
                onChange={handleChange}
                required
                size="small"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <CompactTextField
                    fullWidth
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={student.startDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <CompactTextField
                    fullWidth
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={student.endDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionTitle>Feedback and Evaluation</SectionTitle>
              <TextField
                fullWidth
                label="Concerns"
                name="concerns"
                multiline
                rows={3}
                value={student.concerns}
                onChange={handleChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Solutions"
                name="solutions"
                multiline
                rows={3}
                value={student.solutions}
                onChange={handleChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Recommendations"
                name="recommendations"
                multiline
                rows={3}
                value={student.recommendations}
                onChange={handleChange}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Evaluation"
                name="evaluation"
                multiline
                rows={3}
                value={student.evaluation}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : (isEditing ? 'Update Student' : 'Add Student')
              }
            </Button>
          </Box>
        </Box>
      </CardContent>

      {!disableSnackbar && (
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
              backgroundColor: snackbarSeverity === 'success' ? '#E8F5E9' : 
                              snackbarSeverity === 'warning' ? '#FFF3E0' : 
                              snackbarSeverity === 'error' ? '#FFEBEE' : '#E3F2FD',
              '& .MuiAlert-icon': {
                color: snackbarSeverity === 'success' ? '#2E7D32' : 
                       snackbarSeverity === 'warning' ? '#F57C00' : 
                       snackbarSeverity === 'error' ? '#C62828' : '#1976D2'
              },
              color: snackbarSeverity === 'success' ? '#1B5E20' : 
                     snackbarSeverity === 'warning' ? '#E65100' : 
                     snackbarSeverity === 'error' ? '#B71C1C' : '#0D47A1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      )}
    </StyledCard>
  );
}

export default StudentForm;
