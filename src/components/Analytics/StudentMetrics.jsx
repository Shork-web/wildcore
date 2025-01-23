import React, { useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, Stack } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#800000', '#FFD700', '#FF6B6B', '#4ECDC4'];

function StudentMetrics() {
  // Add filter states
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');

  // Filter options
  const filterOptions = {
    programs: [
      { id: 'cs', name: 'Computer Science' },
      { id: 'business', name: 'Business' },
      { id: 'engineering', name: 'Engineering' },
      { id: 'other', name: 'Other' }
    ],
    years: [
      { id: '2024', name: '2024' },
      { id: '2023', name: '2023' },
      { id: '2022', name: '2022' }
    ],
    semesters: [
      { id: '1st', name: '1st Semester' },
      { id: '2nd', name: '2nd Semester' },
      { id: 'summer', name: 'Summer' }
    ],
    companies: [
      { id: 'company1', name: 'Tech Solutions Inc.' },
      { id: 'company2', name: 'Digital Innovations LLC' },
      { id: 'company3', name: 'Future Systems Corp' },
      { id: 'company4', name: 'Data Dynamics' }
    ]
  };

  // Filter component
  const FilterSection = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Program</InputLabel>
          <Select
            value={selectedProgram}
            label="Program"
            onChange={(e) => setSelectedProgram(e.target.value)}
            sx={{
              '& .MuiSelect-select': { color: '#800000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#800000',
              },
            }}
          >
            <MenuItem value="all">All Programs</MenuItem>
            {filterOptions.programs.map((program) => (
              <MenuItem key={program.id} value={program.id}>
                {program.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>School Year</InputLabel>
          <Select
            value={selectedYear}
            label="School Year"
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{
              '& .MuiSelect-select': { color: '#800000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#800000',
              },
            }}
          >
            <MenuItem value="all">All Years</MenuItem>
            {filterOptions.years.map((year) => (
              <MenuItem key={year.id} value={year.id}>
                {year.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Semester</InputLabel>
          <Select
            value={selectedSemester}
            label="Semester"
            onChange={(e) => setSelectedSemester(e.target.value)}
            sx={{
              '& .MuiSelect-select': { color: '#800000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#800000',
              },
            }}
          >
            <MenuItem value="all">All Semesters</MenuItem>
            {filterOptions.semesters.map((semester) => (
              <MenuItem key={semester.id} value={semester.id}>
                {semester.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Company</InputLabel>
          <Select
            value={selectedCompany}
            label="Company"
            onChange={(e) => setSelectedCompany(e.target.value)}
            sx={{
              '& .MuiSelect-select': { color: '#800000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#800000',
              },
            }}
          >
            <MenuItem value="all">All Companies</MenuItem>
            {filterOptions.companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Active Filters Display */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Active Filters:
          {selectedProgram !== 'all' && ` Program: ${filterOptions.programs.find(p => p.id === selectedProgram)?.name},`}
          {selectedYear !== 'all' && ` Year: ${selectedYear},`}
          {selectedSemester !== 'all' && ` Semester: ${filterOptions.semesters.find(s => s.id === selectedSemester)?.name},`}
          {selectedCompany !== 'all' && ` Company: ${filterOptions.companies.find(c => c.id === selectedCompany)?.name}`}
          {(selectedProgram === 'all' && selectedYear === 'all' && selectedSemester === 'all' && selectedCompany === 'all') && ' None'}
        </Typography>
      </Box>
    </Paper>
  );

  // Function to filter data based on selected filters
  const getFilteredData = (dataType) => {
    // In a real application, you would filter the data based on the selected filters
    // For now, we'll return the existing data
    switch(dataType) {
      case 'workAttitude':
        return workAttitudeData;
      case 'workPerformance':
        return workPerformanceData;
      case 'program':
        return programData;
      case 'trend':
        return trendData;
      default:
        return [];
    }
  };

  // Work Attitude Data
  const workAttitudeData = [
    { aspect: 'Enthusiasm / Learning', rating: 4.5, category: 'Attitude', description: 'Shows eagerness to learn and enthusiasm in tasks' },
    { aspect: 'Cooperation', rating: 4.3, category: 'Attitude', description: 'Demonstrates willingness to cooperate with others' },
    { aspect: 'Adaptability', rating: 4.4, category: 'Attitude', description: 'Shows flexibility and social adaptability' },
    { aspect: 'Initiative', rating: 4.2, category: 'Attitude', description: 'Displays industriousness and takes initiative' },
    { aspect: 'Responsibility', rating: 4.6, category: 'Attitude', description: 'Demonstrates a strong sense of responsibility' },
    { aspect: 'Attentiveness', rating: 4.3, category: 'Attitude', description: 'Maintains focus and attention to detail' },
    { aspect: 'Personal Grooming', rating: 4.5, category: 'Attitude', description: 'Maintains professional appearance and disposition' },
    { aspect: 'Attendance', rating: 4.7, category: 'Attitude', description: 'Maintains consistent attendance and punctuality' }
  ];

  // Work Performance Data (scaled to 5-point system for consistency)
  const workPerformanceData = [
    { aspect: 'Quality of Work', score: 4.5, maxScore: 5, category: 'Performance', description: 'Overall quality of completed tasks' },
    { aspect: 'Quantity of Work', score: 4.3, maxScore: 5, category: 'Performance', description: 'Amount of work completed within timeframe' },
    { aspect: 'Dependability', score: 4.6, maxScore: 5, category: 'Performance', description: 'Reliability and trustworthiness' },
    { aspect: 'Comprehension', score: 4.2, maxScore: 5, category: 'Performance', description: 'Understanding of tasks and requirements' },
    { aspect: 'Safety Consciousness', score: 4.8, maxScore: 5, category: 'Performance', description: 'Awareness and adherence to safety protocols' },
    { aspect: 'Waste Consciousness', score: 4.4, maxScore: 5, category: 'Performance', description: 'Efficient use of resources' }
  ];

  // Program distribution data
  const programData = [
    { name: 'Computer Science', count: 45, performance: 4.5 },
    { name: 'Business', count: 30, performance: 4.3 },
    { name: 'Engineering', count: 25, performance: 4.4 },
    { name: 'Other', count: 15, performance: 4.2 }
  ];

  // Performance trend data
  const trendData = [
    { month: 'January', attitude: 4.2, performance: 4.0 },
    { month: 'February', attitude: 4.3, performance: 4.2 },
    { month: 'March', attitude: 4.5, performance: 4.4 },
    { month: 'April', attitude: 4.4, performance: 4.5 }
  ];

  // Enhanced tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ p: 2, maxWidth: 250, boxShadow: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#800000' }}>
            {data.aspect || data.name}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
            Category: {data.category || 'Program'}
          </Typography>
          {data.description && (
            <>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {data.description}
              </Typography>
            </>
          )}
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            {data.rating ? `Rating: ${data.rating}/5` : 
             data.score ? `Score: ${data.score}/5` :
             data.count ? `Count: ${data.count}` : ''}
          </Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={3}>
      {/* Add Filter Section */}
      <Grid item xs={12}>
        <FilterSection />
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Work Attitude Assessment
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Scale: 1 (Needs Improvement) to 5 (Excellent)
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <RadarChart data={getFilteredData('workAttitude')}>
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="aspect" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar 
                    name="Attitude" 
                    dataKey="rating" 
                    fill="#800000" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Work Performance Metrics
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={getFilteredData('workPerformance')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="aspect" angle={45} textAnchor="start" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#FFD700" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Program Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={getFilteredData('program')}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="count"
                  >
                    {getFilteredData('program').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Performance Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={getFilteredData('trend')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attitude" 
                    stroke="#800000" 
                    name="Work Attitude"
                    strokeWidth={2}
                    dot={{ fill: '#800000' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="performance" 
                    stroke="#FFD700" 
                    name="Work Performance"
                    strokeWidth={2}
                    dot={{ fill: '#FFD700' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default StudentMetrics; 