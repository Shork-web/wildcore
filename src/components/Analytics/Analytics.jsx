import React, { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import StudentMetrics from './StudentMetrics';
import CompanyMetrics from './CompanyMetrics';

function TabPanel(props) {
  const { children, value, index, id } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${id}-tabpanel-${index}`}
      aria-labelledby={`${id}-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(id, index) {
  return {
    id: `${id}-tab-${index}`,
    'aria-controls': `${id}-tabpanel-${index}`,
  };
}

function Analytics() {
  const [tab, setTab] = useState(0);
  const tabsId = "analytics-tabs";

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
          aria-label="analytics tabs"
          id={tabsId}
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
          <Tab label="Student Metrics" {...a11yProps(tabsId, 0)} />
          <Tab label="Company Metrics" {...a11yProps(tabsId, 1)} />
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0} id={tabsId}>
        <StudentMetrics />
      </TabPanel>
      <TabPanel value={tab} index={1} id={tabsId}>
        <CompanyMetrics />
      </TabPanel>
    </Container>
  );
}

export default Analytics; 