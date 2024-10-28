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

function StudentForm({ addStudent, initialData = {} }) {
  const [studentData, setStudentData] = useState({
    name: '',
    gender: '',
    program: '',
    semester: '',
    schoolYear: '2024-2025',
    partnerCompany: '',
    location: '',
    startDate: '',
    endDate: '',
    concerns: '',
    solutions: '',
    recommendations: '',
    evaluation: '',
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const isEditing = Object.keys(initialData).length > 0;

  useEffect(() => {
    if (isEditing) {
      setStudentData((prevData) => ({ ...prevData, ...initialData }));
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addStudent({ ...studentData });
    setSnackbarMessage(isEditing ? 'Student updated successfully!' : 'Student added successfully!');
    setOpenSnackbar(true);
    if (!isEditing) {
      setStudentData({
        name: '',
        gender: '',
        program: '',
        semester: '',
        schoolYear: '2024-2025',
        partnerCompany: '',
        location: '',
        startDate: '',
        endDate: '',
        concerns: '',
        solutions: '',
        recommendations: '',
        evaluation: '',
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

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
              <CompactTextField
                fullWidth
                label="Student Name"
                name="name"
                value={studentData.name}
                onChange={handleChange}
                required
                size="small"
              />
              <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={studentData.gender}
                  onChange={handleChange}
                  label="Gender"
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
              <CompactTextField
                fullWidth
                label="Program"
                name="program"
                value={studentData.program}
                onChange={handleChange}
                required
                size="small"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={studentData.semester}
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
                      value={studentData.schoolYear}
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
                value={studentData.partnerCompany}
                onChange={handleChange}
                required
                size="small"
              />
              <CompactTextField
                fullWidth
                label="Location"
                name="location"
                value={studentData.location}
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
                    value={studentData.startDate}
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
                    value={studentData.endDate}
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
                value={studentData.concerns}
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
                value={studentData.solutions}
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
                value={studentData.recommendations}
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
                value={studentData.evaluation}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button type="submit" variant="contained" color="primary" fullWidth size="large">
              {isEditing ? 'Update Student' : 'Add Student'}
            </Button>
          </Box>
        </Box>
      </CardContent>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </StyledCard>
  );
}

export default StudentForm;
