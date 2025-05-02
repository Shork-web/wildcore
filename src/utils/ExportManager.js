import * as XLSX from 'xlsx';
// Make sure XLSX is properly loaded
if (!XLSX || !XLSX.utils || !XLSX.writeFile) {
  console.error('XLSX library not properly loaded:', XLSX);
}

class ExportManager {
  constructor() {
    this._headerStyle = {
      font: { 
        bold: true,
        color: { rgb: "FFFFFF" }
      },
      fill: { 
        fgColor: { rgb: "800000" } 
      },
      alignment: { 
        horizontal: 'center',
        vertical: 'center'
      }
    };
  }

  /**
   * Export concerns and solutions to Excel
   * @param {Array} students - Array of student objects with concerns data
   * @param {string} fileName - Name of the output file
   * @param {string} heiName - Name of the Higher Education Institution
   * @param {string} heiAddress - Address of the Higher Education Institution
   * @param {string} academicYear - Academic year for the report
   */
  exportConcernsToExcel(students, fileName = 'concerns_solutions.xlsx', heiName = '', heiAddress = '', academicYear = '') {
    try {
      console.log('Starting export process with', students.length, 'students');
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create header data for the CHED report format
      const headerData = [
        ['Commission on Higher Education'],
        ['Regional Office VII'],
        [],
        ['Annual Report in the Implementation of'],
        ['Student Internship Program in the Philippines (SIPP)'],
        [`AY ${academicYear}`],
        [],
        [`HEI: ${heiName}`],
        [`Address: ${heiAddress}`],
        []
      ];

      // Create the table headers
      const tableHeaders = [
        ['Program', 'Issues and Concerns Encountered', 'Solutions', 'Recommendations']
      ];

      // Format the student data for Excel export
      const studentRows = students.map(student => [
        student.program || 'N/A',
        student.concerns || 'N/A',
        student.solutions || 'N/A',
        student.recommendations || 'N/A'
      ]);

      // Add empty rows for additional entries
      const emptyRows = Array(10).fill().map(() => ['', '', '', '']);

      // Add footer for signatures
      const footerData = [
        [],
        ['PREPARED BY:', '', 'CERTIFIED CORRECT:'],
        ['(Name and Signature)', '', '(Name and Signature)']
      ];

      // Combine all data
      const allData = [...headerData, ...tableHeaders, ...studentRows, ...emptyRows, ...footerData];

      // Create a worksheet from the combined data
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 25 }, // Program
        { width: 40 }, // Issues and Concerns Encountered
        { width: 40 }, // Solutions
        { width: 40 }  // Recommendations
      ];

      // Set row heights for header section
      worksheet['!rows'] = Array(allData.length).fill().map((_, i) => {
        // Make header rows slightly taller
        if (i < headerData.length) {
          return { hpt: 20 }; // Height in points
        }
        return { hpt: 18 }; // Default row height
      });

      // Apply styling to title rows
      const titleStyle = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: 'center' }
      };

      // Apply styling to table header row
      const tableHeaderStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '800000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Apply styling to data cells
      const dataCellStyle = {
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { 
          horizontal: 'center',
          vertical: 'center' 
        }
      };

      // Apply styling to footer
      const footerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' }
      };

      // Apply styles to cells
      for (let i = 0; i < allData.length; i++) {
        // Title styling (first 7 rows)
        if (i < 7) {
          for (let j = 0; j < 4; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = titleStyle;
          }
        }
        
        // Table header styling
        if (i === headerData.length) {
          for (let j = 0; j < 4; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = tableHeaderStyle;
          }
        }
        
        // Data cells styling
        if (i > headerData.length && i < (headerData.length + studentRows.length + emptyRows.length + 1)) {
          for (let j = 0; j < 4; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = dataCellStyle;
          }
        }
        
        // Footer styling
        if (i >= (headerData.length + studentRows.length + emptyRows.length + 1)) {
          for (let j = 0; j < 4; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = footerStyle;
          }
        }
      }

      // Merge cells for title headers
      worksheet['!merges'] = [
        // Commission on Higher Education
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        // Regional Office VII
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
        // Annual Report in the Implementation of
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
        // Student Internship Program in the Philippines (SIPP)
        { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
        // AY
        { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } },
        // Footer cells
        { s: { r: allData.length - 2, c: 0 }, e: { r: allData.length - 2, c: 0 } },
        { s: { r: allData.length - 2, c: 2 }, e: { r: allData.length - 2, c: 3 } },
        { s: { r: allData.length - 1, c: 0 }, e: { r: allData.length - 1, c: 0 } },
        { s: { r: allData.length - 1, c: 2 }, e: { r: allData.length - 1, c: 3 } }
      ];

      console.log('Workbook created, attempting to write file...');
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Concerns & Solutions');
      
      // Write the file and trigger download
      XLSX.writeFile(workbook, fileName);
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error in exportConcernsToExcel:', error);
      throw error;
    }
  }

  /**
   * Export student data to Excel (admin and instructor)
   * @param {Array} students - Array of student objects
   * @param {string} userRole - Role of the current user
   * @param {string} fileName - Name of the output file
   */
  exportStudentsToExcel(students, userRole, fileName = 'student_interns.xlsx', heiName = '', heiAddress = '', academicYear = '') {
    // Check if user is admin or instructor
    if (userRole !== 'admin' && userRole !== 'instructor') {
      throw new Error('Export functionality is only available for admin and instructor users');
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Create header data for the CHED report format
    const headerData = [
      ['Commission on Higher Education'],
      ['Regional Office VII'],
      [],
      ['Report on the'],
      ['List of Host Training Establishment (HTEs) and Student Interns Participating in the'],
      ['Student Internship Program in the Philippines [SIPP]'],
      [`AY ${academicYear}`],
      [],
      [`HEI: ${heiName}`],
      [`Address: ${heiAddress}`],
      []
    ];

    // Create the table headers
    const tableHeaders = [
      ['Partner Host Training Establishments (HTEs)', 'Name of Student Interns', 'Program', 'Gender', 'Dates of Duration of the Internship']
    ];

    // Format the student data for Excel export
    const studentRows = students.map(student => {
      // Format dates properly
      const startDate = student.startDate ? new Date(student.startDate).toLocaleDateString() : 'N/A';
      const endDate = student.endDate ? new Date(student.endDate).toLocaleDateString() : 'N/A';
      // Show available dates even if only one is present
      const duration = (startDate !== 'N/A' || endDate !== 'N/A') ? `${startDate} - ${endDate}` : 'N/A';

      return [
        student.partnerCompany || 'N/A',
        student.name || 'N/A',
        student.program || 'N/A',
        student.gender || 'N/A',
        duration
      ];
    });

    // Add empty rows for additional entries
    const emptyRows = Array(10).fill().map(() => ['', '', '', '', '']);

    // Add footer for signatures
    const footerData = [
      [],
      ['PREPARED BY:', '', '', 'CERTIFIED CORRECT:'],
      ['[Name and Signature]', '', '', '[Name and Signature]']
    ];

    // Combine all data
    const allData = [...headerData, ...tableHeaders, ...studentRows, ...emptyRows, ...footerData];

    // Create a worksheet from the combined data
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 40 }, // Partner Host Training Establishments (HTEs)
      { width: 30 }, // Name of Student Interns
      { width: 35 }, // Program
      { width: 10 }, // Gender
      { width: 25 }  // Dates of Duration of the Internship
    ];

    // Set row heights for header section
    worksheet['!rows'] = Array(allData.length).fill().map((_, i) => {
      // Make header rows slightly taller
      if (i < headerData.length) {
        return { hpt: 20 }; // Height in points
      }
      return { hpt: 18 }; // Default row height
    });

    // Apply styling to title rows
    const titleStyle = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: 'center' }
    };

    // Apply styling to table header row
    const tableHeaderStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '800000' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Apply styling to data cells
    const dataCellStyle = {
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      },
      alignment: { 
        horizontal: 'center',
        vertical: 'center' 
      }
    };

    // Apply styling to footer
    const footerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center' }
    };

    // Apply styles to cells
    for (let i = 0; i < allData.length; i++) {
      // Title styling (first 7 rows)
      if (i < 7) {
        for (let j = 0; j < 5; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = titleStyle;
        }
      }
      
      // Table header styling
      if (i === headerData.length) {
        for (let j = 0; j < 5; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = tableHeaderStyle;
        }
      }
      
      // Data cells styling
      if (i > headerData.length && i < (headerData.length + studentRows.length + emptyRows.length + 1)) {
        for (let j = 0; j < 5; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = dataCellStyle;
        }
      }
      
      // Footer styling
      if (i >= (headerData.length + studentRows.length + emptyRows.length + 1)) {
        for (let j = 0; j < 5; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = footerStyle;
        }
      }
    }

    // Merge cells for title headers
    worksheet['!merges'] = [
      // Commission on Higher Education
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      // Regional Office VII
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      // Report on the
      { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
      // List of Host Training...
      { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
      // Student Internship Program...
      { s: { r: 5, c: 0 }, e: { r: 5, c: 4 } },
      // AY
      { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } },
      // Footer cells
      { s: { r: allData.length - 2, c: 0 }, e: { r: allData.length - 2, c: 1 } },
      { s: { r: allData.length - 2, c: 3 }, e: { r: allData.length - 2, c: 4 } },
      { s: { r: allData.length - 1, c: 0 }, e: { r: allData.length - 1, c: 1 } },
      { s: { r: allData.length - 1, c: 3 }, e: { r: allData.length - 1, c: 4 } }
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Interns');

    // Write the file and trigger download
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Format concerns data for export
   * @param {Array} data - Array of student objects with concerns data
   * @returns {Array} Formatted data with headers and rows
   */
  formatConcernsData(data) {
    const headers = [
      'Student Name',
      'Program',
      'Partner Company',
      'Concerns',
      'Solutions',
      'Recommendations'
    ];

    const rows = data.map(item => [
      item.name,
      item.program,
      item.partnerCompany,
      item.concerns,
      item.solutions,
      item.recommendations
    ]);

    return [headers, ...rows];
  }

  /**
   * Export survey data to Excel
   * @param {Array} students - Array of student objects with evaluation data
   * @param {string} fileName - Name of the output file
   * @param {string} heiName - Name of the Higher Education Institution
   * @param {string} heiAddress - Address of the Higher Education Institution
   * @param {string} academicYear - Academic year for the report
   */
  exportSurveyToExcel(students, fileName = 'survey_evaluations.xlsx', heiName = '', heiAddress = '', academicYear = '') {
    try {
      console.log('Starting survey export process with', students.length, 'students');
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create header data for the report
      const headerData = [
        ['Commission on Higher Education'],
        ['Regional Office VII'],
        [],
        ['Survey Evaluation Results Report'],
        ['Student Internship Program in the Philippines (SIPP)'],
        [`AY ${academicYear}`],
        [],
        [`HEI: ${heiName}`],
        [`Address: ${heiAddress}`],
        []
      ];

      // Create a map of students by ID to stack midterm and final evaluations together
      const studentMap = new Map();
      
      // Process each student into the map
      students.forEach(student => {
        const studentId = student.studentId || '';
        
        // If this student isn't in the map yet, add them
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: student.studentName || 'N/A',
            program: student.program || 'N/A',
            company: student.company || student.companyName || 'N/A',
            section: student.section || 'N/A',
            midterm: student.midtermEvaluationData ? this._processSurveyMetrics(student.midtermEvaluationData) : null,
            final: student.finalEvaluationData ? this._processSurveyMetrics(student.finalEvaluationData) : null
          });
        } else {
          // Student already exists in map, update if needed
          const existingStudent = studentMap.get(studentId);
          if (student.midtermEvaluationData && !existingStudent.midterm) {
            existingStudent.midterm = this._processSurveyMetrics(student.midtermEvaluationData);
          }
          if (student.finalEvaluationData && !existingStudent.final) {
            existingStudent.final = this._processSurveyMetrics(student.finalEvaluationData);
          }
          studentMap.set(studentId, existingStudent);
        }
      });
      
      // Create the table headers with midterm and final columns
      const tableHeaders = [
        ['Name', 'Program', 'Section', 'Company', 
         'Midterm Teamwork', 'Midterm Communication', 'Midterm Punctuality', 'Midterm Initiative', 
         'Midterm Tech Skills', 'Midterm Adaptability', 'Midterm Productivity', 'Midterm Critical Thinking', 'Midterm Overall',
         'Final Teamwork', 'Final Communication', 'Final Punctuality', 'Final Initiative', 
         'Final Tech Skills', 'Final Adaptability', 'Final Productivity', 'Final Critical Thinking', 'Final Overall']
      ];

      // Format the survey data for Excel export
      const surveyRows = Array.from(studentMap.values()).map(student => {
        const midterm = student.midterm || {
          teamwork: 0,
          communication: 0,
          punctuality: 0,
          initiative: 0,
          technicalSkills: 0,
          adaptability: 0,
          productivity: 0,
          criticalThinking: 0,
          overallRating: 0
        };
        
        const final = student.final || {
          teamwork: 0,
          communication: 0,
          punctuality: 0,
          initiative: 0,
          technicalSkills: 0,
          adaptability: 0,
          productivity: 0,
          criticalThinking: 0,
          overallRating: 0
        };
        
        return [
          student.name,
          student.program,
          student.section,
          student.company,
          // Midterm evaluations
          midterm.teamwork ? midterm.teamwork.toFixed(1) : 'N/A',
          midterm.communication ? midterm.communication.toFixed(1) : 'N/A',
          midterm.punctuality ? midterm.punctuality.toFixed(1) : 'N/A',
          midterm.initiative ? midterm.initiative.toFixed(1) : 'N/A',
          midterm.technicalSkills ? midterm.technicalSkills.toFixed(1) : 'N/A',
          midterm.adaptability ? midterm.adaptability.toFixed(1) : 'N/A',
          midterm.productivity ? midterm.productivity.toFixed(1) : 'N/A',
          midterm.criticalThinking ? midterm.criticalThinking.toFixed(1) : 'N/A',
          midterm.overallRating ? midterm.overallRating.toFixed(1) : 'N/A',
          // Final evaluations
          final.teamwork ? final.teamwork.toFixed(1) : 'N/A',
          final.communication ? final.communication.toFixed(1) : 'N/A',
          final.punctuality ? final.punctuality.toFixed(1) : 'N/A',
          final.initiative ? final.initiative.toFixed(1) : 'N/A',
          final.technicalSkills ? final.technicalSkills.toFixed(1) : 'N/A',
          final.adaptability ? final.adaptability.toFixed(1) : 'N/A',
          final.productivity ? final.productivity.toFixed(1) : 'N/A',
          final.criticalThinking ? final.criticalThinking.toFixed(1) : 'N/A',
          final.overallRating ? final.overallRating.toFixed(1) : 'N/A'
        ];
      });

      // Combine all data
      const allData = [...headerData, ...tableHeaders, ...surveyRows];

      // Create a worksheet from the combined data
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 30 }, // Name
        { width: 20 }, // Program
        { width: 15 }, // Section
        { width: 30 }, // Company
        { width: 10 }, // Midterm Teamwork
        { width: 10 }, // Midterm Communication
        { width: 10 }, // Midterm Punctuality
        { width: 10 }, // Midterm Initiative
        { width: 10 }, // Midterm Tech Skills
        { width: 10 }, // Midterm Adaptability
        { width: 10 }, // Midterm Productivity
        { width: 10 }, // Midterm Critical Thinking
        { width: 10 }, // Midterm Overall
        { width: 10 }, // Final Teamwork
        { width: 10 }, // Final Communication
        { width: 10 }, // Final Punctuality
        { width: 10 }, // Final Initiative
        { width: 10 }, // Final Tech Skills
        { width: 10 }, // Final Adaptability
        { width: 10 }, // Final Productivity
        { width: 10 }, // Final Critical Thinking
        { width: 10 }  // Final Overall
      ];

      // Apply styling similar to other export functions
      // Apply styles to cells
      const titleStyle = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: 'center' }
      };
      
      const tableHeaderStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '800000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      const dataCellStyle = {
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { 
          horizontal: 'center',
          vertical: 'center' 
        }
      };

      // Apply styles to cells
      for (let i = 0; i < allData.length; i++) {
        // Title styling (first 7 rows)
        if (i < 7) {
          for (let j = 0; j < 22; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = titleStyle;
          }
        }
        
        // Table header styling
        if (i === headerData.length) {
          for (let j = 0; j < 22; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = tableHeaderStyle;
          }
        }
        
        // Data cells styling
        if (i > headerData.length) {
          for (let j = 0; j < 22; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = dataCellStyle;
            
            // Color code the cells based on ratings
            if (j >= 4 && j <= 12) { // Midterm ratings
              if (worksheet[cellRef].v !== 'N/A') {
                const rating = parseFloat(worksheet[cellRef].v);
                worksheet[cellRef].s = {
                  ...dataCellStyle,
                  font: { 
                    color: { rgb: this._getRatingColorCode(rating) },
                    bold: j === 12 // Make overall rating bold
                  },
                  fill: { 
                    fgColor: { rgb: this._getRatingBgColorCode(rating) }
                  }
                };
              }
            } else if (j >= 13 && j <= 21) { // Final ratings
              if (worksheet[cellRef].v !== 'N/A') {
                const rating = parseFloat(worksheet[cellRef].v);
                worksheet[cellRef].s = {
                  ...dataCellStyle,
                  font: { 
                    color: { rgb: this._getRatingColorCode(rating) },
                    bold: j === 21 // Make overall rating bold
                  },
                  fill: { 
                    fgColor: { rgb: this._getRatingBgColorCode(rating) }
                  }
                };
              }
            }
          }
        }
      }

      // Merge cells for title headers
      worksheet['!merges'] = [
        // Commission on Higher Education
        { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } },
        // Regional Office VII
        { s: { r: 1, c: 0 }, e: { r: 1, c: 21 } },
        // Survey Evaluation Results Report
        { s: { r: 3, c: 0 }, e: { r: 3, c: 21 } },
        // Student Internship Program in the Philippines (SIPP)
        { s: { r: 4, c: 0 }, e: { r: 4, c: 21 } },
        // AY
        { s: { r: 5, c: 0 }, e: { r: 5, c: 21 } }
      ];

      console.log('Workbook created, attempting to write file...');
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Evaluations');
      
      // Write the file and trigger download
      XLSX.writeFile(workbook, fileName);
      
      console.log('Survey export completed successfully');
    } catch (error) {
      console.error('Error in exportSurveyToExcel:', error);
      throw error;
    }
  }

  /**
   * Helper method to process survey metrics from evaluation data
   * @param {Object} surveyData - Evaluation data from the student
   * @returns {Object} Processed metrics
   */
  _processSurveyMetrics(surveyData) {
    if (!surveyData) return {
      teamwork: 0,
      communication: 0,
      punctuality: 0,
      initiative: 0,
      technicalSkills: 0,
      adaptability: 0,
      productivity: 0,
      criticalThinking: 0,
      overallRating: 0
    };
    
    // Helper function to find numeric ratings
    const findRating = (data, keyPatterns) => {
      for (const key of Object.keys(data)) {
        for (const pattern of keyPatterns) {
          if (key.toLowerCase().includes(pattern) && !isNaN(data[key]) && data[key] > 0 && data[key] <= 5) {
            return Number(data[key]);
          }
        }
      }
      return 0;
    };
    
    // Extract work attitude metrics
    const teamwork = findRating(surveyData, ['teamwork', 'cooperation', 'team', 'willingness']);
    const communication = findRating(surveyData, ['communication', 'verbal', 'written', 'attentiveness']);
    const punctuality = findRating(surveyData, ['punctuality', 'attendance', 'time']);
    const initiative = findRating(surveyData, ['initiative', 'proactive', 'industriousness']);
    
    // Extract work performance metrics
    const technicalSkills = findRating(surveyData, ['technical', 'skill', 'knowledge', 'comprehension']);
    const adaptability = findRating(surveyData, ['adaptability', 'adapt', 'flexible', 'sociability']);
    const productivity = findRating(surveyData, ['productivity', 'quality', 'quantity', 'work']);
    const criticalThinking = findRating(surveyData, ['critical', 'thinking', 'analytical', 'problem']);
    
    // Calculate overall rating
    const metrics = [teamwork, communication, punctuality, initiative, technicalSkills, adaptability, productivity, criticalThinking];
    const validMetrics = metrics.filter(m => m > 0);
    const overallRating = validMetrics.length > 0 ? validMetrics.reduce((sum, val) => sum + val, 0) / validMetrics.length : 0;
    
    return {
      teamwork,
      communication,
      punctuality,
      initiative,
      technicalSkills,
      adaptability,
      productivity,
      criticalThinking,
      overallRating
    };
  }

  /**
   * Helper method to get color code for rating
   * @private
   * @param {number} rating - The rating value
   * @returns {string} Color code in RGB format
   */
  _getRatingColorCode(rating) {
    if (rating >= 4.5) return '2E7D32'; // Green for Excellent
    if (rating >= 4.0) return '1976D2'; // Blue for Good
    if (rating >= 3.0) return 'ED6C02'; // Orange for Satisfactory
    return 'D32F2F'; // Red for Needs Improvement
  }

  /**
   * Helper method to get background color code for rating
   * @private
   * @param {number} rating - The rating value
   * @returns {string} Background color code in RGB format
   */
  _getRatingBgColorCode(rating) {
    if (rating >= 4.5) return 'E8F5E9'; // Light green
    if (rating >= 4.0) return 'E3F2FD'; // Light blue
    if (rating >= 3.0) return 'FFF3E0'; // Light orange
    return 'FFEBEE'; // Light red
  }

  /**
   * Apply header styling to worksheet
   * @private
   * @param {Object} worksheet - XLSX worksheet object
   */
  _applyHeaderStyle(worksheet) {
    // Get the range of the data
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Apply header style to first row
    for(let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if(!worksheet[address]) continue;
      worksheet[address].s = {
        ...this._headerStyle,
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }
}

// Create and export a singleton instance
const exportManager = new ExportManager();
export default exportManager;

// For backward compatibility
export const exportConcernsToExcel = (students, fileName) => {
  return exportManager.exportConcernsToExcel(students, fileName);
};

export const exportStudentsToExcel = (students, userRole, fileName) => {
  return exportManager.exportStudentsToExcel(students, userRole, fileName);
};

export const exportConcerns = (data) => {
  return exportManager.formatConcernsData(data);
};

export const exportSurveyData = (students, fileName, heiName = '', heiAddress = '', academicYear = '') => {
  return exportManager.exportSurveyToExcel(students, fileName, heiName, heiAddress, academicYear);
};