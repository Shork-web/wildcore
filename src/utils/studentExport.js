import * as XLSX from 'xlsx';

export const exportStudentsToExcel = (students, userRole, fileName = 'student_interns.xlsx', heiName = '', heiAddress = '', academicYear = '') => {
  // Check if user is admin
  if (userRole !== 'admin') {
    throw new Error('Export functionality is only available for admin users');
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
    alignment: { vertical: 'center' }
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
};