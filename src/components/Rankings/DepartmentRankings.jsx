/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { styled } from '@mui/system';
import { Business, EmojiEvents, School } from '@mui/icons-material';
import { db } from '../../firebase-config';
import { collection, query, getDocs, where } from 'firebase/firestore';

const maroon = '#800000';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  marginBottom: theme.spacing(3),
  '&:hover': {
    boxShadow: '0 4px 8px rgba(128, 0, 0, 0.1)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme, rank }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: rank === 1 
      ? 'rgba(255, 215, 0, 0.05)' 
      : rank === 2 
        ? 'rgba(192, 192, 192, 0.05)' 
        : rank === 3 
          ? 'rgba(205, 127, 50, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)',
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: rank === 1 
      ? 'rgba(255, 215, 0, 0.1)' 
      : rank === 2 
        ? 'rgba(192, 192, 192, 0.1)' 
        : rank === 3 
          ? 'rgba(205, 127, 50, 0.1)' 
          : 'rgba(0, 0, 0, 0.04)',
  },
}));

const RankBadge = styled(Box)(({ theme, rank }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  fontWeight: 'bold',
  fontSize: '0.75rem',
  margin: '0 auto',
  ...(rank === 1 && {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    border: '1px solid #FFD700',
  }),
  ...(rank === 2 && {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    color: '#A0A0A0',
    border: '1px solid #C0C0C0',
  }),
  ...(rank === 3 && {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    color: '#CD7F32',
    border: '1px solid #CD7F32',
  }),
  ...(rank > 3 && {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: theme.palette.text.secondary,
    border: '1px solid rgba(0, 0, 0, 0.12)',
  }),
}));

const ProgressBar = styled(LinearProgress)(({ theme, value, rank }) => ({
  height: 8,
  borderRadius: 4,
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  '.MuiLinearProgress-bar': {
    backgroundColor: rank === 1 
      ? '#FFD700' 
      : rank === 2 
        ? '#C0C0C0' 
        : rank === 3 
          ? '#CD7F32' 
          : maroon,
  }
}));

function DepartmentRankings({ collegeFilter, semesterFilter, yearFilter }) {
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDepartmentStats() {
      try {
        // Start with a base query
        let q = query(collection(db, 'studentData'));
        
        // Apply filters
        if (collegeFilter && collegeFilter !== 'All') {
          q = query(q, where('college', '==', collegeFilter));
        }
        
        if (semesterFilter && semesterFilter !== 'All') {
          q = query(q, where('semester', '==', semesterFilter));
        }
        
        if (yearFilter && yearFilter !== 'All') {
          q = query(q, where('schoolYear', '==', yearFilter));
        }
        
        const snapshot = await getDocs(q);
        
        // Process data to group by department/program
        const departments = {};
        
        snapshot.docs.forEach(doc => {
          const student = doc.data();
          const program = student.program;
          
          if (!program) return;
          
          if (!departments[program]) {
            departments[program] = {
              name: program,
              college: student.college || 'Unknown',
              students: [],
              totalScore: 0,
              averageScore: 0,
              highestScore: 0,
              studentCount: 0
            };
          }
          
          // Calculate evaluation score for this student
          const score = calculateEvaluationScore(student.evaluation || '');
          
          departments[program].students.push({
            id: doc.id,
            name: student.name,
            score: score
          });
          
          departments[program].totalScore += score;
          departments[program].highestScore = Math.max(departments[program].highestScore, score);
          departments[program].studentCount++;
        });
        
        // Calculate average scores and create sorted array
        const departmentArray = Object.values(departments).map(dept => {
          dept.averageScore = dept.studentCount > 0 ? dept.totalScore / dept.studentCount : 0;
          return dept;
        });
        
        // Sort by average score
        departmentArray.sort((a, b) => b.averageScore - a.averageScore);
        
        setDepartmentStats(departmentArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching department stats:", error);
        setError(error.message);
        setLoading(false);
      }
    }
    
    fetchDepartmentStats();
  }, [collegeFilter, semesterFilter, yearFilter]);
  
  // Function to calculate a numeric score from evaluation text
  const calculateEvaluationScore = (evaluation) => {
    if (!evaluation) return 0;
    
    const positiveKeywords = [
      'excellent', 'outstanding', 'exceptional', 'great', 'good', 
      'skilled', 'proficient', 'talented', 'impressive', 'dedicated'
    ];
    
    const normalizedText = evaluation.toLowerCase();
    let score = Math.min(evaluation.length / 100, 5); // Max 5 points for length
    
    // Add points for positive keywords
    positiveKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword)) {
        score += 1;
      }
    });
    
    return Math.min(score, 10); // Cap at 10
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Loading department rankings...
        </Typography>
        <LinearProgress sx={{ mt: 1, backgroundColor: 'rgba(128, 0, 0, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: maroon } }} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 2, color: 'error.main' }}>
        <Typography variant="body1">
          Error loading department rankings: {error}
        </Typography>
      </Box>
    );
  }
  
  if (departmentStats.length === 0) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No department data available for the selected filters.
        </Typography>
      </Box>
    );
  }

  // Find the max average score for relative progress bars
  const maxAverageScore = Math.max(...departmentStats.map(dept => dept.averageScore));

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Business sx={{ mr: 1, color: maroon }} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: maroon,
          }}
        >
          Department Performance Rankings
        </Typography>
      </Box>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: 2, 
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box component="span" sx={{ 
          display: 'inline-block', 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          bgcolor: 'info.main', 
          mr: 1 
        }} />
        Showing all programs for accurate department comparison. Use filters above to narrow results by semester or school year.
      </Typography>
      
      <StyledCard>
        <CardContent>
          <TableContainer sx={{ borderRadius: 0, boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(128, 0, 0, 0.03)' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%', py: 1 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%', py: 1 }}>Department</TableCell>
                  {collegeFilter === 'All' && (
                    <TableCell sx={{ fontWeight: 'bold', width: '20%', py: 1 }}>College</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', py: 1, textAlign: 'center' }}>Students</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: collegeFilter === 'All' ? '32%' : '52%', py: 1 }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentStats.map((dept, index) => (
                  <StyledTableRow key={dept.name} rank={index + 1}>
                    <TableCell sx={{ py: 1, textAlign: 'center' }}>
                      <RankBadge rank={index + 1}>
                        {index + 1}
                      </RankBadge>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <School fontSize="small" sx={{ mr: 1, color: maroon, opacity: 0.7 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {dept.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {collegeFilter === 'All' && (
                      <TableCell sx={{ py: 1 }}>{dept.college}</TableCell>
                    )}
                    <TableCell sx={{ py: 1, textAlign: 'center' }}>
                      <Chip 
                        label={dept.studentCount} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(128, 0, 0, 0.08)',
                          color: maroon,
                          fontWeight: 'medium',
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Average: {dept.averageScore.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Highest: {dept.highestScore.toFixed(1)}
                          </Typography>
                        </Box>
                        <ProgressBar 
                          variant="determinate" 
                          value={(dept.averageScore / maxAverageScore) * 100} 
                          rank={index + 1}
                        />
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </StyledCard>
      
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" color={maroon} sx={{ mb: 1.5 }}>
                <EmojiEvents fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Top 3 Departments
              </Typography>
              
              {departmentStats.slice(0, 3).map((dept, index) => (
                <Box key={dept.name} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <RankBadge rank={index + 1} sx={{ mr: 1.5 }}>
                    {index + 1}
                  </RankBadge>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {dept.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dept.college}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: index === 0 
                      ? '#FFD700' 
                      : index === 1 
                        ? '#C0C0C0' 
                        : '#CD7F32',
                    fontWeight: 'bold'
                  }}>
                    {dept.averageScore.toFixed(1)}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" color={maroon} sx={{ mb: 1.5 }}>
                <School fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Most Active Departments
              </Typography>
              
              {[...departmentStats].sort((a, b) => b.studentCount - a.studentCount).slice(0, 3).map((dept, index) => (
                <Box key={dept.name} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Chip 
                    label={dept.studentCount} 
                    size="small" 
                    sx={{ 
                      mr: 1.5,
                      minWidth: 30,
                      bgcolor: 'rgba(128, 0, 0, 0.08)',
                      color: maroon,
                      fontWeight: 'medium',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {dept.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dept.college}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: maroon,
                    fontWeight: 'medium'
                  }}>
                    {dept.averageScore.toFixed(1)}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DepartmentRankings; 