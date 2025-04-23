import React, { useState, useEffect, useRef, useContext } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Box, Grid, FormControl, InputLabel, Select, MenuItem, Card, Collapse, Button, Dialog, DialogTitle,DialogContent, DialogActions, IconButton as MuiIconButton, Snackbar, Alert, Pagination, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, RadioGroup, Radio, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { db, auth } from '../../firebase-config';
import { collection, deleteDoc, doc, query, onSnapshot, updateDoc, where, setDoc, getDoc } from 'firebase/firestore';
import StudentForm from './StudentForm';
import { AuthContext } from '../../context/AuthContext';
import exportManager from '../../utils/ExportManager';
import exportKeysManager from '../../utils/ExportKeysManager';
import GetAppIcon from '@mui/icons-material/GetApp';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Utility function to convert program names to acronyms
const getProgramAcronym = (program) => {
  if (!program) return '';
  
  // Common degree prefixes
  const prefixes = ['BS', 'Bachelor of Science in', 'Bachelor of Science', 'Bachelor of', 'Master of', 'MS', 'BA', 'Bachelor of Arts in', 'Bachelor of Arts'];
  
  // Program name mappings
  const programMappings = {
    'Information Technology': 'IT',
    'Computer Science': 'CS',
    'Information Systems': 'IS',
    'Computer Engineering': 'CpE',
    'Civil Engineering': 'CE',
    'Electrical Engineering': 'EE',
    'Mechanical Engineering': 'ME',
    'Industrial Engineering': 'IE',
    'Chemical Engineering': 'ChE',
    'Business Administration': 'BA',
    'Accountancy': 'BSA',
    'Accounting': 'BSA',
    'Management Accounting': 'MA',
    'Electronics Engineering': 'ECE',
    'Electronics and Communication Engineering': 'ECE',
    'Tourism Management': 'TM',
    'Hotel and Restaurant Management': 'HRM',
    'Education': 'BEd',
    'Psychology': 'Psych',
    'Architecture': 'Arch',
    'Nursing': 'BSN',
    'Medical Technology': 'MT',
    'Physical Therapy': 'PT',
    'Pharmacy': 'Pharm',
    'Public Health': 'PH',
    'Criminal Justice': 'CJ',
    'Criminology': 'Crim',
    'Environmental Science': 'EnviSci'
  };

  // Clean the program name
  let cleanProgram = program.trim();
  let hasPrefix = false;
  let prefixUsed = '';
  
  // Remove prefix if it exists
  for (const prefix of prefixes) {
    if (cleanProgram.startsWith(prefix)) {
      cleanProgram = cleanProgram.replace(prefix, '').trim();
      hasPrefix = true;
      prefixUsed = prefix;
      break;
    }
  }
  
  // Check if we have a direct mapping
  for (const [fullName, acronym] of Object.entries(programMappings)) {
    if (cleanProgram.includes(fullName)) {
      // If we already detected a prefix like BS, BA, MS and the acronym doesn't already include it
      if (hasPrefix) {
        if (prefixUsed === 'BS' && !acronym.startsWith('BS')) {
          return 'BS' + acronym;
        } else if (prefixUsed === 'BA' && !acronym.startsWith('BA')) {
          return 'BA' + acronym;
        } else if (prefixUsed === 'MS' && !acronym.startsWith('MS')) {
          return 'MS' + acronym;
        }
      }
      return acronym;
    }
  }
  
  // If no mapping was found, create an acronym from the first letters of each word
  if (cleanProgram.length > 15) {
    const wordAcronym = cleanProgram
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
      
    if (hasPrefix) {
      if (prefixUsed === 'BS') {
        return 'BS' + wordAcronym;
      } else if (prefixUsed === 'BA') {
        return 'BA' + wordAcronym;
      } else if (prefixUsed === 'MS') {
        return 'MS' + wordAcronym;
      }
    }
    return wordAcronym;
  }
  
  // If the program name is short enough, just return it as is with appropriate prefix
  if (hasPrefix) {
    if (prefixUsed === 'BS') {
      return 'BS' + cleanProgram;
    } else if (prefixUsed === 'BA') {
      return 'BA' + cleanProgram;
    } else if (prefixUsed === 'MS') {
      return 'MS' + cleanProgram;
    }
  }
  return cleanProgram;
};

class StudentManager {
  constructor(currentUser) {
    this._students = [];
    this._subscribers = new Set();
    this._filters = {
      program: 'All',
      semester: 'All',
      schoolYear: 'All',
      company: 'All',
      section: 'All'
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
  get sections() { return ['All', ...new Set(this._students.map(student => student.section).filter(Boolean))]; }

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
      if (this._filters.section !== 'All' && student.section !== this._filters.section) return false;
      return true;
    });
  }

  async ensureSectionExists() {
    try {
      if (!this._currentUser?.profile?.section) return;

      const sectionRef = doc(db, 'sections', this._currentUser.profile.section);
      const sectionDoc = await getDoc(sectionRef);

      if (!sectionDoc.exists()) {
        await setDoc(sectionRef, {
          sectionName: this._currentUser.profile.section,
          college: this._currentUser.profile.college,
          instructorId: auth.currentUser?.uid,
          instructorName: `${this._currentUser.profile.firstName} ${this._currentUser.profile.lastName}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid,
          updatedBy: auth.currentUser?.uid
        });
      }
    } catch (error) {
      console.error('Error ensuring section exists:', error);
      // Don't throw error to prevent blocking main operation
    }
  }

  async addToSectionCollection(studentData, studentId) {
    try {
      if (!this._currentUser?.profile?.section) return;

      // Ensure section document exists
      await this.ensureSectionExists();

      const sectionRef = doc(db, 'sections', this._currentUser.profile.section);
      const studentRef = doc(sectionRef, 'students', studentId);

      await setDoc(studentRef, {
        studentName: studentData.name,
        studentId: studentId,
        program: studentData.program || '',
        semester: studentData.semester || '',
        schoolYear: studentData.schoolYear || '',
        partnerCompany: studentData.partnerCompany || '',
        contactPerson: studentData.contactPerson || '',
        location: studentData.location || '',
        gender: studentData.gender || '',
        startDate: studentData.startDate || '',
        endDate: studentData.endDate || '',
        midtermsKey: studentData.midtermsKey || '',
        finalsKey: studentData.finalsKey || '',
        email: studentData.email || '',
        internshipEmail: studentData.internshipEmail || '',
        college: studentData.college || '',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        addedBy: auth.currentUser?.uid
      });
    } catch (error) {
      console.error('Error adding to section collection:', error);
      // Don't throw error to prevent blocking main operation
    }
  }

  async removeFromSectionCollection(studentId) {
    try {
      if (!this._currentUser?.profile?.section) return;

      const sectionRef = doc(db, 'sections', this._currentUser.profile.section);
      const studentRef = doc(sectionRef, 'students', studentId);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error('Error removing from section collection:', error);
      // Don't throw error to prevent blocking main operation
    }
  }

  async addToCompanyCollection(studentData, studentId) {
    try {
      if (!studentData?.partnerCompany) return;
      
      // Sanitize company name for use as document ID
      const companyId = studentData.partnerCompany.trim()
        .replace(/[^\w\s]/g, '')  // Remove special chars
        .replace(/\s+/g, '_')     // Replace spaces with underscores
        .toLowerCase();
      
      if (!companyId) return;
      
      // Ensure company document exists
      await this.ensureCompanyExists(companyId, studentData.partnerCompany);
      
      // Add student to company's students subcollection
      const companyRef = doc(db, 'companies', companyId);
      const studentRef = doc(companyRef, 'students', studentId);
      
      await setDoc(studentRef, {
        studentName: studentData.name,
        studentId: studentId,
        program: studentData.program || '',
        section: studentData.section || '',
        college: studentData.college || '',
        contactPerson: studentData.contactPerson || '',
        startDate: studentData.startDate || '',
        endDate: studentData.endDate || '',
        midtermsKey: studentData.midtermsKey || '',
        finalsKey: studentData.finalsKey || '',
        addedAt: new Date().toISOString(),
        addedBy: auth.currentUser?.uid
      });
    } catch (error) {
      console.error('Error adding to company collection:', error);
      // Don't throw error to prevent blocking main operation
    }
  }
  
  async ensureCompanyExists(companyId, companyName) {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        // Create company document
        await setDoc(companyRef, {
          companyName: companyName,
          normalizedName: companyId,
          studentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid,
          updatedBy: auth.currentUser?.uid
        });
      }
    } catch (error) {
      console.error('Error ensuring company exists:', error);
      // Don't throw error to prevent blocking main operation
    }
  }
  
  async removeFromCompanyCollection(studentId, companyName) {
    try {
      if (!companyName) return;
      
      // Sanitize company name for use as document ID
      const companyId = companyName.trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      
      if (!companyId) return;
      
      const companyRef = doc(db, 'companies', companyId);
      const studentRef = doc(companyRef, 'students', studentId);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error('Error removing from company collection:', error);
      // Don't throw error to prevent blocking main operation
    }
  }

  async updateStudent(studentId, updatedData) {
    try {
      const originalDoc = await getDoc(doc(db, 'studentData', studentId));
      if (!originalDoc.exists()) {
        throw new Error('Student not found');
      }

      const originalData = originalDoc.data();
      const oldSection = originalData.section || '';
      const oldCompanyName = originalData.partnerCompany || '';

      // Prepare final updated data
      const finalUpdatedData = {
        ...originalData,
        ...updatedData,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      };

      // 1. Update the main student document
      await updateDoc(doc(db, 'studentData', studentId), finalUpdatedData);

      // 2. Update data in sections collection
      if (oldSection !== finalUpdatedData.section || oldCompanyName !== finalUpdatedData.partnerCompany) {
        // If section changed, update the section records
        if (oldSection !== finalUpdatedData.section) {
          // Remove from old section if it exists
          if (oldSection) {
            await this.removeFromSectionCollection(studentId);
          }
          
          // Add to new section if specified
          if (finalUpdatedData.section) {
            await this.addToSectionCollection(finalUpdatedData, studentId);
          }
        } else {
          // Section didn't change, but other data might have, so update in the current section
          if (finalUpdatedData.section) {
            try {
              const sectionRef = doc(db, 'sections', finalUpdatedData.section);
              const studentRef = doc(sectionRef, 'students', studentId);
              
              await updateDoc(studentRef, {
                studentName: finalUpdatedData.name,
                program: finalUpdatedData.program || '',
                semester: finalUpdatedData.semester || '',
                schoolYear: finalUpdatedData.schoolYear || '',
                partnerCompany: finalUpdatedData.partnerCompany || '',
                contactPerson: finalUpdatedData.contactPerson || '',
                location: finalUpdatedData.location || '',
                gender: finalUpdatedData.gender || '',
                startDate: finalUpdatedData.startDate || '',
                endDate: finalUpdatedData.endDate || '',
                concerns: finalUpdatedData.concerns || '',
                solutions: finalUpdatedData.solutions || '',
                recommendations: finalUpdatedData.recommendations || '',
                evaluation: finalUpdatedData.evaluation || '',
                middleInitial: finalUpdatedData.middleInitial || '',
                section: finalUpdatedData.section || '',
                email: finalUpdatedData.email || '',
                internshipEmail: finalUpdatedData.internshipEmail || '',
                college: finalUpdatedData.college || '',
                midtermsKey: finalUpdatedData.midtermsKey || '',
                finalsKey: finalUpdatedData.finalsKey || '',
                updatedAt: new Date().toISOString()
              });
            } catch (error) {
              console.error('Error updating section collection:', error);
            }
          }
        }
      }

      // 3. Update company collection
      if (oldCompanyName !== finalUpdatedData.partnerCompany) {
        // Remove from old company if it exists
        if (oldCompanyName) {
          await this.removeFromCompanyCollection(studentId, oldCompanyName);
        }
        
        // Add to new company if specified
        if (finalUpdatedData.partnerCompany) {
          await this.addToCompanyCollection(finalUpdatedData, studentId);
        }
      } else {
        // Company didn't change, but other data might have, so update in the current company
        if (finalUpdatedData.partnerCompany) {
          try {
            const companyId = finalUpdatedData.partnerCompany.trim()
              .replace(/[^\w\s]/g, '')
              .replace(/\s+/g, '_')
              .toLowerCase();
            
            if (companyId) {
              const companyRef = doc(db, 'companies', companyId);
              const studentRef = doc(companyRef, 'students', studentId);
              
              await updateDoc(studentRef, {
                studentName: finalUpdatedData.name,
                program: finalUpdatedData.program || '',
                semester: finalUpdatedData.semester || '',
                schoolYear: finalUpdatedData.schoolYear || '',
                partnerCompany: finalUpdatedData.partnerCompany || '',
                contactPerson: finalUpdatedData.contactPerson || '',
                location: finalUpdatedData.location || '',
                gender: finalUpdatedData.gender || '',
                startDate: finalUpdatedData.startDate || '',
                endDate: finalUpdatedData.endDate || '',
                concerns: finalUpdatedData.concerns || '',
                solutions: finalUpdatedData.solutions || '',
                recommendations: finalUpdatedData.recommendations || '',
                evaluation: finalUpdatedData.evaluation || '',
                middleInitial: finalUpdatedData.middleInitial || '',
                section: finalUpdatedData.section || '',
                email: finalUpdatedData.email || '',
                internshipEmail: finalUpdatedData.internshipEmail || '',
                college: finalUpdatedData.college || '',
                midtermsKey: finalUpdatedData.midtermsKey || '',
                finalsKey: finalUpdatedData.finalsKey || '',
                updatedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Error updating company collection:', error);
          }
        }
      }

      // Update local data
      this._students = this._students.map(student => 
        student.id === studentId ? { ...student, ...finalUpdatedData } : student
      );
      
      // Notify subscribers of the change
      this._notifySubscribers();
      
      return finalUpdatedData;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(studentId) {
    try {
      // Get student data before deleting
      const studentDoc = await getDoc(doc(db, 'studentData', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }
      
      const studentData = studentDoc.data();
      
      // Begin deletion process
      // 1. Delete from main studentData collection
      await deleteDoc(doc(db, 'studentData', studentId));
      
      // 2. Remove from section collection
      try {
        if (studentData.section) {
          await this.removeFromSectionCollection(studentId);
        }
      } catch (sectionError) {
        console.error("Error removing from section collection:", sectionError);
        // Don't throw to continue with other deletions
      }
      
      // 3. Remove from company collection
      try {
        if (studentData.partnerCompany) {
          await this.removeFromCompanyCollection(studentId, studentData.partnerCompany);
        }
      } catch (companyError) {
        console.error("Error removing from company collection:", companyError);
        // Don't throw to continue with other deletions
      }
      
      // Update local data
      this._students = this._students.filter(student => student.id !== studentId);
      
      // Notify subscribers of the change
      this._notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
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
      // If instructor has a section, filter by both college and section
      if (this._currentUser.profile.section && this._currentUser.profile.section.trim() !== '') {
        console.log(`Filtering students by section: ${this._currentUser.profile.section}`);
        q = query(
          collection(db, 'studentData'),
          where('college', '==', this._currentUser.profile.college),
          where('section', '==', this._currentUser.profile.section)
        );
      } else {
        // If instructor has no section, just filter by college
        console.log('Instructor has no section, filtering by college only');
        q = query(
          collection(db, 'studentData'),
          where('college', '==', this._currentUser.profile.college)
        );
      }
    } else {
      // For admin, fetch all students
      console.log('Admin user, fetching all students');
      q = query(collection(db, 'studentData'));
    }

    return onSnapshot(q, 
      (querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Fetched ${studentsList.length} students`);
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

  // Method to refresh data when section changes
  refreshDataOnSectionChange(newCurrentUser) {
    console.log('Refreshing data based on section change');
    
    // Update the current user reference
    this._currentUser = newCurrentUser;
    
    // Re-initialize data fetching with new section
    const unsubscribe = this.initializeDataFetching();
    
    // Return unsubscribe function
    return unsubscribe;
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
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [keyExportDialogOpen, setKeyExportDialogOpen] = useState(false);
  const [keyExportType, setKeyExportType] = useState('midterms');

  // Toggle visibility of access keys
  const toggleKeyVisibility = (studentId, keyType) => {
    setVisibleKeys(prev => ({
      ...prev,
      [`${studentId}_${keyType}`]: !prev[`${studentId}_${keyType}`]
    }));
  };

  // Copy access key to clipboard
  const copyKeyToClipboard = (event, studentId, keyType, keyValue) => {
    event.stopPropagation(); // Prevent toggling visibility when clicking copy button
    
    if (!keyValue) return; // Don't copy if key is not set
    
    navigator.clipboard.writeText(keyValue).then(() => {
      setCopiedKey(`${studentId}_${keyType}`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
      
      // Show a snackbar message
      setSnackbarMessage(`${keyType === 'midterms' ? 'Midterms' : 'Finals'} key copied to clipboard`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    }).catch(err => {
      console.error('Failed to copy key: ', err);
      setSnackbarMessage('Failed to copy key');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    });
  };

  // Debug log for currentUser
  useEffect(() => {
    console.log('StudentList component - Current user:', currentUser);
  }, [currentUser]);

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

  // Ensure data is refreshed when component mounts or when currentUser changes
  useEffect(() => {
    if (studentManager && currentUser) {
      console.log('Refreshing data on component mount or when currentUser changes');
      studentManager.refreshDataOnSectionChange(currentUser);
    }
  }, [currentUser, studentManager]);

  // Original effect to refresh when section changes
  useEffect(() => {
    if (studentManager && currentUser?.profile?.section !== undefined) {
      console.log('Section detected in user profile:', currentUser.profile.section);
      studentManager.refreshDataOnSectionChange(currentUser);
    }
  }, [currentUser?.profile?.section, studentManager, currentUser]);

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
      contactPerson: student.contactPerson || '',
      location: student.location || '',
      startDate: student.startDate || '',
      endDate: student.endDate || '',
      concerns: student.concerns || '',
      solutions: student.solutions || '',
      recommendations: student.recommendations || '',
      evaluation: student.evaluation || '',
      // For admin users, preserve the student's original values
      college: userRole === 'admin' ? (student.college || '') : (currentUser?.profile?.college || ''),
      section: userRole === 'admin' ? (student.section || '') : (currentUser?.profile?.section || ''),
      midtermsKey: student.midtermsKey || '',
      finalsKey: student.finalsKey || '',
      email: student.email || '',
      internshipEmail: student.internshipEmail || '',
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
        // For admin, preserve the student's original section rather than setting admin's section
        section: userRole === 'admin' ? (editingStudent.section || '') : (currentUser?.profile?.section || ''),
        college: userRole === 'admin' ? (editingStudent.college || '') : (currentUser?.profile?.college || ''),
        concerns: updatedData.concerns || '',
        solutions: updatedData.solutions || '',
        recommendations: updatedData.recommendations || '',
        evaluation: updatedData.evaluation || '',
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
      student.contactPerson?.toLowerCase().includes(query) ||
      student.location?.toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
    setPage(1); // Reset to first page when searching
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

  const handleKeyExportClick = () => {
    setExportDialogOpen(false);
    setKeyExportDialogOpen(true);
  };

  const handleCloseKeyExportDialog = () => {
    setKeyExportDialogOpen(false);
  };

  const handleExportKeys = () => {
    exportKeysManager.exportKeysToExcel(
      filteredStudents,
      keyExportType,
      keyExportType === 'midterms' ? 'midterms_keys.xlsx' : 'finals_keys.xlsx'
    );
    setKeyExportDialogOpen(false);
  };

  const handleKeyExportTypeChange = (event) => {
    setKeyExportType(event.target.value);
  };

  const handleExportStudents = () => {
    exportManager.exportStudentsToExcel(
      filteredStudents, 
      userRole, 
      'student_interns.xlsx', 
      'Cebu Institute of Technology - University', // HEI name
      'N. Bacalso Avenue, Cebu City', // HEI address
      '2023-2024' // Academic year
    );
    setExportDialogOpen(false);
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
              
              {currentUser?.profile?.section && (
                <Chip 
                  label={`Section: ${currentUser.profile.section}`}
                  size="small"
                  sx={{ 
                    ml: 1,
                    bgcolor: 'rgba(128, 0, 0, 0.1)',
                    color: '#800000',
                    fontWeight: 'medium',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
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

            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExportClick}
              startIcon={<GetAppIcon />}
              sx={{ 
                background: 'linear-gradient(45deg, #800000, #FFD700)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #600000, #DFB700)'
                },
                minWidth: 'fit-content',
                whiteSpace: 'nowrap'
              }}
            >
              Export
            </Button>
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
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Program</InputLabel>
                <Select
                  value={studentManager.filters.program}
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                  label="Program"
                >
                  {studentManager.programs.map(program => (
                    <MenuItem key={program} value={program}>
                      {program !== 'All' ? `${getProgramAcronym(program)} - ${program}` : program}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={3}>
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
            <Grid item xs={12} sm={6} md={3} lg={3}>
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
            <Grid item xs={12} sm={6} md={3} lg={3}>
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
                width: '10%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                position: 'sticky',
                left: 0,
                zIndex: 3,
                boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
              }}>Midterms Key</TableCell>
              <TableCell sx={{ 
                width: '10%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Finals Key</TableCell>
              <TableCell sx={{ 
                width: '12%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Name</TableCell>
              <TableCell sx={{ 
                width: '11%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Program</TableCell>
              <TableCell sx={{ 
                width: '5%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Gender</TableCell>
              <TableCell sx={{ 
                width: '13%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Company</TableCell>
              <TableCell sx={{ 
                width: '12%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Contact Person</TableCell>
              <TableCell sx={{ 
                width: '11%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Location</TableCell>
              <TableCell sx={{ 
                width: '8%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>Start Date</TableCell>
              <TableCell sx={{ 
                width: '8%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}>End Date</TableCell>
              <TableCell sx={{ 
                width: '8%',
                fontWeight: 'bold',
                color: '#800000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                position: 'sticky',
                right: 0,
                zIndex: 3,
                boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <TableRow 
                  key={student.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(128, 0, 0, 0.04)',
                    },
                    height: '60px',
                    transition: 'background-color 0.2s ease',
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
                    },
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'inherit',
                    zIndex: 2,
                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleKeyVisibility(student.id, 'midterms')}
                    >
                      {visibleKeys[`${student.id}_midterms`] ? (
                        <>
                          <span className="content">{student.midtermsKey || 'Not set'}</span>
                          <VisibilityIcon fontSize="small" sx={{ ml: 1, color: '#800000' }} />
                          {student.midtermsKey && (
                            <Tooltip title="Copy key">
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  ml: 0.5, 
                                  color: copiedKey === `${student.id}_midterms` ? 'success.main' : '#800000',
                                }}
                                onClick={(e) => copyKeyToClipboard(e, student.id, 'midterms', student.midtermsKey)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="content">••••••</span>
                          <VisibilityOffIcon fontSize="small" sx={{ ml: 1, color: '#800000' }} />
                        </>
                      )}
                    </Box>
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
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleKeyVisibility(student.id, 'finals')}
                    >
                      {visibleKeys[`${student.id}_finals`] ? (
                        <>
                          <span className="content">{student.finalsKey || 'Not set'}</span>
                          <VisibilityIcon fontSize="small" sx={{ ml: 1, color: '#800000' }} />
                          {student.finalsKey && (
                            <Tooltip title="Copy key">
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  ml: 0.5, 
                                  color: copiedKey === `${student.id}_finals` ? 'success.main' : '#800000',
                                }}
                                onClick={(e) => copyKeyToClipboard(e, student.id, 'finals', student.finalsKey)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="content">••••••</span>
                          <VisibilityOffIcon fontSize="small" sx={{ ml: 1, color: '#800000' }} />
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '16px',
                    '& .content': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      maxWidth: '100%',
                      fontWeight: 'medium',
                    }
                  }}>
                    <Tooltip title={student.name} placement="top" arrow>
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
                    <Tooltip title={student.program} placement="top" arrow>
                      <span className="content">{getProgramAcronym(student.program)}</span>
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
                    <Chip
                      label={student.gender === 'Male' ? 'M' : 'F'}
                      size="small"
                      sx={{
                        backgroundColor: student.gender === 'Male' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(233, 30, 99, 0.1)',
                        color: student.gender === 'Male' ? '#1976d2' : '#e91e63',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        width: '24px',
                        minWidth: 'unset',
                        '& .MuiChip-label': {
                          padding: '0 4px'
                        }
                      }}
                    />
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
                    <Tooltip title={student.partnerCompany} placement="top" arrow>
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
                    <Tooltip title={student.contactPerson || 'N/A'} placement="top" arrow>
                      <span className="content">{student.contactPerson || 'N/A'}</span>
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
                    <Tooltip title={student.location} placement="top" arrow>
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
                    {student.startDate ? (
                      <Chip
                        label={new Date(student.startDate).toLocaleDateString()}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          color: '#388e3c',
                          fontWeight: 'medium',
                          fontSize: '0.75rem',
                        }}
                      />
                    ) : (
                      <Chip
                        label="Not set"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(158, 158, 158, 0.1)',
                          color: '#757575',
                          fontWeight: 'medium',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
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
                    {student.endDate ? (
                      <Chip
                        label={new Date(student.endDate).toLocaleDateString()}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          color: '#d32f2f',
                          fontWeight: 'medium',
                          fontSize: '0.75rem',
                        }}
                      />
                    ) : (
                      <Chip
                        label="Not set"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(158, 158, 158, 0.1)',
                          color: '#757575',
                          fontWeight: 'medium',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      padding: '16px',
                      position: 'sticky',
                      right: 0,
                      backgroundColor: 'inherit',
                      zIndex: 2,
                      boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Edit student" arrow>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(student)}
                          sx={{ 
                            color: '#FFD700',
                            backgroundColor: 'rgba(128, 0, 0, 0.8)',
                            '&:hover': { 
                              backgroundColor: '#800000',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete student" arrow>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(student)}
                          sx={{ 
                            color: 'white',
                            backgroundColor: 'rgba(211, 47, 47, 0.8)',
                            '&:hover': { 
                              backgroundColor: '#b71c1c',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <PeopleAltIcon sx={{ fontSize: 48, color: 'rgba(128, 0, 0, 0.3)' }} />
                    <Typography variant="h6" color="text.secondary">
                      No students found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or search criteria
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
          Showing {paginatedStudents.length} of {filteredStudents.length} total entries
        </Typography>
        
        <Pagination
          count={Math.ceil(filteredStudents.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
          sx={{
            '& .MuiPaginationItem-root': {
              color: '#800000',
              '&.Mui-selected': {
                backgroundColor: '#800000',
                color: 'white',
                fontWeight: 'bold',
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
        
        <FormControl 
          variant="outlined" 
          size="small" 
          sx={{ 
            minWidth: 120,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: '#800000',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#800000',
              },
            }
          }}
        >
          <InputLabel id="rows-per-page-label">Rows</InputLabel>
          <Select
            labelId="rows-per-page-label"
            value={rowsPerPage}
            label="Rows"
            onChange={(e) => {
              setPage(1);
            }}
          >
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
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

      {/* Export Options Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #eee',
          color: '#800000',
          fontWeight: 'bold'
        }}>
          Select Export Format
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 0 }}>
          <List>
            {userRole === 'admin' && (
              <>
                <ListItem 
                  button 
                  onClick={handleExportStudents}
                  sx={{ 
                    py: 2,
                    '&:hover': { bgcolor: 'rgba(128, 0, 0, 0.04)' }
                  }}
                >
                  <ListItemIcon>
                    <AssignmentIcon sx={{ color: '#800000' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Standard CHED Report" 
                    secondary="Exports student information in CHED format"
                  />
                </ListItem>
                <Divider />
              </>
            )}
            <ListItem 
              button 
              onClick={handleKeyExportClick}
              sx={{ 
                py: 2,
                '&:hover': { bgcolor: 'rgba(128, 0, 0, 0.04)' }
              }}
            >
              <ListItemIcon>
                <VpnKeyIcon sx={{ color: '#800000' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Student Keys Table" 
                secondary="Exports the table with student keys"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleCloseExportDialog}
            sx={{ 
              color: '#666',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Key Export Options Dialog */}
      <Dialog
        open={keyExportDialogOpen}
        onClose={handleCloseKeyExportDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #eee',
          color: '#800000',
          fontWeight: 'bold'
        }}>
          Select Keys to Export
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose which student keys you would like to export:
          </Typography>
          <RadioGroup
            value={keyExportType}
            onChange={handleKeyExportTypeChange}
          >
            <FormControlLabel 
              value="midterms" 
              control={
                <Radio 
                  sx={{
                    color: '#800000',
                    '&.Mui-checked': {
                      color: '#800000',
                    },
                  }}
                />
              } 
              label="Midterms Keys Only" 
            />
            <FormControlLabel 
              value="finals" 
              control={
                <Radio 
                  sx={{
                    color: '#800000',
                    '&.Mui-checked': {
                      color: '#800000',
                    },
                  }}
                />
              } 
              label="Finals Keys Only" 
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleCloseKeyExportDialog}
            sx={{ 
              color: '#666',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExportKeys}
            variant="contained"
            sx={{ 
              bgcolor: '#800000',
              '&:hover': { bgcolor: '#600000' }
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default StudentList;
