import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Card, CardContent, Divider, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';

function CompanyMetrics() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [companies, setCompanies] = useState([]);
  const [evaluationsData, setEvaluationsData] = useState({});
  const [years, setYears] = useState([]);
  const [semesters] = useState(['1st', '2nd', 'Summer']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!db) {
          console.log('Waiting for database initialization...');
          return;
        }

        const evaluationsRef = collection(db, 'companyEvaluations');
        const snapshot = await getDocs(evaluationsRef);
        
        if (!isMounted) return;

        const data = {
          companies: new Set(),
          years: new Set(),
          evaluations: {}
        };

        snapshot.docs.forEach(doc => {
          const evaluation = doc.data();
          
          if (evaluation.status !== 'submitted') return;

          const { companyName, schoolYear, semester } = evaluation;

          data.companies.add(companyName);
          data.years.add(schoolYear);

          if (!data.evaluations[companyName]) {
            data.evaluations[companyName] = {};
          }
          if (!data.evaluations[companyName][schoolYear]) {
            data.evaluations[companyName][schoolYear] = {};
          }
          if (!data.evaluations[companyName][schoolYear][semester]) {
            data.evaluations[companyName][schoolYear][semester] = [];
          }

          // Store evaluation with exact database structure
          data.evaluations[companyName][schoolYear][semester].push({
            workEnvironmentData: [
              {
                aspect: 'Workstation',
                rating: evaluation.workEnvironment?.workstation || 0,
                category: 'Environment',
                description: 'Evaluation of ergonomic design, space allocation, and overall functionality of assigned work areas'
              },
              {
                aspect: 'Resources',
                rating: evaluation.workEnvironment?.resources || 0,
                category: 'Support',
                description: 'Assessment of availability, quality, and accessibility of essential tools and equipment for task execution'
              },
              {
                aspect: 'Safety',
                rating: evaluation.workEnvironment?.safety || 0,
                category: 'Environment',
                description: 'Analysis of implemented safety protocols, emergency preparedness, and workplace hazard mitigation'
              },
              {
                aspect: 'Workload',
                rating: evaluation.workEnvironment?.workload || 0,
                category: 'Management',
                description: 'Measurement of task distribution balance, time management requirements, and work intensity levels'
              }
            ],
            performanceData: [
              {
                aspect: 'Supervision',
                rating: evaluation.performanceSupport?.supervision || 0,
                category: 'Support',
                description: 'Evaluation of leadership effectiveness, guidance quality, and managerial support provided'
              },
              {
                aspect: 'Feedback',
                rating: evaluation.performanceSupport?.feedback || 0,
                category: 'Development',
                description: 'Assessment of constructive criticism frequency, clarity, and actionable insights provided'
              },
              {
                aspect: 'Training',
                rating: evaluation.performanceSupport?.training || 0,
                category: 'Development',
                description: 'Analysis of professional development opportunities, skill enhancement programs, and training effectiveness'
              },
              {
                aspect: 'Mentorship',
                rating: evaluation.performanceSupport?.mentorship || 0,
                category: 'Support',
                description: 'Evaluation of career guidance quality, knowledge transfer effectiveness, and professional relationship building'
              }
            ],
            experienceData: [
              {
                aspect: 'Relevance',
                rating: evaluation.experienceQuality?.relevance || 0,
                category: 'Value',
                description: 'Assessment of alignment between internship tasks and academic/career development objectives'
              },
              {
                aspect: 'Skills',
                rating: evaluation.experienceQuality?.skills || 0,
                category: 'Growth',
                description: 'Measurement of technical and soft skill acquisition through practical application and professional exposure'
              },
              {
                aspect: 'Growth',
                rating: evaluation.experienceQuality?.growth || 0,
                category: 'Development',
                description: 'Evaluation of personal and professional development opportunities and career advancement potential'
              },
              {
                aspect: 'Satisfaction',
                rating: evaluation.experienceQuality?.satisfaction || 0,
                category: 'Experience',
                description: 'Comprehensive assessment of overall internship experience quality and professional fulfillment'
              }
            ],
            trendData: [{
              month: new Date(evaluation.submittedAt?.toDate()).toLocaleString('default', { month: 'long' }),
              satisfaction: evaluation.overall?.averageRating || 0,
              engagement: (evaluation.overall?.totalScore || 0) / (evaluation.overall?.maxPossibleScore || 60) * 5
            }]
          });
        });

        if (isMounted) {
          setCompanies(Array.from(data.companies).map(name => ({ id: name, name })));
          setEvaluationsData(data.evaluations);
          setYears(Array.from(data.years).sort());
          
          const latestYear = Array.from(data.years).sort().pop();
          const firstCompany = Array.from(data.companies)[0];
          setSelectedYear(latestYear || '');
          setSelectedCompany(firstCompany || '');
          setSelectedSemester('1st');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        if (isMounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update the getFilteredData function
  const getFilteredData = (dataType) => {
    if (!selectedCompany || !selectedYear || !selectedSemester) return [];
    
    const evaluations = evaluationsData[selectedCompany]?.[selectedYear]?.[selectedSemester] || [];
    if (evaluations.length === 0) return [];

    // Get the first evaluation's data for the selected type
    const data = evaluations[0]?.[dataType];
    if (!data) return [];

    return data;
  };

  // Update the CompanySelector to remove "All Companies" option
  const CompanySelector = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="company-select-label">Select Company</InputLabel>
            <Select
              labelId="company-select-label"
              id="company-select"
              value={selectedCompany}
              label="Select Company"
              onChange={(e) => setSelectedCompany(e.target.value)}
              sx={{
                '& .MuiSelect-select': { color: '#800000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#800000',
                },
              }}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
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
              {years.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
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
              {semesters.map((sem) => (
                <MenuItem key={sem} value={sem}>{sem}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {selectedCompany && (
          <Grid item xs={12}>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#800000', fontWeight: 'bold' }}>
                {companies.find(c => c.id === selectedCompany)?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedYear} - {selectedSemester} Semester
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );

  // Enhanced tooltip component with better formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ p: 2, maxWidth: 250, boxShadow: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#800000' }}>
            {data.aspect}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
            Category: {data.category}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            {data.description}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            Rating: {data.rating}/5
          </Typography>
        </Card>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <CompanySelector />
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Work Environment Assessment
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Evaluation of workplace atmosphere, culture, and employee engagement
            </Typography>
            <Grid container spacing={3}>
              {/* Work Environment Cards */}
              {getFilteredData('workEnvironmentData').map((metric) => (
                <Grid item xs={12} md={6} lg={3} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold' }}>
                            {metric.aspect}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              bgcolor: metric.rating >= 4.5 ? '#e8f5e9' : 
                                     metric.rating >= 4.0 ? '#e3f2fd' : '#fff3e0',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block',
                              mt: 1
                            }}
                          >
                            {metric.category}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: metric.rating >= 4.5 ? '#2e7d32' : 
                                   metric.rating >= 4.0 ? '#1976d2' : '#ed6c02',
                            fontWeight: 'bold',
                            ml: 2
                          }}
                        >
                          {metric.rating.toFixed(1)}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>

                      <Box sx={{ 
                        mt: 'auto',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: metric.rating >= 4.5 ? '#e8f5e9' : 
                                metric.rating >= 4.0 ? '#e3f2fd' : '#fff3e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: metric.rating >= 4.5 ? '#2e7d32' : 
                                 metric.rating >= 4.0 ? '#1976d2' : '#ed6c02',
                          fontWeight: 'bold'
                        }}>
                          {metric.rating >= 4.5 ? 'Excellent' : 
                           metric.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          out of 5.0
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Radar Chart */}
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer>
                    <RadarChart data={getFilteredData('workEnvironmentData')}>
                      <PolarGrid gridType="polygon" />
                      <PolarAngleAxis 
                        dataKey="aspect" 
                        tick={{ fill: '#666', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        domain={[0, 5]} 
                        axisLine={{ stroke: '#666' }}
                        tick={{ fill: '#666' }}
                      />
                      <Radar
                        name="Environment"
                        dataKey="rating"
                        stroke="#800000"
                        fill="#800000"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              {/* Bar Chart */}
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer>
                    <BarChart 
                      data={getFilteredData('workEnvironmentData')}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis 
                        dataKey="aspect" 
                        type="category" 
                        width={150}
                        tick={{ fill: '#666' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="rating" 
                        background={{ fill: '#f5f5f5' }}
                      >
                        {getFilteredData('workEnvironmentData').map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.rating >= 4.5 ? '#2e7d32' : 
                                  entry.rating >= 4.0 ? '#1976d2' : '#ed6c02'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Performance Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Detailed evaluation of work performance and efficiency metrics
            </Typography>
            <Grid container spacing={3}>
              {/* Performance Metrics Cards */}
              {getFilteredData('performanceData').map((metric) => (
                <Grid item xs={12} md={6} lg={4} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold', flex: 1 }}>
                          {metric.aspect}
                        </Typography>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: metric.rating >= 4.5 ? '#2e7d32' : 
                                   metric.rating >= 4.0 ? '#1976d2' : '#ed6c02',
                            fontWeight: 'bold'
                          }}
                        >
                          {metric.rating.toFixed(1)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>
                      
                      <Box sx={{ 
                        mt: 2, 
                        p: 1, 
                        borderRadius: 1,
                        bgcolor: metric.rating >= 4.5 ? '#e8f5e9' : 
                                metric.rating >= 4.0 ? '#e3f2fd' : '#fff3e0'
                      }}>
                        <Typography variant="caption" sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: metric.rating >= 4.5 ? '#2e7d32' : 
                                 metric.rating >= 4.0 ? '#1976d2' : '#ed6c02'
                        }}>
                          <span>Category: {metric.category}</span>
                          <span>
                            {metric.rating >= 4.5 ? 'Excellent' : 
                             metric.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Radar Chart */}
              <Grid item xs={12}>
                <Box sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer>
                    <RadarChart data={getFilteredData('performanceData')}>
                      <PolarGrid gridType="polygon" />
                      <PolarAngleAxis 
                        dataKey="aspect" 
                        tick={{ fill: '#666', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        domain={[0, 5]} 
                        axisLine={{ stroke: '#666' }}
                        tick={{ fill: '#666' }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="rating"
                        stroke="#800000"
                        fill="#800000"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              {/* Summary Bar Chart */}
              <Grid item xs={12}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart 
                      data={getFilteredData('performanceData')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="aspect" 
                        angle={45} 
                        textAnchor="start" 
                        height={100}
                        interval={0}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="rating" 
                        background={{ fill: '#f5f5f5' }}
                      >
                        {getFilteredData('performanceData').map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.rating >= 4.5 ? '#2e7d32' : 
                                  entry.rating >= 4.0 ? '#1976d2' : '#ed6c02'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Overall Experience & Impact
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Comprehensive evaluation of company effectiveness and student satisfaction
            </Typography>
            <Grid container spacing={3}>
              {/* Experience Metrics Cards */}
              {getFilteredData('experienceData').map((metric) => (
                <Grid item xs={12} md={6} lg={3} key={metric.aspect}>
                  <Card 
                    elevation={2}
                    sx={{
                      height: '100%',
                      backgroundColor: metric.rating >= 4.5 ? '#f7f7f7' : 'white',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: '#800000', fontWeight: 'bold' }}>
                        {metric.aspect}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {metric.description}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <Typography variant="h4" sx={{ 
                          color: metric.rating >= 4.5 ? '#2e7d32' : 
                                 metric.rating >= 4.0 ? '#1976d2' : '#ed6c02',
                          fontWeight: 'bold'
                        }}>
                          {metric.rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          out of 5.0
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        mt: 1,
                        color: metric.rating >= 4.5 ? '#2e7d32' : 
                               metric.rating >= 4.0 ? '#1976d2' : '#ed6c02'
                      }}>
                        {metric.rating >= 4.5 ? 'Excellent' : 
                         metric.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Summary Chart */}
              <Grid item xs={12}>
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer>
                    <BarChart 
                      data={getFilteredData('experienceData')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="aspect" 
                        angle={45} 
                        textAnchor="start" 
                        height={100}
                        interval={0}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="rating" 
                        fill="#FFD700"
                        radius={[4, 4, 0, 0]}
                        background={{ fill: '#f5f5f5' }}
                      >
                        {getFilteredData('experienceData').map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.rating >= 4.5 ? '#2e7d32' : 
                                  entry.rating >= 4.0 ? '#1976d2' : '#ed6c02'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#800000' }}>
              Satisfaction & Engagement Trends
            </Typography>
            <Box sx={{ height: 350, mt: 3 }}>
              <ResponsiveContainer>
                <LineChart data={getFilteredData('trendData')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} tickCount={6} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#800000" 
                    name="Overall Satisfaction"
                    strokeWidth={2}
                    dot={{ fill: '#800000' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#FFD700" 
                    name="Employee Engagement"
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

export default CompanyMetrics; 