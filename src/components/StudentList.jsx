import React from 'react';
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
  Box
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

function StudentList({ students, updateStudent, deleteStudent }) {
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
        Student List
      </Typography>

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
            {students.map((student) => (
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
    </Container>
  );
}

export default StudentList;
