import React from 'react';
import {
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  School,
  PersonAdd,
  Search,
  Help,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function FAQ() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "System Overview",
      icon: <School />,
      defaultExpanded: true,
      items: [
        {
          primary: "What is WILD C.O.R.E?",
          secondary: `WILD C.O.R.E (Work Integrated Learning Data Collection and Reporting Engine) is your central hub for managing student internships. 

Key Benefits:
• Streamlined record management
• Real-time tracking of student progress
• Easy access to internship information
• Secure data storage
• Efficient reporting system`
        },
        {
          primary: "Dashboard Features",
          secondary: `Your dashboard provides three main functions:

1. Add New Student
   • Quick access to student registration
   • Comprehensive data entry form
   • Real-time validation

2. Student Records
   • Complete list of all students
   • Advanced search and filter options
   • Easy editing capabilities

3. Help Resources
   • Detailed guidance
   • Troubleshooting tips
   • Support contacts`
        }
      ]
    },
    {
      title: "Managing Students",
      icon: <PersonAdd />,
      items: [
        {
          primary: "Adding a New Student",
          secondary: `Step-by-Step Guide:

1. From Dashboard:
   • Click "Add New Student"
   • Select student's program
   • Enter personal details

2. Required Information:
   • Student Name*
   • Gender*
   • Program*
   • Semester*
   • School Year*
   • Partner Company*
   • Location*

3. Optional Details:
   • Start/End Dates
   • Concerns
   • Solutions
   • Recommendations
   • Evaluation

* Required fields`
        },
        {
          primary: "Editing Student Records",
          secondary: `Making Changes:

1. Locate Student:
   • Go to Student List
   • Use search or filters
   • Find target student

2. Edit Process:
   • Click edit (pencil) icon
   • Update necessary fields
   • Review changes
   • Save updates

Note: Creation date and creator cannot be modified.`
        }
      ]
    },
    {
      title: "Search & Filter Tools",
      icon: <Search />,
      items: [
        {
          primary: "Search Features",
          secondary: `Quick Search Options:

1. Search by:
   • Student Name
   • Program
   • Company
   • Location

2. Search Tips:
   • Results update as you type
   • Case-insensitive
   • Partial matches work
   • Clear search to reset`
        },
        {
          primary: "Advanced Filtering",
          secondary: `Filter Categories:

1. Academic Filters:
   • Program
   • Semester (First/Second/Summer)
   • School Year

2. Company Filters:
   • Partner Company
   • Location

Tips:
• Combine multiple filters
• Clear filters using reset button
• Save common filter combinations`
        }
      ]
    },
    {
      title: "Best Practices",
      icon: <CheckCircle />,
      items: [
        {
          primary: "Data Entry Standards",
          secondary: `Quality Guidelines:

1. Names & Titles:
   • Use proper capitalization
   • Include full names
   • Verify spelling

2. Dates & Times:
   • Use correct format
   • Verify start/end dates
   • Keep duration accurate

3. Company Information:
   • Use official company names
   • Include complete addresses
   • Verify contact details`
        },
        {
          primary: "Record Management",
          secondary: `Maintenance Tips:

1. Regular Updates:
   • Review records monthly
   • Update status changes
   • Document progress

2. Quality Checks:
   • Verify data accuracy
   • Complete all sections
   • Maintain consistency

3. Documentation:
   • Record all concerns
   • Note solutions provided
   • Track recommendations`
        }
      ]
    },
    {
      title: "Help & Support",
      icon: <Help />,
      items: [
        {
          primary: "Technical Support",
          secondary: `Contact Information:

1. Primary Support:
   • Email: iverson.merto@cit.edu / nathanieledryd.negapatan@cit.edu
   • Response time: 24-48 hours

2. Emergency Help:
   • IT Help Desk: 09533347008  / 09664731708
   • Available: Mon-Fri, 8am-5pm

3. Additional Resources:
   • Department Admin
   • System Documentation
   • Training Materials`
        },
        {
          primary: "Common Issues",
          secondary: `Troubleshooting Steps:

1. System Access:
   • Check internet connection
   • Clear browser cache
   • Try different browser

2. Data Entry:
   • Verify required fields
   • Check date formats
   • Confirm before submitting

3. Performance:
   • Refresh the page
   • Close unused tabs
   • Update browser`
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{
          mb: 2,
          color: '#800000',
          '&:hover': {
            backgroundColor: 'rgba(128, 0, 0, 0.08)',
          },
        }}
      >
        Back to Dashboard
      </Button>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #800000, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Instructor's Guide to WILD C.O.R.E
        </Typography>

        <Box sx={{ mt: 3 }}>
          {sections.map((section, index) => (
            <Accordion key={index} defaultExpanded={section.defaultExpanded}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ 
                  backgroundColor: 'rgba(128, 0, 0, 0.05)',
                  '&:hover': { backgroundColor: 'rgba(128, 0, 0, 0.08)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {React.cloneElement(section.icon, { sx: { color: '#800000' } })}
                  <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold' }}>
                    {section.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {section.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex}>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" sx={{ color: '#800000', fontWeight: 'bold', mb: 1 }}>
                            {item.primary}
                          </Typography>
                        }
                        secondary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              color: 'text.secondary',
                              '& span': { fontWeight: 'bold' }
                            }}
                          >
                            {item.secondary}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}

export default FAQ; 