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
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/system';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { collegePrograms } from '../../utils/collegePrograms';
import { 
  Person, 
  School, 
  Business, 
  LocationOn, 
  DateRange, 
  Add,
  Edit,
  ContactMail,
  VpnKey,
  Refresh,
} from '@mui/icons-material';

const maroon = '#800000';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  overflow: 'hidden',
  minHeight: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '100%',
  position: 'relative',
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  backdropFilter: 'blur(2px)',
}));

const FormHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${maroon} 0%, #B22222 100%)`,
  color: 'white',
  borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '16px 16px 0 0',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(255, 255, 255, 0.3)',
  }
}));

const SectionWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3, 3.5),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 24px 0 rgba(0, 0, 0, 0.1)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '6px',
    height: '100%',
    background: `linear-gradient(to bottom, ${maroon}, #FF8C00)`,
    borderRadius: '4px 0 0 4px',
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: maroon,
  marginBottom: theme.spacing(2.5),
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40px',
    height: '3px',
    background: `linear-gradient(to right, ${maroon}, #FF8C00)`,
    borderRadius: '4px',
  },
  '& svg': {
    marginRight: theme.spacing(1),
    fontSize: '1.3rem',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 0 0 1px rgba(128, 0, 0, 0.2)',
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)',
    }
  },
  '& .MuiInputBase-input': {
    padding: '14px 16px',
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(16px, 16px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(16px, -6px) scale(0.75)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: maroon,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(128, 0, 0, 0.5)',
    borderWidth: '1px',
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 0 0 1px rgba(128, 0, 0, 0.2)',
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)',
    }
  },
  '& .MuiInputBase-input': {
    padding: '14px 16px',
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(16px, 16px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(16px, -6px) scale(0.75)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: maroon,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(128, 0, 0, 0.5)',
    borderWidth: '1px',
  },
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    padding: '4px 10px',
    '&:hover': {
      boxShadow: '0 0 0 1px rgba(128, 0, 0, 0.2)',
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)',
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(16px, 16px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(16px, -6px) scale(0.75)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: maroon,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(128, 0, 0, 0.5)',
    borderWidth: '1px',
  },
  '& .MuiAutocomplete-input': {
    padding: '6px 6px',
  }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.7),
  borderRadius: '30px',
  boxShadow: '0 6px 20px 0 rgba(128, 0, 0, 0.25)',
  transition: 'all 0.3s ease',
  fontWeight: 600,
  fontSize: '1.1rem',
  letterSpacing: '0.5px',
  background: `linear-gradient(45deg, ${maroon} 0%, #B22222 100%)`,
  marginTop: theme.spacing(3),
  '&:hover': {
    boxShadow: '0 8px 25px 0 rgba(128, 0, 0, 0.35)',
    background: `linear-gradient(45deg, #600000 0%, #800000 100%)`,
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 4px 15px 0 rgba(128, 0, 0, 0.35)',
  }
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
      contactPerson: data.contactPerson || '',
      location: data.location || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      college: data.college || '',
      section: data.section || '',
      email: data.email || '',
      internshipEmail: data.internshipEmail || '',
      midtermsKey: data.midtermsKey || '',
      finalsKey: data.finalsKey || '',
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
  get contactPerson() { return this._data.contactPerson; }
  get location() { return this._data.location; }
  get startDate() { return this._data.startDate; }
  get endDate() { return this._data.endDate; }
  get college() { return this._data.college; }
  get middleInitial() { return this._data.middleInitial; }
  get section() { return this._data.section; }
  get email() { return this._data.email; }
  get internshipEmail() { return this._data.internshipEmail; }
  get midtermsKey() { return this._data.midtermsKey; }
  get finalsKey() { return this._data.finalsKey; }
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
  set contactPerson(value) { this._data.contactPerson = value; }
  set location(value) { this._data.location = value; }
  set startDate(value) { this._data.startDate = value; }
  set endDate(value) { this._data.endDate = value; }
  set college(value) { this._data.college = value; }
  set middleInitial(value) { this._data.middleInitial = value; }
  set section(value) { this._data.section = value; }
  set email(value) { this._data.email = value; }
  set internshipEmail(value) { this._data.internshipEmail = value; }
  set midtermsKey(value) { this._data.midtermsKey = value; }
  set finalsKey(value) { this._data.finalsKey = value; }
  set concerns(value) { this._data.concerns = value; }
  set solutions(value) { this._data.solutions = value; }
  set recommendations(value) { this._data.recommendations = value; }
  set evaluation(value) { this._data.evaluation = value; }

  // Methods
  toJSON() {
    return { ...this._data };
  }
  
  getAllData() {
    return {
      name: this._data.name || '',
      middleInitial: this._data.middleInitial || '',
      gender: this._data.gender || '',
      program: this._data.program || '',
      semester: this._data.semester || '',
      schoolYear: this._data.schoolYear || '',
      partnerCompany: this._data.partnerCompany || '',
      contactPerson: this._data.contactPerson || '',
      location: this._data.location || '',
      startDate: this._data.startDate || '',
      endDate: this._data.endDate || '',
      college: this._data.college || '',
      section: this._data.section || '',
      email: this._data.email || '',
      internshipEmail: this._data.internshipEmail || '',
      midtermsKey: this._data.midtermsKey || '',
      finalsKey: this._data.finalsKey || '',
      concerns: this._data.concerns || '',
      solutions: this._data.solutions || '',
      recommendations: this._data.recommendations || '',
      evaluation: this._data.evaluation || '',
      createdAt: this._data.createdAt,
      createdBy: this._data.createdBy,
      updatedAt: this._data.updatedAt,
      updatedBy: this._data.updatedBy
    };
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

    if (this._data.contactPerson && this._data.contactPerson.trim()) {
      const contactPersonRegex = /^[a-zA-Z0-9À-ÿ\s.\-&'(),/+@#$%*!?]+$/;
      if (!contactPersonRegex.test(this._data.contactPerson)) {
        throw new Error('Contact person name contains invalid characters');
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

    // Validate email format if provided
    if (this._data.email && this._data.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(this._data.email)) {
        throw new Error('Email address is not valid');
      }
    }

    // Validate internship email format if provided
    if (this._data.internshipEmail && this._data.internshipEmail.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(this._data.internshipEmail)) {
        throw new Error('Internship email address is not valid');
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
        default:
          this._data[field] = value;
      }
    }
  }
}

// Function to generate random access key
const generateAccessKey = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
};

function StudentForm({ initialData, docId, addStudent, disableSnackbar, isEditing }) {
  const { currentUser, userRole } = useContext(AuthContext);
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
        contactPerson: initialData.contactPerson || '',
        location: initialData.location || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        college: initialData.college || '',
        section: initialData.section || '',
        email: initialData.email || '',
        internshipEmail: initialData.internshipEmail || '',
        midtermsKey: initialData.midtermsKey || '',
        finalsKey: initialData.finalsKey || '',
        concerns: initialData.concerns || '',
        solutions: initialData.solutions || '',
        recommendations: initialData.recommendations || '',
        evaluation: initialData.evaluation || '',
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
  const [userCollege, setUserCollege] = useState('');

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

  // Fetch user's college information from Firestore
  useEffect(() => {
    const fetchUserCollege = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserCollege(userData.college || '');
          }
        } catch (error) {
          console.error('Error fetching user college:', error);
        }
      }
    };

    fetchUserCollege();
  }, [currentUser]);

  // Update available programs based on user's college
  useEffect(() => {
    if (userRole === 'admin') {
      // For admin, get all programs from all colleges
      const allPrograms = Object.values(collegePrograms).flat();
      setAvailablePrograms(allPrograms);
    } else if (userCollege) {
      // For instructors, get programs specific to their college
      const programs = collegePrograms[userCollege] || [];
      setAvailablePrograms(programs);
    }
  }, [userRole, userCollege]);

  // Update formData.college when userCollege changes
  useEffect(() => {
    if (userCollege && !isEditing) {
      setFormData(prevData => {
        const newStudent = new Student(prevData.toJSON());
        newStudent.update('college', userCollege);
        return newStudent;
      });
    }
  }, [userCollege, isEditing]);

  // Generate access keys when component mounts, but only for new students
  useEffect(() => {
    if (!isEditing) {
      const midtermsKey = generateAccessKey();
      const finalsKey = generateAccessKey();
      
      setFormData(prevData => {
        const newStudent = new Student(prevData.toJSON());
        newStudent.update('midtermsKey', midtermsKey);
        newStudent.update('finalsKey', finalsKey);
        return newStudent;
      });
    }
  }, [isEditing]);

  // Function to regenerate keys
  const handleRegenerateKey = (keyType) => {
    const newKey = generateAccessKey();
    setFormData(prevData => {
      const newStudent = new Student(prevData.toJSON());
      newStudent.update(keyType, newKey);
      return newStudent;
    });
  };

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
        section: userData.section || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        createdAt: isEditing ? formData.createdAt : new Date().toISOString(),
        createdBy: isEditing ? formData.createdBy : auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      };

      if (isEditing && docId) {
        await addStudent(studentData);
      } else {
        const docRef = await addDoc(collection(db, 'studentData'), studentData);
        
        // Add student to the Sections collection if instructor has a section
        if (userData.section) {
          try {
            // First ensure the section document exists
            const sectionRef = doc(db, 'sections', userData.section);
            const sectionDoc = await getDoc(sectionRef);
            
            if (!sectionDoc.exists()) {
              // Create the section document if it doesn't exist
              await setDoc(sectionRef, {
                sectionName: userData.section,
                college: userData.college,
                instructorId: auth.currentUser.uid,
                instructorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                semester: studentData.semester || '',
                schoolYear: studentData.schoolYear || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: auth.currentUser.uid,
                updatedBy: auth.currentUser.uid
              });
            }
            
            // Add the student to the section's students subcollection
            const studentRef = doc(sectionRef, 'students', docRef.id);
            await setDoc(studentRef, {
              studentName: studentData.name,
              studentId: docRef.id,
              program: studentData.program || '',
              semester: studentData.semester || '',
              schoolYear: studentData.schoolYear || '',
              partnerCompany: studentData.partnerCompany || '',
              contactPerson: studentData.contactPerson || '',
              location: studentData.location || '',
              gender: studentData.gender || '',
              startDate: studentData.startDate || '',
              endDate: studentData.endDate || '',
              concerns: studentData.concerns || '',
              solutions: studentData.solutions || '',
              recommendations: studentData.recommendations || '',
              evaluation: studentData.evaluation || '',
              middleInitial: studentData.middleInitial || '',
              section: studentData.section || '',
              email: studentData.email || '',
              internshipEmail: studentData.internshipEmail || '',
              college: studentData.college || '',
              midtermsKey: studentData.midtermsKey || '',
              finalsKey: studentData.finalsKey || '',
              addedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              addedBy: auth.currentUser.uid
            });
          } catch (sectionError) {
            console.error('Error adding to section collection:', sectionError);
            // Don't throw the error to prevent blocking the main form submission
          }
        }
        
        // Add student to the Companies collection
        if (studentData.partnerCompany) {
          try {
            // Sanitize company name for use as document ID
            const companyId = studentData.partnerCompany.trim()
              .replace(/[^\w\s]/g, '')  // Remove special chars
              .replace(/\s+/g, '_')     // Replace spaces with underscores
              .toLowerCase();
            
            if (companyId) {
              // Ensure company document exists
              const companyRef = doc(db, 'companies', companyId);
              const companyDoc = await getDoc(companyRef);
              
              if (!companyDoc.exists()) {
                // Create company document if it doesn't exist
                await setDoc(companyRef, {
                  companyName: studentData.partnerCompany,
                  normalizedName: companyId,
                  studentCount: 0,
                  semester: studentData.semester || '',
                  schoolYear: studentData.schoolYear || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: auth.currentUser.uid,
                  updatedBy: auth.currentUser.uid
                });
              }
              
              // Add student to company's students subcollection
              const studentRef = doc(companyRef, 'students', docRef.id);
              await setDoc(studentRef, {
                studentName: studentData.name,
                studentId: docRef.id,
                program: studentData.program || '',
                semester: studentData.semester || '',
                schoolYear: studentData.schoolYear || '',
                partnerCompany: studentData.partnerCompany || '',
                contactPerson: studentData.contactPerson || '',
                location: studentData.location || '',
                gender: studentData.gender || '',
                startDate: studentData.startDate || '',
                endDate: studentData.endDate || '',
                concerns: studentData.concerns || '',
                solutions: studentData.solutions || '',
                recommendations: studentData.recommendations || '',
                evaluation: studentData.evaluation || '',
                middleInitial: studentData.middleInitial || '',
                section: studentData.section || '',
                email: studentData.email || '',
                internshipEmail: studentData.internshipEmail || '',
                college: studentData.college || '',
                midtermsKey: studentData.midtermsKey || '',
                finalsKey: studentData.finalsKey || '',
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                addedBy: auth.currentUser.uid
              });
            }
          } catch (companyError) {
            console.error('Error adding to company collection:', companyError);
            // Don't throw the error to prevent blocking the main form submission
          }
        }
        
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

        if (!disableSnackbar) {
          setSnackbarMessage(isEditing ? 'Student updated successfully' : 'Student added successfully');
          setSnackbarSeverity('success');
          setOpenSnackbar(true);
        }
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
      {isSubmitting && (
        <LoadingOverlay>
          <CircularProgress size={60} sx={{ color: maroon, mb: 2 }} />
          <Typography variant="h6" color={maroon} fontWeight="medium">
            Saving Student Data...
          </Typography>
        </LoadingOverlay>
      )}
      <FormHeader>
        <Typography variant="h5" align="center" fontWeight="bold" sx={{ letterSpacing: '0.5px' }}>
          Student Internship Program Form
        </Typography>
      </FormHeader>
      
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        px: { xs: 2, sm: 3, md: 4 }, 
        pt: 3, 
        pb: 4,
        backgroundColor: '#fafafa'
      }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Basic Information Row - Personal and Academic side by side */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <SectionWrapper>
                <SectionTitle>
                  <Person /> Personal Information
                </SectionTitle>
                
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={7}>
                    <StyledTextField
                      required
                      fullWidth
                      label="Family Name"
                      name="familyName"
                      value={nameFields.familyName}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: '10px' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <StyledFormControl required fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        label="Gender"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '10px',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                            },
                          },
                        }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </StyledFormControl>
                  </Grid>
                  
                  <Grid item xs={8} sm={8}>
                    <StyledTextField
                      required
                      fullWidth
                      label="Given Name"
                      name="givenName"
                      value={nameFields.givenName}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={4} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="M.I."
                      name="middleInitial"
                      value={nameFields.middleInitial}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      type="email"
                      InputProps={{
                        startAdornment: <ContactMail sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </SectionWrapper>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionWrapper>
                <SectionTitle>
                  <School /> Academic Information
                </SectionTitle>
                
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <StyledAutocomplete
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
                          variant="outlined"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledFormControl required fullWidth>
                      <InputLabel>Semester</InputLabel>
                      <Select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        label="Semester"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '10px',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                            },
                          },
                        }}
                      >
                        <MenuItem value="First">First</MenuItem>
                        <MenuItem value="Second">Second</MenuItem>
                        <MenuItem value="Summer">Summer</MenuItem>
                      </Select>
                    </StyledFormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledFormControl required fullWidth>
                      <InputLabel>School Year</InputLabel>
                      <Select
                        name="schoolYear"
                        value={formData.schoolYear}
                        onChange={handleChange}
                        label="School Year"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '10px',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                            },
                          },
                        }}
                      >
                        {['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029'].map((year) => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </StyledFormControl>
                  </Grid>
                </Grid>
              </SectionWrapper>
            </Grid>
          </Grid>
          
          {/* Internship Information Row - Spans full width */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <SectionWrapper>
                <SectionTitle>
                  <Business /> Internship Information
                </SectionTitle>
                
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <StyledTextField
                      required
                      fullWidth
                      label="Partner Company"
                      name="partnerCompany"
                      value={formData.partnerCompany}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Business sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <StyledTextField
                      fullWidth
                      label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <ContactMail sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <StyledTextField
                      required
                      fullWidth
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Internship Email Address"
                      name="internshipEmail"
                      value={formData.internshipEmail}
                      onChange={handleChange}
                      variant="outlined"
                      type="email"
                      InputProps={{
                        startAdornment: <ContactMail sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Start Date"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <DateRange sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="End Date"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <DateRange sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                      }}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Midterms Access Key"
                      name="midtermsKey"
                      value={formData.midtermsKey}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <VpnKey sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              onClick={() => handleRegenerateKey('midtermsKey')}
                              edge="end"
                              size="small"
                              sx={{ color: maroon }}
                              title="Regenerate key"
                            >
                              <Refresh />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Finals Access Key"
                      name="finalsKey"
                      value={formData.finalsKey}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <VpnKey sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              onClick={() => handleRegenerateKey('finalsKey')}
                              edge="end"
                              size="small"
                              sx={{ color: maroon }}
                              title="Regenerate key"
                            >
                              <Refresh />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </SectionWrapper>
            </Grid>
          </Grid>

          <Box sx={{ 
            mt: 'auto', 
            maxWidth: { xs: '100%', sm: '300px', md: '320px' }, 
            mx: 'auto',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '-20%',
              right: '-20%',
              height: '1px',
              background: 'rgba(0,0,0,0.05)',
              zIndex: -1
            }
          }}>
            <SubmitButton 
              type="submit" 
              variant="contained" 
              fullWidth 
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : (isEditing ? <Edit /> : <Add />)}
            >
              {isSubmitting 
                ? 'Saving...' 
                : (isEditing ? 'Update Student' : 'Add Student')
              }
            </SubmitButton>
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
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
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
