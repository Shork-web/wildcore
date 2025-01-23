import React, { useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, Divider, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from 'recharts';

function CompanyMetrics() {
  // Add state for selected company
  const [selectedCompany, setSelectedCompany] = useState('all');

  // Sample company list
  const companies = [
    { id: 'company1', name: 'Tech Solutions Inc.' },
    { id: 'company2', name: 'Digital Innovations LLC' },
    { id: 'company3', name: 'Future Systems Corp' },
    { id: 'company4', name: 'Data Dynamics' },
  ];

  // Company-specific data with full mock data for each company
  const companyData = {
    'company1': {
      workEnvironmentData: [
        { aspect: 'Learning Environment', rating: 4.5, description: 'Company fosters enthusiasm and eagerness to learn', category: 'Culture' },
        { aspect: 'Team Collaboration', rating: 4.7, description: 'Encourages cooperation and effective teamwork', category: 'Interaction' },
        { aspect: 'Workplace Adaptability', rating: 4.3, description: 'Promotes flexibility and positive social interaction', category: 'Culture' },
        { aspect: 'Employee Initiative', rating: 4.6, description: 'Supports self-motivation and proactive behavior', category: 'Performance' },
        { aspect: 'Task Ownership', rating: 4.8, description: 'Encourages responsibility and accountability', category: 'Performance' },
        { aspect: 'Work Focus', rating: 4.4, description: 'Maintains environment for concentration and productivity', category: 'Performance' },
        { aspect: 'Professional Conduct', rating: 4.9, description: 'Upholds high standards of professionalism', category: 'Culture' },
        { aspect: 'Attendance & Punctuality', rating: 4.7, description: 'Values consistent attendance and timeliness', category: 'Performance' }
      ],
      performanceData: [
        { aspect: 'Skill Alignment', rating: 4.6, description: 'Tasks match skill level and promote growth', category: 'Development' },
        { aspect: 'Work-Life Balance', rating: 4.4, description: 'Reasonable workload with clear expectations', category: 'Wellbeing' },
        { aspect: 'Workplace Safety', rating: 4.9, description: 'Maintains high safety standards and protocols', category: 'Environment' },
        { aspect: 'Resource Efficiency', rating: 4.5, description: 'Promotes efficient resource utilization', category: 'Operations' },
        { aspect: 'Quality Standards', rating: 4.7, description: 'Emphasizes quality over quantity in deliverables', category: 'Standards' }
      ],
      experienceData: [
        { aspect: 'Employee Recognition', rating: 4.8, description: 'Feels valued and appreciated by the company', category: 'Satisfaction' },
        { aspect: 'Career Development', rating: 4.7, description: 'Opportunities for professional advancement', category: 'Growth' },
        { aspect: 'Work Culture', rating: 4.6, description: 'Positive, inclusive, and respectful environment', category: 'Environment' },
        { aspect: 'Program Success', rating: 4.8, description: 'Likelihood to recommend to other students', category: 'Impact' }
      ],
      trendData: [
        { month: 'January', satisfaction: 4.5, engagement: 4.3 },
        { month: 'February', satisfaction: 4.6, engagement: 4.4 },
        { month: 'March', satisfaction: 4.7, engagement: 4.6 },
        { month: 'April', satisfaction: 4.8, engagement: 4.7 }
      ]
    },
    'company2': {
      workEnvironmentData: [
        { aspect: 'Learning Environment', rating: 4.2, description: 'Company fosters enthusiasm and eagerness to learn', category: 'Culture' },
        { aspect: 'Team Collaboration', rating: 4.0, description: 'Encourages cooperation and effective teamwork', category: 'Interaction' },
        { aspect: 'Workplace Adaptability', rating: 4.1, description: 'Promotes flexibility and positive social interaction', category: 'Culture' },
        { aspect: 'Employee Initiative', rating: 4.3, description: 'Supports self-motivation and proactive behavior', category: 'Performance' },
        { aspect: 'Task Ownership', rating: 4.4, description: 'Encourages responsibility and accountability', category: 'Performance' },
        { aspect: 'Work Focus', rating: 4.2, description: 'Maintains environment for concentration and productivity', category: 'Performance' },
        { aspect: 'Professional Conduct', rating: 4.5, description: 'Upholds high standards of professionalism', category: 'Culture' },
        { aspect: 'Attendance & Punctuality', rating: 4.3, description: 'Values consistent attendance and timeliness', category: 'Performance' }
      ],
      performanceData: [
        { aspect: 'Skill Alignment', rating: 4.1, description: 'Tasks match skill level and promote growth', category: 'Development' },
        { aspect: 'Work-Life Balance', rating: 4.3, description: 'Reasonable workload with clear expectations', category: 'Wellbeing' },
        { aspect: 'Workplace Safety', rating: 4.6, description: 'Maintains high safety standards and protocols', category: 'Environment' },
        { aspect: 'Resource Efficiency', rating: 4.2, description: 'Promotes efficient resource utilization', category: 'Operations' },
        { aspect: 'Quality Standards', rating: 4.4, description: 'Emphasizes quality over quantity in deliverables', category: 'Standards' }
      ],
      experienceData: [
        { aspect: 'Employee Recognition', rating: 4.2, description: 'Feels valued and appreciated by the company', category: 'Satisfaction' },
        { aspect: 'Career Development', rating: 4.3, description: 'Opportunities for professional advancement', category: 'Growth' },
        { aspect: 'Work Culture', rating: 4.1, description: 'Positive, inclusive, and respectful environment', category: 'Environment' },
        { aspect: 'Program Success', rating: 4.4, description: 'Likelihood to recommend to other students', category: 'Impact' }
      ],
      trendData: [
        { month: 'January', satisfaction: 4.0, engagement: 3.8 },
        { month: 'February', satisfaction: 4.1, engagement: 4.0 },
        { month: 'March', satisfaction: 4.3, engagement: 4.2 },
        { month: 'April', satisfaction: 4.4, engagement: 4.3 }
      ]
    },
    'company3': {
      workEnvironmentData: [
        { aspect: 'Learning Environment', rating: 4.8, description: 'Company fosters enthusiasm and eagerness to learn', category: 'Culture' },
        { aspect: 'Team Collaboration', rating: 4.9, description: 'Encourages cooperation and effective teamwork', category: 'Interaction' },
        { aspect: 'Workplace Adaptability', rating: 4.7, description: 'Promotes flexibility and positive social interaction', category: 'Culture' },
        { aspect: 'Employee Initiative', rating: 4.8, description: 'Supports self-motivation and proactive behavior', category: 'Performance' },
        { aspect: 'Task Ownership', rating: 4.9, description: 'Encourages responsibility and accountability', category: 'Performance' },
        { aspect: 'Work Focus', rating: 4.7, description: 'Maintains environment for concentration and productivity', category: 'Performance' },
        { aspect: 'Professional Conduct', rating: 4.8, description: 'Upholds high standards of professionalism', category: 'Culture' },
        { aspect: 'Attendance & Punctuality', rating: 4.9, description: 'Values consistent attendance and timeliness', category: 'Performance' }
      ],
      performanceData: [
        { aspect: 'Skill Alignment', rating: 4.8, description: 'Tasks match skill level and promote growth', category: 'Development' },
        { aspect: 'Work-Life Balance', rating: 4.7, description: 'Reasonable workload with clear expectations', category: 'Wellbeing' },
        { aspect: 'Workplace Safety', rating: 4.9, description: 'Maintains high safety standards and protocols', category: 'Environment' },
        { aspect: 'Resource Efficiency', rating: 4.8, description: 'Promotes efficient resource utilization', category: 'Operations' },
        { aspect: 'Quality Standards', rating: 4.9, description: 'Emphasizes quality over quantity in deliverables', category: 'Standards' }
      ],
      experienceData: [
        { aspect: 'Employee Recognition', rating: 4.9, description: 'Feels valued and appreciated by the company', category: 'Satisfaction' },
        { aspect: 'Career Development', rating: 4.8, description: 'Opportunities for professional advancement', category: 'Growth' },
        { aspect: 'Work Culture', rating: 4.9, description: 'Positive, inclusive, and respectful environment', category: 'Environment' },
        { aspect: 'Program Success', rating: 4.9, description: 'Likelihood to recommend to other students', category: 'Impact' }
      ],
      trendData: [
        { month: 'January', satisfaction: 4.7, engagement: 4.6 },
        { month: 'February', satisfaction: 4.8, engagement: 4.7 },
        { month: 'March', satisfaction: 4.9, engagement: 4.8 },
        { month: 'April', satisfaction: 4.9, engagement: 4.9 }
      ]
    },
    'company4': {
      workEnvironmentData: [
        { aspect: 'Learning Environment', rating: 4.1, description: 'Company fosters enthusiasm and eagerness to learn', category: 'Culture' },
        { aspect: 'Team Collaboration', rating: 3.9, description: 'Encourages cooperation and effective teamwork', category: 'Interaction' },
        { aspect: 'Workplace Adaptability', rating: 4.0, description: 'Promotes flexibility and positive social interaction', category: 'Culture' },
        { aspect: 'Employee Initiative', rating: 4.2, description: 'Supports self-motivation and proactive behavior', category: 'Performance' },
        { aspect: 'Task Ownership', rating: 4.3, description: 'Encourages responsibility and accountability', category: 'Performance' },
        { aspect: 'Work Focus', rating: 4.1, description: 'Maintains environment for concentration and productivity', category: 'Performance' },
        { aspect: 'Professional Conduct', rating: 4.4, description: 'Upholds high standards of professionalism', category: 'Culture' },
        { aspect: 'Attendance & Punctuality', rating: 4.2, description: 'Values consistent attendance and timeliness', category: 'Performance' }
      ],
      performanceData: [
        { aspect: 'Skill Alignment', rating: 4.0, description: 'Tasks match skill level and promote growth', category: 'Development' },
        { aspect: 'Work-Life Balance', rating: 4.2, description: 'Reasonable workload with clear expectations', category: 'Wellbeing' },
        { aspect: 'Workplace Safety', rating: 4.5, description: 'Maintains high safety standards and protocols', category: 'Environment' },
        { aspect: 'Resource Efficiency', rating: 4.1, description: 'Promotes efficient resource utilization', category: 'Operations' },
        { aspect: 'Quality Standards', rating: 4.3, description: 'Emphasizes quality over quantity in deliverables', category: 'Standards' }
      ],
      experienceData: [
        { aspect: 'Employee Recognition', rating: 4.1, description: 'Feels valued and appreciated by the company', category: 'Satisfaction' },
        { aspect: 'Career Development', rating: 4.2, description: 'Opportunities for professional advancement', category: 'Growth' },
        { aspect: 'Work Culture', rating: 4.0, description: 'Positive, inclusive, and respectful environment', category: 'Environment' },
        { aspect: 'Program Success', rating: 4.3, description: 'Likelihood to recommend to other students', category: 'Impact' }
      ],
      trendData: [
        { month: 'January', satisfaction: 3.9, engagement: 3.7 },
        { month: 'February', satisfaction: 4.0, engagement: 3.9 },
        { month: 'March', satisfaction: 4.2, engagement: 4.1 },
        { month: 'April', satisfaction: 4.3, engagement: 4.2 }
      ]
    }
  };

  // Add company selector component
  const CompanySelector = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
          <MenuItem value="all">All Companies (Average)</MenuItem>
          {companies.map((company) => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {selectedCompany !== 'all' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" color="textSecondary">
            Viewing metrics for: {companies.find(c => c.id === selectedCompany)?.name}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  // Function to get data based on selected company
  const getFilteredData = (dataType) => {
    if (selectedCompany === 'all') {
      switch(dataType) {
        case 'workEnvironmentData':
          return workEnvironmentData;
        case 'performanceData':
          return performanceData;
        case 'experienceData':
          return experienceData;
        case 'trendData':
          return trendData;
        default:
          return [];
      }
    }
    return companyData[selectedCompany]?.[dataType] || [];
  };

  // Work Environment metrics with clear categorization and descriptions
  const workEnvironmentData = [
    { 
      aspect: 'Learning Environment',
      rating: 4.5,
      description: 'Company fosters enthusiasm and eagerness to learn',
      category: 'Culture'
    },
    { 
      aspect: 'Team Collaboration',
      rating: 4.3,
      description: 'Encourages cooperation and effective teamwork',
      category: 'Interaction'
    },
    { 
      aspect: 'Workplace Adaptability',
      rating: 4.2,
      description: 'Promotes flexibility and positive social interaction',
      category: 'Culture'
    },
    { 
      aspect: 'Employee Initiative',
      rating: 4.4,
      description: 'Supports self-motivation and proactive behavior',
      category: 'Performance'
    },
    { 
      aspect: 'Task Ownership',
      rating: 4.6,
      description: 'Encourages responsibility and accountability',
      category: 'Performance'
    },
    { 
      aspect: 'Work Focus',
      rating: 4.3,
      description: 'Maintains environment for concentration and productivity',
      category: 'Performance'
    },
    { 
      aspect: 'Professional Conduct',
      rating: 4.5,
      description: 'Upholds high standards of professionalism',
      category: 'Culture'
    },
    { 
      aspect: 'Attendance & Punctuality',
      rating: 4.7,
      description: 'Values consistent attendance and timeliness',
      category: 'Performance'
    }
  ];

  // Work Performance metrics with detailed descriptions
  const performanceData = [
    { 
      aspect: 'Skill Alignment',
      rating: 4.4,
      description: 'Tasks match skill level and promote growth',
      category: 'Development'
    },
    { 
      aspect: 'Work-Life Balance',
      rating: 4.2,
      description: 'Reasonable workload with clear expectations',
      category: 'Wellbeing'
    },
    { 
      aspect: 'Workplace Safety',
      rating: 4.8,
      description: 'Maintains high safety standards and protocols',
      category: 'Environment'
    },
    { 
      aspect: 'Resource Efficiency',
      rating: 4.3,
      description: 'Promotes efficient resource utilization',
      category: 'Operations'
    },
    { 
      aspect: 'Quality Standards',
      rating: 4.5,
      description: 'Emphasizes quality over quantity in deliverables',
      category: 'Standards'
    }
  ];

  // Overall Experience metrics with meaningful insights
  const experienceData = [
    { 
      aspect: 'Employee Recognition',
      rating: 4.6,
      description: 'Feels valued and appreciated by the company',
      category: 'Satisfaction'
    },
    { 
      aspect: 'Career Development',
      rating: 4.5,
      description: 'Opportunities for professional advancement',
      category: 'Growth'
    },
    { 
      aspect: 'Work Culture',
      rating: 4.4,
      description: 'Positive, inclusive, and respectful environment',
      category: 'Environment'
    },
    { 
      aspect: 'Program Success',
      rating: 4.7,
      description: 'Likelihood to recommend to other students',
      category: 'Impact'
    }
  ];

  // Monthly trend data with clear metrics
  const trendData = [
    { month: 'January', satisfaction: 4.2, engagement: 4.0 },
    { month: 'February', satisfaction: 4.3, engagement: 4.2 },
    { month: 'March', satisfaction: 4.5, engagement: 4.4 },
    { month: 'April', satisfaction: 4.4, engagement: 4.5 }
  ];

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