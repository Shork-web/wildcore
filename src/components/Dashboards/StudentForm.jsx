import React, { useState, useEffect, useContext } from 'react';
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
  Autocomplete,
} from '@mui/material';
import { styled } from '@mui/system';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { collegePrograms } from '../../utils/collegePrograms';

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
      middleInitial: data.middleInitial || '',
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
      college: data.college || '',
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
  get college() { return this._data.college; }
  get middleInitial() { return this._data.middleInitial; }

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
  set college(value) { this._data.college = value; }
  set middleInitial(value) { this._data.middleInitial = value; }

  // Methods
  toJSON() {
    return { ...this._data };
  }

  validate() {
    // Check critical fields that cannot be empty
    const criticalFields = [
      'name', 'program', 'partnerCompany', 'location',
      'gender', 'semester'
    ];
    
    for (const field of criticalFields) {
      if (!this._data[field] || this._data[field].trim() === '') {
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
      }
    }

    // Check other required fields
    const requiredFields = [
      'schoolYear'
    ];
    
    for (const field of requiredFields) {
      if (!this._data[field] || this._data[field].trim() === '') {
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }

    // Validate format only if value is provided
    if (this._data.name && this._data.name.trim()) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s.\-'(),]+$/;
      if (!nameRegex.test(this._data.name)) {
        throw new Error('Name contains invalid characters');
      }
    }

    if (this._data.partnerCompany && this._data.partnerCompany.trim()) {
      const companyRegex = /^[a-zA-Z0-9À-ÿ\s.\-&'(),/+@#$%*!?]+$/;
      if (!companyRegex.test(this._data.partnerCompany)) {
        throw new Error('Company name contains invalid characters');
      }
    }

    if (this._data.location && this._data.location.trim()) {
      const locationRegex = /^[a-zA-Z0-9À-ÿ\s.\-,'()@#$%*!?&/+]+$/;
      if (!locationRegex.test(this._data.location)) {
        throw new Error('Location contains invalid characters');
      }
    }

    // Only validate middle initial if it's provided
    if (this._data.middleInitial && this._data.middleInitial.trim()) {
      const middleInitialRegex = /^[a-zA-Z\s.]+$/;
      if (!middleInitialRegex.test(this._data.middleInitial)) {
        throw new Error('Middle Initial contains invalid characters');
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
          this._data[field] = value;
          break;
        case 'concerns':
        case 'solutions':
        case 'recommendations':
        case 'evaluation':
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

function StudentForm({ initialData, docId, addStudent, disableSnackbar, isEditing }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState(() => {
    if (isEditing && initialData) {
      return new Student({
        name: initialData.name || '',
        middleInitial: initialData.middleInitial || '',
        gender: initialData.gender || '',
        program: initialData.program || '',
        semester: initialData.semester || '',
        schoolYear: initialData.schoolYear || '',
        partnerCompany: initialData.partnerCompany || '',
        location: initialData.location || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        concerns: initialData.concerns || '',
        solutions: initialData.solutions || '',
        recommendations: initialData.recommendations || '',
        evaluation: initialData.evaluation || '',
        college: initialData.college || currentUser?.profile?.college || '',
        createdAt: initialData.createdAt,
        createdBy: initialData.createdBy
      });
    }
    return new Student();
  });

  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update the useState for nameFields to properly handle the name splitting
  const [nameFields, setNameFields] = useState(() => {
    if (isEditing && initialData?.name) {
      // Split the full name if editing
      const nameParts = initialData.name.split(',').map(part => part.trim());
      const lastName = nameParts[0] || '';
      let givenName = nameParts[1] || '';
      
      // If there's a middle initial in the name, remove it from given name
      if (initialData.middleInitial) {
        givenName = givenName.replace(` ${initialData.middleInitial}`, '');
      }

      return {
        familyName: lastName,
        givenName: givenName,
        middleInitial: initialData.middleInitial || ''
      };
    }
    return {
      familyName: '',
      givenName: '',
      middleInitial: ''
    };
  });

  useEffect(() => {
    if (currentUser?.profile?.role === 'admin') {
      // For admin, get all programs from all colleges
      const allPrograms = Object.values(collegePrograms).flat();
      setAvailablePrograms(allPrograms);
    } else if (currentUser?.profile?.college) {
      // For instructors, keep existing college-specific programs
      const programs = collegePrograms[currentUser.profile.college];
      setAvailablePrograms(programs);
    }
  }, [currentUser]);

  // Update the handleChange function to properly handle name changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (['familyName', 'givenName', 'middleInitial'].includes(name)) {
      setNameFields(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Construct the full name with proper formatting
      const updatedFields = {
        ...nameFields,
        [name]: value
      };
      
      // Format the full name with family name, given name, and middle initial
      const fullName = `${updatedFields.familyName}, ${updatedFields.givenName}${updatedFields.middleInitial ? ' ' + updatedFields.middleInitial : ''}`.trim();
      
      setFormData(prevData => {
        const newStudent = new Student(prevData.toJSON());
        newStudent.update('name', fullName);
        newStudent.update('middleInitial', updatedFields.middleInitial);
        return newStudent;
      });
    } else {
      setFormData(prevData => {
        const newStudent = new Student(prevData.toJSON());
        newStudent.update(name, value);
        return newStudent;
      });
    }
  };

  const handleProgramChange = (event, newValue) => {
    let programValue = newValue;
    
    if (typeof newValue === 'string') {
      programValue = newValue;
    }
    
    setFormData(prevData => {
      const newStudent = new Student(prevData.toJSON());
      newStudent.update('program', programValue);
      return newStudent;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      
      formData.validate();

      const studentData = {
        ...formData.getAllData(),
        college: userData.college,
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        concerns: formData.concerns || '',
        solutions: formData.solutions || '',
        recommendations: formData.recommendations || '',
        evaluation: formData.evaluation || '',
        createdAt: isEditing ? formData.createdAt : new Date().toISOString(),
        createdBy: isEditing ? formData.createdBy : auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      };

      if (isEditing && docId) {
        await addStudent(studentData);
      } else {
        const docRef = await addDoc(collection(db, 'studentData'), studentData);
        
        // Reset form fields after successful submission
        setFormData(new Student());
        setNameFields({
          familyName: '',
          givenName: '',
          middleInitial: ''
        });
        
        if (addStudent) {
          await addStudent({ ...studentData, id: docRef.id });
        }
      }

      if (!disableSnackbar) {
        setSnackbarMessage(isEditing ? 'Student updated successfully' : 'Student added successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error saving student data:', error);
      if (!disableSnackbar) {
        setSnackbarMessage('Error: ' + error.message);
        setSnackbarSeverity('error');
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

  return (
    <StyledCard>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ color: maroon, fontWeight: 'bold' }}>
          Student Internship Program Form
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionTitle>Personal Information</SectionTitle>
              <Grid container spacing={0}>
                <Grid item xs={12}>
                  <CompactTextField
                    required
                    fullWidth
                    label="Family Name"
                    name="familyName"
                    value={nameFields.familyName}
                    onChange={handleChange}
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                </Grid>
                <Grid item xs={8}>
                  <CompactTextField
                    required
                    fullWidth
                    label="Given Name"
                    name="givenName"
                    value={nameFields.givenName}
                    onChange={handleChange}
                    size="small"
                    sx={{ mb: 1.5, pr: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <CompactTextField
                    fullWidth
                    label="M.I."
                    name="middleInitial"
                    value={nameFields.middleInitial}
                    onChange={handleChange}
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                </Grid>
              </Grid>
              
              <FormControl 
                required 
                fullWidth 
                size="small" 
                sx={{ mb: 1.5 }}
              >
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionTitle>Academic Information</SectionTitle>
              <FormControl required fullWidth size="small" sx={{ mb: 2 }}>
                <Autocomplete
                  value={formData.program}
                  onChange={handleProgramChange}
                  options={availablePrograms}
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Program"
                      required
                      size="small"
                    />
                  )}
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl required fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={formData.semester}
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
                  <FormControl required fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>School Year</InputLabel>
                    <Select
                      name="schoolYear"
                      value={formData.schoolYear}
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
                required
                fullWidth
                label="Partner Company"
                name="partnerCompany"
                value={formData.partnerCompany}
                onChange={handleChange}
                size="small"
              />
              <CompactTextField
                required
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                size="small"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <CompactTextField
                    fullWidth
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <CompactTextField
                    fullWidth
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
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
                value={formData.concerns}
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
                value={formData.solutions}
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
                value={formData.recommendations}
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
                value={formData.evaluation}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              size="large"
              disabled={isSubmitting}
              sx={{
                bgcolor: maroon,
                '&:hover': {
                  bgcolor: '#600000',
                },
              }}
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
          autoHideDuration={3000}
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
      )}
    </StyledCard>
  );
}

export default StudentForm;
