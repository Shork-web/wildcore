import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { Grid, Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Paper, Stack, CircularProgress } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#800000', '#FFD700', '#FF6B6B', '#4ECDC4'];

const RATING_LABELS = {
  // Work Attitude mappings
  'Demonstrates positive attitude towards work': 'Attitude',
  'Shows enthusiasm and initiative': 'Drive',
  'Works effectively with others': 'Team',
  'Demonstrates professionalism': 'Prof',
  'Exhibits dependability and responsibility': 'Depend',
  'Demonstrates good judgment': 'Judge',
  'Shows desire to learn': 'Learn',
  
  // Work Performance mappings
  'Quality of work output': 'Quality',
  'Quantity of work output': 'Quantity',
  'Planning and organizing work': 'Plan',
  'Meeting deadlines': 'Time',
  'Technical knowledge and skills': 'Tech',
  'Communication skills': 'Comm',
  'Problem-solving abilities': 'Solve',
  'Decision-making abilities': 'Decide'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Find original label by looking up the shortened version
    const originalLabel = Object.entries(RATING_LABELS).find(([_, short]) => 
      short === data.aspect
    )?.[0] || data.aspect;

    return (
      <Card sx={{ p: 2, maxWidth: 250, boxShadow: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#800000' }}>
          {originalLabel}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
          Category: {data.category || 'Program'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          {data.rating ? `Rating: ${data.rating.toFixed(2)}/5` : 
           data.score ? `Score: ${data.score.toFixed(2)}/5` :
           data.count ? `Count: ${data.count}` : ''}
        </Typography>
        {data.averageScore && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Average Score: {data.averageScore.toFixed(2)}
          </Typography>
        )}
      </Card>
    );
  }
  return null;
};

function StudentMetrics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  // Fetch data and set initial filter values
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const surveysRef = collection(db, 'studentSurveys');
        const snapshot = await getDocs(surveysRef);
        const surveys = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSurveyData(surveys);

        // Set initial filter values to the first option in each category
        if (surveys.length > 0) {
          const programs = [...new Set(surveys.map(survey => survey.program))];
          const years = [...new Set(surveys.map(survey => survey.schoolYear))];
          const semesters = [...new Set(surveys.map(survey => survey.semester))];
          const companies = [...new Set(surveys.map(survey => survey.companyName))];

          setSelectedProgram(programs[0] || '');
          setSelectedYear(years[0] || '');
          setSelectedSemester(semesters[0] || '');
          setSelectedCompany(companies[0] || '');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, []);

  // Extract unique filter options from actual data
  const filterOptions = {
    programs: [...new Set(surveyData.map(survey => survey.program))],
    years: [...new Set(surveyData.map(survey => survey.schoolYear))],
    semesters: [...new Set(surveyData.map(survey => survey.semester))],
    companies: [...new Set(surveyData.map(survey => survey.companyName))]
  };

  // Filter data based on selections
  const getFilteredData = () => {
    return surveyData.filter(survey => {
      return (!selectedProgram || survey.program === selectedProgram) &&
             (!selectedYear || survey.schoolYear === selectedYear) &&
             (!selectedSemester || survey.semester === selectedSemester) &&
             (!selectedCompany || survey.companyName === selectedCompany);
    });
  };

  // Process data for different charts
  const processChartData = () => {
    const filteredData = getFilteredData();
    
    // Work Attitude Data
    const workAttitudeData = filteredData.reduce((acc, survey) => {
      const ratings = survey.workAttitude?.ratings || {};
      Object.entries(ratings).forEach(([aspect, rating]) => {
        const shortLabel = RATING_LABELS[aspect] || aspect;
        if (!acc[shortLabel]) {
          acc[shortLabel] = { total: 0, count: 0 };
        }
        acc[shortLabel].total += rating;
        acc[shortLabel].count += 1;
      });
      return acc;
    }, {});

    // Work Performance Data
    const workPerformanceData = filteredData.reduce((acc, survey) => {
      const ratings = survey.workPerformance?.ratings || {};
      Object.entries(ratings).forEach(([aspect, rating]) => {
        const shortLabel = RATING_LABELS[aspect] || aspect;
        if (!acc[shortLabel]) {
          acc[shortLabel] = { total: 0, count: 0 };
        }
        acc[shortLabel].total += rating;
        acc[shortLabel].count += 1;
      });
      return acc;
    }, {});

    // Program Distribution
    const programDistribution = filteredData.reduce((acc, survey) => {
      const program = survey.program;
      if (!acc[program]) {
        acc[program] = { count: 0, totalScore: 0 };
      }
      acc[program].count += 1;
      acc[program].totalScore += survey.totalScore;
      return acc;
    }, {});

    return {
      workAttitude: Object.entries(workAttitudeData).map(([aspect, data]) => ({
        aspect,
        rating: data.total / data.count,
        category: 'Attitude'
      })),
      workPerformance: Object.entries(workPerformanceData).map(([aspect, data]) => ({
        aspect,
        score: data.total / data.count,
        category: 'Performance'
      })),
      programDistribution: Object.entries(programDistribution).map(([program, data]) => ({
        name: program,
        count: data.count,
        averageScore: data.totalScore / data.count
      }))
    };
  };

  // Filter Section Component (keep your existing FilterSection component)
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
            {filterOptions.programs.map((program) => (
              <MenuItem key={program} value={program}>
                {program}
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
            {filterOptions.years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
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
            {filterOptions.semesters.map((semester) => (
              <MenuItem key={semester} value={semester}>
                {semester}
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
            {filterOptions.companies.map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Active Filters Display */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Active Filters:
          {selectedProgram && ` Program: ${selectedProgram},`}
          {selectedYear && ` Year: ${selectedYear},`}
          {selectedSemester && ` Semester: ${selectedSemester},`}
          {selectedCompany && ` Company: ${selectedCompany}`}
        </Typography>
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  const chartData = processChartData();

  return (
    <Grid container spacing={3}>
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
                <RadarChart data={chartData.workAttitude}>
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
                <BarChart data={chartData.workPerformance}>
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
                    data={chartData.programDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="count"
                  >
                    {chartData.programDistribution.map((entry, index) => (
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
                <LineChart data={chartData.workAttitude}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="aspect" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#800000" 
                    name="Work Attitude"
                    strokeWidth={2}
                    dot={{ fill: '#800000' }}
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