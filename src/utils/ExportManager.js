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