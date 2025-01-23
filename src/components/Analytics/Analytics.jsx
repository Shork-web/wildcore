import React, { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import StudentMetrics from './StudentMetrics';
import CompanyMetrics from './CompanyMetrics';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function Analytics() {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg">
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 'bold',
          color: '#800000',
          textAlign: 'center'
        }}
      >
        Program Analytics
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tab} 
          onChange={(e, newValue) => setTab(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              color: '#800000',
              '&.Mui-selected': {
                color: '#800000',
                fontWeight: 'bold',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#800000',
            }
          }}
        >
          <Tab label="Student Metrics" />
          <Tab label="Company Metrics" />
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0}>
        <StudentMetrics />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <CompanyMetrics />
      </TabPanel>
    </Container>
  );
}

export default Analytics; 